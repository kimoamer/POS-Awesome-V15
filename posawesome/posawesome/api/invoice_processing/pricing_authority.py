"""Server-authoritative POS pricing, discount, and offer reconciliation."""

from __future__ import annotations

import json
from dataclasses import dataclass, field

import frappe
from frappe import _
from frappe.utils import cint, flt, getdate, nowdate


def _value(source, key, default=None):
    if isinstance(source, dict):
        return source.get(key, default)
    getter = getattr(source, "get", None)
    if callable(getter):
        return getter(key, default)
    return getattr(source, key, default)


def _as_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except Exception:
            parsed = [part.strip() for part in value.split(",") if part.strip()]
        return parsed if isinstance(parsed, list) else []
    return []


def _offer_id(value):
    if isinstance(value, dict):
        return str(value.get("row_id") or value.get("offer_name") or value.get("name") or "").strip()
    return str(value or "").strip()


def _line_offer_ids(line):
    return [identifier for identifier in (_offer_id(value) for value in _as_list(_value(line, "posa_offers"))) if identifier]


@dataclass
class PricingSnapshot:
    item_code: str
    row_id: str
    rate: float
    discount_percentage: float
    discount_amount: float
    offer_ids: list[str] = field(default_factory=list)
    offer_applied: bool = False
    locked_price: bool = False


@dataclass
class PricingState:
    snapshots: list[PricingSnapshot]
    invoice_offer_claims: list
    free_rows: list[dict]
    active_offers: dict[str, dict]


def _active_offer_map(profile_name):
    from posawesome.posawesome.api.offers import get_offers

    offers = get_offers(profile_name) or []
    result = {}
    for offer in offers:
        serialized = dict(offer)
        for key in (_offer_id(serialized), str(serialized.get("name") or "").strip()):
            if key:
                result[key] = serialized
    return result


def capture_pricing_state(payload, profile):
    raw_items = list(payload.get("items") or [])
    snapshots = []
    free_rows = []
    all_claims = list(_as_list(payload.get("posa_offers")))
    has_offer_claim = bool(all_claims)

    for index, row in enumerate(raw_items, start=1):
        is_free = cint(row.get("is_free_item")) or cint(row.get("posa_is_offer")) or row.get(
            "auto_free_source"
        )
        if is_free:
            free_rows.append(dict(row))
            has_offer_claim = True
            continue
        offer_ids = _line_offer_ids(row)
        has_offer_claim = has_offer_claim or bool(offer_ids) or bool(cint(row.get("posa_offer_applied")))
        snapshots.append(
            PricingSnapshot(
                item_code=str(row.get("item_code") or ""),
                # Return payloads intentionally drop the child name but retain
                # ERPNext's immutable link to the original invoice row. Prefer
                # that link over the UI-only random posa_row_id.
                row_id=str(
                    row.get("sales_invoice_item")
                    or row.get("pos_invoice_item")
                    or row.get("name")
                    or row.get("posa_row_id")
                    or index
                ),
                rate=flt(row.get("rate")),
                discount_percentage=flt(row.get("discount_percentage")),
                discount_amount=flt(row.get("discount_amount")),
                offer_ids=offer_ids,
                offer_applied=bool(cint(row.get("posa_offer_applied")) or offer_ids),
                locked_price=bool(cint(row.get("locked_price"))),
            )
        )

    active_offers = _active_offer_map(profile.name) if has_offer_claim else {}
    return PricingState(snapshots, all_claims, free_rows, active_offers)


def has_valid_offer_claim(line, state, offer_type=None):
    identifiers = _line_offer_ids(line)
    if not identifiers and cint(_value(line, "posa_offer_applied")):
        return False
    offers = [state.active_offers.get(identifier) for identifier in identifiers]
    offers = [offer for offer in offers if offer]
    if offer_type:
        offers = [offer for offer in offers if offer.get("offer") == offer_type]
    return bool(offers)


