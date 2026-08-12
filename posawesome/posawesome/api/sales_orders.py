# Copyright (c) 2020, Youssef Restom and contributors
# For license information, please see license.txt

import json

import frappe
from frappe.utils import flt, getdate, nowdate

from posawesome.posawesome.api.payment_entry import create_payment_entry
from posawesome.posawesome.api.tax_contracts import apply_pos_tax_inclusion_contract
from posawesome.posawesome.api.utils import (
    assert_doctype_permission,
    assert_document_permission,
    get_pos_request_context,
)
from posawesome.posawesome.api.invoice_processing.pricing_authority import (
    apply_authoritative_pricing,
    capture_pricing_state,
    prepare_invoice_pricing,
)
from posawesome.posawesome.api.invoice_processing.stock import _strip_client_freebies_from_payload
from posawesome.posawesome.api.invoice_processing.utils import _resolve_effective_price_list


def _sales_order_context(pos_profile, opening_shift=None, company=None, permission_type="read"):
    context = get_pos_request_context(
        pos_profile,
        company=company,
        doctype="Sales Order",
        permission_type=permission_type,
        require_open_shift=True,
        opening_shift=opening_shift,
    )
    if not (
        context.pos_profile.get("custom_allow_select_sales_order")
        or context.pos_profile.get("posa_allow_sales_order")
    ):
        frappe.throw("Sales Orders are disabled for this POS Profile", frappe.PermissionError)
    return context


def _payload_context(data, permission_type):
    context = _sales_order_context(
        data.get("pos_profile"),
        opening_shift=data.get("posa_pos_opening_shift"),
        company=data.get("company"),
        permission_type=permission_type,
    )
    data["company"] = context.company
    data["doctype"] = "Sales Order"
    data["pos_profile"] = context.profile_name
    data["posa_pos_opening_shift"] = context.opening_shift.name
    profile_currency = context.pos_profile.get("currency")
    if (
        data.get("currency")
        and profile_currency
        and data.get("currency") != profile_currency
        and not context.pos_profile.get("posa_allow_multi_currency")
    ):
        frappe.throw("Currency is outside this POS Profile", frappe.PermissionError)
    return context


def _apply_sales_order_authority(order_doc, context, pricing_state):
    profile = context.pos_profile
    order_doc.company = context.company
    order_doc.pos_profile = context.profile_name
    effective_price_list = _resolve_effective_price_list(
        order_doc.get("customer"),
        context.profile_name,
        order_doc.get("selling_price_list"),
    )
    if effective_price_list:
        order_doc.selling_price_list = effective_price_list
    if context.warehouse:
        order_doc.set_warehouse = context.warehouse
        for item in order_doc.get("items") or []:
            item.warehouse = context.warehouse
    order_doc.set("taxes", [])
    order_doc.taxes_and_charges = profile.get("taxes_and_charges") or None
    prepare_invoice_pricing(order_doc, profile, pricing_state)
    order_doc.set_missing_values()
    apply_authoritative_pricing(order_doc, profile, pricing_state)
    apply_pos_tax_inclusion_contract(order_doc)


def _payment_entry_job(order_name, payments):
    """Background task to create payment entries."""
    so_doc = frappe.get_doc("Sales Order", order_name)
    _create_payment_entries(so_doc, payments)


@frappe.whitelist()
def search_orders(
    company,
    currency,
    order_name=None,
    pos_profile=None,
    pos_opening_shift=None,
):
    context = _sales_order_context(pos_profile, pos_opening_shift, company)
    company = context.company
    if not context.pos_profile.get("posa_allow_multi_currency"):
        currency = context.pos_profile.get("currency")
    filters = {
        "billing_status": ["in", ["Not Billed", "Partly Billed"]],
        "docstatus": 1,
        "company": company,
        "currency": currency,
    }
    if order_name:
        filters["name"] = ["like", f"%{order_name}%"]
    orders_list = frappe.get_list(
        "Sales Order",
        filters=filters,
        fields=["name"],
        limit_page_length=0,
        order_by="customer",
    )
    data = []
    for order in orders_list:
        data.append(frappe.get_doc("Sales Order", order["name"]))
    return data


