# Copyright (c) 2025, Youssef Restom and contributors
# For license information, please see license.txt

"""API for Barcode Label Template CRUD."""

import frappe
from frappe import _

from posawesome.posawesome.api.utils import (
    assert_document_permission,
    get_pos_request_context,
)


def _template_context(pos_profile, pos_opening_shift=None, permission_type="read"):
    return get_pos_request_context(
        pos_profile,
        doctype="Barcode Label Template",
        permission_type=permission_type,
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )


@frappe.whitelist()
def get_label_templates(label_size=None, pos_profile=None, pos_opening_shift=None):
    """Return list of barcode label templates."""
    _template_context(pos_profile, pos_opening_shift)
    filters = {"disabled": 0}
    if label_size:
        filters["label_size"] = label_size
    templates = frappe.get_list(
        "Barcode Label Template",
        filters=filters,
        fields=["name", "title", "label_size", "description", "modified", "thumbnail"],
        order_by="modified desc",
        limit_page_length=100,
    )
    return templates


@frappe.whitelist()
def get_label_template_detail(name, pos_profile=None, pos_opening_shift=None):
    """Return full template including layout_json."""
    if not name:
        frappe.throw(_("Template name is required"))
    _template_context(pos_profile, pos_opening_shift)
    doc = frappe.get_doc("Barcode Label Template", name)
    assert_document_permission(doc, "read")
    return {
        "name": doc.name,
        "title": doc.title,
        "label_size": doc.label_size,
        "description": doc.description,
        "layout_json": doc.layout_json,
        "modified": doc.modified,
        "thumbnail": doc.thumbnail,
    }


@frappe.whitelist()
def save_label_template(
    title,
    label_size,
    layout_json,
    description=None,
    name=None,
    pos_profile=None,
    pos_opening_shift=None,
):
    """Create or update a barcode label template."""
    if not title or not label_size or not layout_json:
        frappe.throw(_("Title, label size, and layout JSON are required"))

    permission_type = "write" if name else "create"
    _template_context(pos_profile, pos_opening_shift, permission_type)
    title = str(title).strip()[:140]
    label_size = str(label_size).strip()[:64]
    if not title or not label_size:
        frappe.throw(_("Title and label size cannot be blank."))
    description = str(description or "").strip()[:500]
    layout_json = str(layout_json)
    if len(layout_json.encode("utf-8")) > 256 * 1024:
        frappe.throw(_("Label template layout is too large."))
    parsed = frappe.parse_json(layout_json)
    if not isinstance(parsed, list):
        frappe.throw(_("Layout JSON must be a JSON array"))
    if len(parsed) > 100 or any(not isinstance(element, dict) for element in parsed):
        frappe.throw(_("Label layout may contain at most 100 valid elements."))

    if name:
        doc = frappe.get_doc("Barcode Label Template", name)
        assert_document_permission(doc, "write")
        doc.title = title
        doc.label_size = label_size
        doc.layout_json = layout_json
        if description is not None:
            doc.description = description
        doc.save()
    else:
        doc = frappe.get_doc({
            "doctype": "Barcode Label Template",
            "title": title,
            "label_size": label_size,
            "layout_json": layout_json,
            "description": description,
        })
        doc.insert()

    return {
        "name": doc.name,
        "title": doc.title,
        "label_size": doc.label_size,
    }


@frappe.whitelist()
def delete_label_template(name, pos_profile=None, pos_opening_shift=None):
    """Delete a barcode label template."""
    if not name:
        frappe.throw(_("Template name is required"))
    _template_context(pos_profile, pos_opening_shift, "delete")
    doc = frappe.get_doc("Barcode Label Template", name)
    assert_document_permission(doc, "delete")
    frappe.delete_doc("Barcode Label Template", name)
    return {"success": True}


@frappe.whitelist()
def get_shipping_addresses(
    company=None,
    customer=None,
    delivery_note=None,
    sales_invoice=None,
    pos_profile=None,
    pos_opening_shift=None,
):
    """Return ship-from and ship-to addresses for shipping label generation."""
    context = get_pos_request_context(
        pos_profile,
        company=company,
        doctype="Address",
        permission_type="read",
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )
    company = context.company

    ship_from = _get_company_address(company)

    ship_to = None
    address_name = None

    if delivery_note:
        doc = _shipping_source("Delivery Note", delivery_note, company)
        address_name = doc.get("shipping_address_name") or doc.get("customer_address")
    elif sales_invoice:
        doc = _shipping_source("Sales Invoice", sales_invoice, company)
        address_name = doc.get("shipping_address_name") or doc.get("customer_address")
    elif customer:
        customer_doc = frappe.get_doc("Customer", customer)
        assert_document_permission(customer_doc, "read")
        addresses = frappe.get_list(
            "Address",
            filters=[
                ["Dynamic Link", "link_doctype", "=", "Customer"],
                ["Dynamic Link", "link_name", "=", customer],
                ["disabled", "=", 0],
            ],
            fields=["name"],
            order_by="is_primary_address desc, modified desc",
            limit=1,
        )
        if addresses:
            address_name = addresses[0]["name"]

    if address_name:
        ship_to = _format_address(address_name, "to")

    return {
        "ship_from": ship_from,
        "ship_to": ship_to,
    }


def _get_company_address(company):
    """Get primary address for a company."""
    address_name = frappe.db.get_value(
        "Address",
        filters=[
            ["Dynamic Link", "link_doctype", "=", "Company"],
            ["Dynamic Link", "link_name", "=", company],
            ["is_primary_address", "=", 1],
            ["disabled", "=", 0],
        ],
    )
    if not address_name:
        address_name = frappe.db.get_value(
            "Address",
            filters=[
                ["Dynamic Link", "link_doctype", "=", "Company"],
                ["Dynamic Link", "link_name", "=", company],
                ["disabled", "=", 0],
            ],
        )
    return _format_address(address_name, "from") if address_name else None


def _format_address(address_name, role):
    """Extract and format address fields into a dict."""
    addr = frappe.get_doc("Address", address_name)
    assert_document_permission(addr, "read")
    parts = [
        addr.address_line1,
        addr.address_line2,
        addr.city,
        addr.state,
        addr.pincode,
        addr.country,
    ]
    lines = [p for p in parts if p]

    return {
        "name": addr.name,
        "role": role,
        "address_title": addr.address_title or addr.name,
        "lines": lines,
        "full": "\n".join(lines),
        "email_id": addr.email_id,
        "phone": addr.phone,
        "country": addr.country or "",
        "pincode": addr.pincode or "",
        "city": addr.city or "",
        "state": addr.state or "",
    }


def _shipping_source(doctype, name, company):
    doc = frappe.get_doc(doctype, name)
    assert_document_permission(doc, "read")
    if doc.get("company") != company:
        frappe.throw(_("The shipping document is outside this POS Profile."), frappe.PermissionError)
    return doc