def prepare_invoice_pricing(invoice_doc, profile, state):
    """Remove monetary fields the client is not allowed to author."""

    allow_rate = cint(profile.get("posa_allow_user_to_edit_rate"))
    allow_discount = cint(profile.get("posa_allow_user_to_edit_item_discount"))
    allow_additional_discount = cint(
        profile.get("posa_allow_user_to_edit_additional_discount")
    )
    is_return = cint(invoice_doc.get("is_return"))
    for index, item in enumerate(invoice_doc.get("items") or []):
        snapshot = state.snapshots[index] if index < len(state.snapshots) else None
        offer_claim = bool(snapshot and snapshot.offer_applied)
        locked_return = bool(is_return and invoice_doc.get("return_against") and snapshot and snapshot.locked_price)
        if not allow_rate and not offer_claim and not locked_return:
            item.rate = None
            item.base_rate = None
            item.price_list_rate = None
            item.base_price_list_rate = None
        if not allow_discount and not offer_claim and not locked_return:
            item.discount_percentage = 0
            item.discount_amount = 0
            item.base_discount_amount = 0
        item.pricing_rules = None

    # Verified Grand Total offers are re-applied later. Until then, discard
    # invoice-level discount fields authored by an untrusted client.
    if not allow_additional_discount:
        invoice_doc.discount_amount = 0
        invoice_doc.additional_discount_percentage = 0

    invoice_doc.ignore_pricing_rule = 0
    invoice_doc.flags.ignore_pricing_rule = False


def _item_matches_offer(item, offer):
    apply_on = str(offer.get("apply_on") or "").strip()
    if apply_on == "Transaction":
        return True
    if apply_on == "Item Code":
        return item.get("item_code") == offer.get("item")
    if apply_on == "Brand":
        return item.get("brand") == offer.get("brand")
    if apply_on == "Item Group":
        item_group = item.get("item_group") or frappe.get_cached_value(
            "Item", item.get("item_code"), "item_group"
        )
        offer_group = offer.get("item_group")
        if item_group == offer_group:
            return True
        if not item_group or not offer_group:
            return False
        child_bounds = frappe.db.get_value("Item Group", item_group, ["lft", "rgt"], as_dict=True)
        parent_bounds = frappe.db.get_value("Item Group", offer_group, ["lft", "rgt"], as_dict=True)
        return bool(
            child_bounds
            and parent_bounds
            and child_bounds.lft >= parent_bounds.lft
            and child_bounds.rgt <= parent_bounds.rgt
        )
    return False


def _coupon_is_valid(invoice_doc, offer):
    if not cint(offer.get("coupon_based")):
        return True
    claims = _as_list(invoice_doc.get("posa_coupons"))
    coupon_codes = {
        str(claim.get("coupon") or claim.get("coupon_code") or "").strip()
        for claim in claims
        if isinstance(claim, dict) and claim.get("pos_offer") == offer.get("name")
    }
    if not coupon_codes:
        return False
    rows = frappe.get_list(
        "POS Coupon",
        filters={
            "name": ["in", sorted(coupon_codes)],
            "company": invoice_doc.company,
            "used": 0,
        },
        fields=["name", "customer", "valid_from", "valid_upto"],
    )
    today = getdate(invoice_doc.posting_date or nowdate())
    return any(
        (not row.customer or row.customer == invoice_doc.customer)
        and (not row.valid_from or getdate(row.valid_from) <= today)
        and (not row.valid_upto or getdate(row.valid_upto) >= today)
        for row in rows
    )


def _offer_conditions_met(invoice_doc, offer):
    source_items = [
        item
        for item in (invoice_doc.get("items") or [])
        if not cint(item.get("is_free_item")) and _item_matches_offer(item, offer)
    ]
    if not source_items:
        return False
    qty = sum(abs(flt(item.get("qty"))) for item in source_items)
    amount = sum(abs(flt(item.get("price_list_rate"))) * abs(flt(item.get("qty"))) for item in source_items)
    minimum_qty = flt(offer.get("min_qty"))
    maximum_qty = flt(offer.get("max_qty"))
    minimum_amount = flt(offer.get("min_amt"))
    maximum_amount = flt(offer.get("max_amt"))
    return (
        (not minimum_qty or qty >= minimum_qty)
        and (not maximum_qty or qty <= maximum_qty)
        and (not minimum_amount or amount >= minimum_amount)
        and (not maximum_amount or amount <= maximum_amount)
        and _coupon_is_valid(invoice_doc, offer)
    )


def _apply_item_price_offer(item, offer):
    price = max(flt(item.get("price_list_rate")), 0)
    factor = flt(item.get("conversion_factor")) or 1
    discount_type = str(offer.get("discount_type") or "").strip()
    if discount_type == "Rate":
        rate = max(flt(offer.get("rate")) / factor, 0)
    elif discount_type == "Discount Percentage":
        percentage = min(max(flt(offer.get("discount_percentage")), 0), 100)
        rate = price * (1 - percentage / 100)
    elif discount_type == "Discount Amount":
        rate = max(price - max(flt(offer.get("discount_amount")) / factor, 0), 0)
    else:
        frappe.throw(_("POS offer has an unsupported discount type."))
    item.rate = rate
    item.discount_amount = max(price - rate, 0)
    item.discount_percentage = (item.discount_amount / price * 100) if price else 0