def _map_delivery_dates(data):
    """Ensure mandatory delivery_date fields are populated."""

    def parse_date(value):
        if not value:
            return None
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                return None
            if normalized.lower() in {"invalid date", "nan", "none", "null", "undefined"}:
                return None
            value = normalized
        try:
            return str(getdate(value))
        except Exception:
            return None

    # Map order level delivery date with robust fallback.
    order_delivery_date = (
        parse_date(data.get("delivery_date"))
        or parse_date(data.get("posa_delivery_date"))
        or parse_date(data.get("transaction_date"))
        or parse_date(data.get("posting_date"))
        or str(getdate(nowdate()))
    )
    data["delivery_date"] = order_delivery_date

    # Map item level delivery dates
    for item in data.get("items", []):
        if not isinstance(item, dict):
            continue

        item_delivery = (
            parse_date(item.get("delivery_date"))
            or parse_date(item.get("posa_delivery_date"))
            or order_delivery_date
        )
        if item_delivery:
            item["delivery_date"] = item_delivery
            item.setdefault("posa_delivery_date", item_delivery)


@frappe.whitelist()
def update_sales_order(data):
    """Create or update a Sales Order document."""
    data = json.loads(data)
    context = _payload_context(data, "write" if data.get("name") else "create")
    pricing_state = capture_pricing_state(data, context.pos_profile)
    _strip_client_freebies_from_payload(data)
    _map_delivery_dates(data)
    if data.get("name"):
        if not frappe.db.exists("Sales Order", data.get("name")):
            frappe.throw("Sales Order was not found")
        so_doc = frappe.get_doc("Sales Order", data.get("name"))
        assert_document_permission(so_doc, "write")
        if so_doc.company != context.company:
            frappe.throw("Sales Order is outside this POS Profile", frappe.PermissionError)
        if int(so_doc.docstatus or 0) != 0:
            frappe.throw("Only draft Sales Orders can be updated")
        so_doc.update(data)
    else:
        so_doc = frappe.get_doc(data)

    so_doc.docstatus = 0
    _apply_sales_order_authority(so_doc, context, pricing_state)
    so_doc.save()
    return so_doc


def _create_payment_entries(so_doc, payments, pos_profile=None):
    """Create payment entries referencing the sales order."""
    assert_doctype_permission("Payment Entry", "create")
    assert_doctype_permission("Payment Entry", "submit")
    profile = frappe.get_cached_doc("POS Profile", pos_profile or so_doc.get("pos_profile"))
    allowed_modes = {
        row.get("mode_of_payment")
        for row in (profile.get("payments") or [])
        if row.get("mode_of_payment")
    }
    requested_total = sum(max(flt(row.get("amount")), 0) for row in (payments or []))
    if requested_total - flt(so_doc.grand_total) > 0.01:
        frappe.throw("Sales Order payments cannot exceed the order total")
    for pay in payments or []:
        if not pay.get("amount"):
            continue
        if pay.get("mode_of_payment") not in allowed_modes:
            frappe.throw("Mode of Payment is not configured for this POS Profile")

        # Create payment entry using helper to ensure exchange rates are set
        pe = create_payment_entry(
            company=so_doc.company,
            customer=so_doc.customer,
            amount=pay.get("amount"),
            currency=pay.get("currency") or so_doc.currency,
            mode_of_payment=pay.get("mode_of_payment"),
            reference_no=so_doc.get("posa_pos_opening_shift"),
            reference_date=nowdate(),
            posting_date=nowdate(),
            submit=0,
        )

        # Link payment entry to the sales order
        pe.append(
            "references",
            {
                "allocated_amount": pay.get("amount"),
                "reference_doctype": "Sales Order",
                "reference_name": so_doc.name,
            },
        )

        pe.save()
        pe.submit()


@frappe.whitelist()
def submit_sales_order(order):
    """Submit sales order and create payment entries."""
    order = json.loads(order)
    context = _payload_context(order, "submit")
    pricing_state = capture_pricing_state(order, context.pos_profile)
    _strip_client_freebies_from_payload(order)
    _map_delivery_dates(order)
    if order.get("name"):
        if not frappe.db.exists("Sales Order", order.get("name")):
            frappe.throw("Sales Order was not found")
        so_doc = frappe.get_doc("Sales Order", order.get("name"))
        assert_document_permission(so_doc, "submit")
        if so_doc.company != context.company:
            frappe.throw("Sales Order is outside this POS Profile", frappe.PermissionError)
        if int(so_doc.docstatus or 0) != 0:
            frappe.throw("Only draft Sales Orders can be submitted")
        so_doc.update(order)
    else:
        so_doc = frappe.get_doc(order)

    payments = order.get("payments")

    _apply_sales_order_authority(so_doc, context, pricing_state)
    so_doc.save()
    so_doc.submit()

    if payments:
        # Deposits and the order must commit atomically; a queued payment could
        # otherwise fail after the cashier sees a successful order.
        _create_payment_entries(so_doc, payments, order.get("pos_profile"))

    return {"name": so_doc.name, "status": so_doc.docstatus}
