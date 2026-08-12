import json

import frappe
from frappe.utils import getdate
from posawesome.posawesome.api.utils import assert_document_permission, get_pos_request_context
from posawesome.posawesome.api.tax_contracts import apply_pos_tax_inclusion_contract
from posawesome.posawesome.api.invoice_processing.pricing_authority import (
    apply_authoritative_pricing,
    capture_pricing_state,
    prepare_invoice_pricing,
)
from posawesome.posawesome.api.invoice_processing.stock import _strip_client_freebies_from_payload
from posawesome.posawesome.api.invoice_processing.utils import _resolve_effective_price_list


def _quotation_enabled(profile):
    return bool(
        profile.get("custom_allow_create_quotation")
        or profile.get("custom_allow_select_quotation")
        or profile.get("posa_allow_select_quotation")
        or profile.get("posa_allow_quotation_selection")
    )


def _quotation_context(pos_profile, opening_shift=None, company=None, permission_type="read"):
    context = get_pos_request_context(
        pos_profile,
        company=company,
        doctype="Quotation",
        permission_type=permission_type,
        require_open_shift=True,
        opening_shift=opening_shift,
    )
    if not _quotation_enabled(context.pos_profile):
        frappe.throw("Quotations are disabled for this POS Profile", frappe.PermissionError)
    return context


def _apply_quotation_authority(doc, context, pricing_state):
    profile = context.pos_profile
    doc.company = context.company
    doc.pos_profile = context.profile_name
    effective_price_list = _resolve_effective_price_list(
        doc.get("party_name") or doc.get("customer"),
        context.profile_name,
        doc.get("selling_price_list"),
    )
    if effective_price_list:
        doc.selling_price_list = effective_price_list
    doc.set("taxes", [])
    doc.taxes_and_charges = profile.get("taxes_and_charges") or None
    prepare_invoice_pricing(doc, profile, pricing_state)
    doc.set_missing_values()
    apply_authoritative_pricing(doc, profile, pricing_state)
    apply_pos_tax_inclusion_contract(doc)


def _map_delivery_dates(data):
    """Ensure mandatory delivery_date fields are populated."""

    def parse_date(value):
        if not value:
            return None
        try:
            return str(getdate(value))
        except Exception:
            return None

    if not data.get("delivery_date") and data.get("posa_delivery_date"):
        parsed = parse_date(data.get("posa_delivery_date"))
        if parsed:
            data["delivery_date"] = parsed

    for item in data.get("items", []):
        if not item.get("delivery_date"):
            delivery = item.get("posa_delivery_date") or data.get("delivery_date")
            parsed = parse_date(delivery)
            if parsed:
                item["delivery_date"] = parsed


def _ensure_customer_fields(data):
    if not isinstance(data, dict):
        return

    if data.get("doctype") != "Quotation":
        return

    customer = data.get("customer") or data.get("party_name")
    if customer:
        data["customer"] = customer
        data["party_name"] = customer
        data.setdefault("customer_name", customer)

    data.setdefault("quotation_to", "Customer")


def _normalize_quotation_row(row):
    customer = row.get("customer") or row.get("party_name") or row.get("customer_name")
    row["customer"] = customer
    row["party_name"] = customer
    row["customer_name"] = row.get("customer_name") or customer
    row["status"] = row.get("status") or ("Submitted" if int(row.get("docstatus") or 0) == 1 else "Draft")
    return row


@frappe.whitelist()
def search_quotations(
    company,
    currency,
    quotation_name=None,
    include_draft=1,
    include_submitted=1,
    pos_profile=None,
    pos_opening_shift=None,
):
    context = _quotation_context(pos_profile, pos_opening_shift, company)
    company = context.company
    if not context.pos_profile.get("posa_allow_multi_currency"):
        currency = context.pos_profile.get("currency")
    docstatus_filters = []
    if int(include_draft or 0):
        docstatus_filters.append(0)
    if int(include_submitted or 0):
        docstatus_filters.append(1)

    if not docstatus_filters:
        return []

    filters = {
        "company": company,
        "currency": currency,
        "docstatus": ["in", docstatus_filters],
        "quotation_to": "Customer",
    }

    or_filters = []
    if quotation_name:
        search_value = f"%{quotation_name}%"
        or_filters = [
            ["name", "like", search_value],
            ["party_name", "like", search_value],
            ["customer_name", "like", search_value],
            ["currency", "like", search_value],
        ]

    quotations = frappe.get_list(
        "Quotation",
        filters=filters,
        or_filters=or_filters,
        fields=[
            "name",
            "company",
            "currency",
            "transaction_date",
            "grand_total",
            "party_name",
            "customer_name",
            "docstatus",
            "status",
            "owner",
            "modified",
            "modified_by",
        ],
        limit_page_length=0,
        order_by="modified desc",
    )

    return [_normalize_quotation_row(dict(row)) for row in quotations]


@frappe.whitelist()
def update_quotation(data):
    """Create or update a Quotation document."""
    data = json.loads(data)
    context = _quotation_context(
        data.get("pos_profile"),
        data.get("posa_pos_opening_shift"),
        data.get("company"),
        "write" if data.get("name") else "create",
    )
    data["company"] = context.company
    data["doctype"] = "Quotation"
    data["pos_profile"] = context.profile_name
    data["posa_pos_opening_shift"] = context.opening_shift.name
    pricing_state = capture_pricing_state(data, context.pos_profile)
    _strip_client_freebies_from_payload(data)
    _map_delivery_dates(data)
    _ensure_customer_fields(data)
    if data.get("name"):
        if not frappe.db.exists("Quotation", data.get("name")):
            frappe.throw("Quotation was not found")
        doc = frappe.get_doc("Quotation", data.get("name"))
        assert_document_permission(doc, "write")
        if doc.company != context.company:
            frappe.throw("Quotation is outside this POS Profile", frappe.PermissionError)
        if int(doc.docstatus or 0) != 0:
            frappe.throw("Only draft Quotations can be updated")
        doc.update(data)
    else:
        doc = frappe.get_doc(data)

    doc.docstatus = 0
    _apply_quotation_authority(doc, context, pricing_state)
    doc.save()
    return doc


@frappe.whitelist()
def submit_quotation(order, pos_profile=None, pos_opening_shift=None):
    """Submit quotation document."""
    order = json.loads(order)
    context = _quotation_context(
        pos_profile or order.get("pos_profile"),
        pos_opening_shift or order.get("posa_pos_opening_shift"),
        order.get("company"),
        "submit",
    )
    order["company"] = context.company
    order["doctype"] = "Quotation"
    order["pos_profile"] = context.profile_name
    order["posa_pos_opening_shift"] = context.opening_shift.name
    pricing_state = capture_pricing_state(order, context.pos_profile)
    _strip_client_freebies_from_payload(order)
    _map_delivery_dates(order)
    _ensure_customer_fields(order)
    if order.get("name"):
        if not frappe.db.exists("Quotation", order.get("name")):
            frappe.throw("Quotation was not found")
        doc = frappe.get_doc("Quotation", order.get("name"))
        assert_document_permission(doc, "submit")
        if doc.company != context.company:
            frappe.throw("Quotation is outside this POS Profile", frappe.PermissionError)
        if int(doc.docstatus or 0) != 0:
            frappe.throw("Only draft Quotations can be submitted")
        doc.update(order)
    else:
        doc = frappe.get_doc(order)

    _apply_quotation_authority(doc, context, pricing_state)
    doc.save()
    doc.submit()

    return {"name": doc.name, "status": doc.docstatus}