def _restore_manual_pricing(item, snapshot, profile):
    price = max(flt(item.get("price_list_rate")), 0)
    if cint(profile.get("posa_allow_user_to_edit_rate")):
        item.rate = max(snapshot.rate, 0)
    if cint(profile.get("posa_allow_user_to_edit_item_discount")):
        if snapshot.discount_percentage:
            percentage = min(max(snapshot.discount_percentage, 0), 100)
            item.discount_percentage = percentage
            item.discount_amount = price * percentage / 100
            item.rate = max(price - item.discount_amount, 0)
        elif snapshot.discount_amount:
            item.discount_amount = min(max(snapshot.discount_amount, 0), price)
            item.discount_percentage = item.discount_amount / price * 100 if price else 0
            item.rate = max(price - item.discount_amount, 0)


def _validate_and_apply_line(invoice_doc, item, snapshot, profile, state):
    if snapshot.item_code != item.get("item_code"):
        frappe.throw(_("Invoice item order changed during authoritative pricing."))
    offers = [
        offer
        for identifier in snapshot.offer_ids
        if (offer := state.active_offers.get(identifier))
    ]
    if snapshot.offer_applied and not offers:
        frappe.throw(_("Applied POS offer is invalid or no longer active."))
    price_offers = [
        offer
        for offer in offers
        if offer.get("offer") == "Item Price"
        and _item_matches_offer(item, offer)
        and _offer_conditions_met(invoice_doc, offer)
    ]
    if snapshot.offer_applied:
        if len(price_offers) != 1:
            frappe.throw(_("Exactly one valid item-price offer is required for an offered line."))
        _apply_item_price_offer(item, price_offers[0])
    else:
        _restore_manual_pricing(item, snapshot, profile)

    if flt(item.get("rate")) <= 0 and not (
        cint(profile.get("posa_allow_zero_rated_items"))
        or snapshot.offer_applied
        or cint(item.get("is_free_item"))
    ):
        frappe.throw(_("Zero-rated items are disabled for this POS Profile."))


def _original_return_price_map(invoice_doc):
    if not cint(invoice_doc.get("is_return")) or not invoice_doc.get("return_against"):
        return {}, {}
    original = frappe.get_doc(invoice_doc.doctype, invoice_doc.return_against)
    if original.company != invoice_doc.company or original.customer != invoice_doc.customer:
        frappe.throw(_("Original invoice is outside this return transaction."), frappe.PermissionError)
    by_name = {}
    by_code = {}
    for row in original.get("items") or []:
        if row.get("name"):
            by_name[row.name] = row
        by_code.setdefault(row.get("item_code"), []).append(row)
    return by_name, by_code


def _apply_original_return_price(item, snapshot, by_name, by_code):
    original = by_name.get(snapshot.row_id)
    if not original:
        candidates = by_code.get(item.get("item_code"), [])
        if len(candidates) != 1:
            frappe.throw(
                _("Return item {0} must identify its original invoice row.").format(
                    item.get("item_code")
                )
            )
        original = candidates[0]
    for fieldname in (
        "rate",
        "price_list_rate",
        "discount_percentage",
        "discount_amount",
    ):
        setattr(item, fieldname, _value(original, fieldname, 0))


def _apply_total_offer(invoice_doc, profile, state):
    claims = [_offer_id(claim) for claim in state.invoice_offer_claims]
    offers = [state.active_offers.get(identifier) for identifier in claims if identifier]
    total_offers = [
        offer
        for offer in offers
        if offer
        and offer.get("offer") == "Grand Total"
        and _offer_conditions_met(invoice_doc, offer)
    ]
    if len(total_offers) > 1:
        frappe.throw(_("Only one Grand Total offer may be applied."))
    if not total_offers:
        return
    offer = total_offers[0]
    total = max(flt(invoice_doc.get("total")), 0)
    discount_type = str(offer.get("discount_type") or "").strip()
    if discount_type == "Discount Percentage":
        discount = total * min(max(flt(offer.get("discount_percentage")), 0), 100) / 100
    elif discount_type == "Discount Amount":
        discount = min(max(flt(offer.get("discount_amount")), 0), total)
    else:
        frappe.throw(_("Grand Total offer has an unsupported discount type."))
    invoice_doc.discount_amount = discount
    invoice_doc.additional_discount_percentage = discount / total * 100 if total else 0


def _qualifying_items(invoice_doc, offer):
    return [
        item
        for item in (invoice_doc.get("items") or [])
        if not cint(item.get("is_free_item")) and _item_matches_offer(item, offer)
    ]


def _free_offer_item(invoice_doc, offer):
    qualifying = _qualifying_items(invoice_doc, offer)
    if not qualifying:
        return None
    if offer.get("give_item"):
        return offer.get("give_item")
    if offer.get("apply_item_code"):
        return offer.get("apply_item_code")
    if cint(offer.get("replace_cheapest_item")):
        return min(qualifying, key=lambda item: flt(item.get("price_list_rate"))).get("item_code")
    if cint(offer.get("replace_item")) or offer.get("apply_on") == "Item Code":
        return qualifying[0].get("item_code")
    return None


def _free_offer_qty(invoice_doc, offer):
    base_qty = flt(offer.get("given_qty") or offer.get("free_qty") or 0)
    if base_qty <= 0:
        return 0
    if not cint(offer.get("is_recursive") or offer.get("apply_per_threshold")):
        return base_qty
    transaction_qty = sum(abs(flt(item.get("qty"))) for item in _qualifying_items(invoice_doc, offer))
    threshold = flt(offer.get("recurse_for")) or flt(offer.get("min_qty")) or 1
    starts_after = flt(offer.get("apply_recursion_over"))
    cycles = int(max(transaction_qty - starts_after, 0) // threshold)
    quantity = cycles * base_qty
    maximum = flt(offer.get("max_free_qty"))
    if maximum:
        quantity = min(quantity, maximum)
    return quantity


def _apply_free_offers(invoice_doc, state):
    claims = [_offer_id(claim) for claim in state.invoice_offer_claims]
    offers = [state.active_offers.get(identifier) for identifier in claims if identifier]
    free_offers = [
        offer
        for offer in offers
        if offer
        and offer.get("offer") == "Give Product"
        and _offer_conditions_met(invoice_doc, offer)
    ]
    expected = []
    for offer in free_offers:
        item_code = _free_offer_item(invoice_doc, offer)
        quantity = _free_offer_qty(invoice_doc, offer)
        if not item_code or quantity <= 0:
            frappe.throw(_("Give Product offer cannot be resolved by the server."))
        expected.append((offer, item_code, quantity))

    if state.free_rows and not expected:
        frappe.throw(_("Client-supplied free items are not backed by an active POS offer."))

    for offer, item_code, quantity in expected:
        raw = next(
            (
                row
                for row in state.free_rows
                if row.get("item_code") == item_code
                and (
                    row.get("source_rule") in {offer.get("name"), offer.get("row_id")}
                    or _offer_id(offer) in _line_offer_ids(row)
                    or cint(row.get("posa_is_offer"))
                )
            ),
            {},
        )
        stock_uom = frappe.get_cached_value("Item", item_code, "stock_uom")
        factor = flt(raw.get("conversion_factor")) or 1
        discount_type = str(offer.get("discount_type") or "").strip()
        rate = max(flt(offer.get("rate")) / factor, 0) if discount_type == "Rate" else 0
        item = invoice_doc.append(
            "items",
            {
                "item_code": item_code,
                "qty": quantity,
                "stock_qty": quantity * factor,
                "uom": raw.get("uom") or stock_uom,
                "stock_uom": stock_uom,
                "conversion_factor": factor,
                "warehouse": invoice_doc.get("set_warehouse") or raw.get("warehouse"),
                "rate": rate,
                "price_list_rate": max(flt(raw.get("price_list_rate")), rate),
                "discount_percentage": 0 if rate else 100,
                "discount_amount": 0,
                "is_free_item": 1,
                "posa_is_offer": 1,
                "posa_offer_applied": 1,
                "posa_offers": json.dumps([_offer_id(offer)]),
                "pricing_rules": offer.get("promotional_scheme_rule"),
            },
        )
        item.amount = flt(item.rate) * flt(item.qty)


def apply_authoritative_pricing(invoice_doc, profile, state):
    """Apply ERPNext pricing first, then only verified POS/manual overrides."""

    if hasattr(invoice_doc, "apply_pricing_rule"):
        invoice_doc.apply_pricing_rule()

    items = [item for item in (invoice_doc.get("items") or []) if not cint(item.get("is_free_item"))]
    if len(items) != len(state.snapshots):
        frappe.throw(_("Invoice items changed during authoritative pricing."))
    original_by_name, original_by_code = _original_return_price_map(invoice_doc)
    for item, snapshot in zip(items, state.snapshots):
        if original_by_name or original_by_code:
            _apply_original_return_price(item, snapshot, original_by_name, original_by_code)
        else:
            _validate_and_apply_line(invoice_doc, item, snapshot, profile, state)

    _apply_total_offer(invoice_doc, profile, state)
    _apply_free_offers(invoice_doc, state)
    invoice_doc.calculate_taxes_and_totals()
