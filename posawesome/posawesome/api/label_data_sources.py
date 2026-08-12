# Copyright (c) 2025, Youssef Restom and contributors
# For license information, please see license.txt

"""Data source connectors (Sales Order, Delivery Note, BOM) with atomic serial counter."""

import re

import frappe
from frappe import _
from frappe.model.naming import make_autoname

from posawesome.posawesome.api.item_processing.details import _validate_item_codes
from posawesome.posawesome.api.utils import (
    assert_document_permission,
    get_pos_request_context,
)


_SOURCE_TYPES = {"Sales Order", "Delivery Note", "BOM"}


def _label_context(pos_profile, pos_opening_shift=None, doctype="Item"):
    """Resolve the terminal boundary used by every label data endpoint."""

    return get_pos_request_context(
        pos_profile,
        doctype=doctype,
        permission_type="read",
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )


def _source_document(doctype, name, context):
    if doctype not in _SOURCE_TYPES or not name:
        frappe.throw(_("Invalid label source document."))
    doc = frappe.get_doc(doctype, name)
    assert_document_permission(doc, "read")
    if doc.get("company") != context.company:
        frappe.throw(_("The source document is outside this POS Profile."), frappe.PermissionError)
    if int(doc.get("docstatus") or 0) != 1:
        frappe.throw(_("{0} must be submitted").format(doctype))
    return doc


@frappe.whitelist()
def search_label_source_documents(
    source_type: str,
    search_term: str = "",
    company: str = None,
    pos_profile=None,
    pos_opening_shift=None,
):
    """Search SO/DN/BOM scoped to POS Profile company."""
    if source_type not in _SOURCE_TYPES:
        frappe.throw(_("Unsupported label source type."))
    context = _label_context(pos_profile, pos_opening_shift, source_type)
    company = context.company

    search_term = str(search_term or "").strip()[:140]
    search_val = f"%{search_term}%"

    if source_type == "Sales Order":
        docs = frappe.get_list(
            "Sales Order",
            filters={"company": company, "docstatus": 1, "status": ["in", ["To Deliver and Bill", "To Deliver"]]},
            or_filters=[
                ["name", "like", search_val],
                ["customer", "like", search_val],
            ],
            fields=["name", "customer", "transaction_date", "grand_total", "status"],
            limit=20,
        )
        return [{"type": "Sales Order", **d} for d in docs]

    if source_type == "Delivery Note":
        docs = frappe.get_list(
            "Delivery Note",
            filters={"company": company, "docstatus": 1, "status": ["in", ["Not Delivered", "Partly Delivered"]]},
            or_filters=[
                ["name", "like", search_val],
                ["customer", "like", search_val],
            ],
            fields=["name", "customer", "posting_date", "grand_total", "status"],
            limit=20,
        )
        return [{"type": "Delivery Note", **d} for d in docs]

    if source_type == "BOM":
        docs = frappe.get_list(
            "BOM",
            filters={"company": company, "docstatus": 1, "is_active": 1},
            or_filters=[
                ["name", "like", search_val],
                ["item", "like", search_val],
            ],
            fields=["name", "item", "item_name", "quantity", "is_active"],
            limit=20,
        )
        return [{"type": "BOM", **d} for d in docs]

    return []


def _get_item_barcode(item_code: str) -> str | None:
    """Get primary barcode for item."""
    barcodes = frappe.get_all(
        "Item Barcode",
        filters={"parent": item_code},
        fields=["barcode"],
        order_by="idx",
        limit=1,
    )
    return barcodes[0].barcode if barcodes else None


@frappe.whitelist()
def get_sales_order_items(name: str, pos_profile=None, pos_opening_shift=None):
    """Get items from a submitted Sales Order for label printing."""
    context = _label_context(pos_profile, pos_opening_shift, "Sales Order")
    so = _source_document("Sales Order", name, context)
    _validate_item_codes(context.pos_profile, [row.item_code for row in so.items])

    items = []
    for item in so.items:
        items.append({
            "item_code": item.item_code,
            "item_name": item.item_name,
            "qty": item.qty,
            "uom": item.uom,
            "barcode": _get_item_barcode(item.item_code),
            "batch_no": None,
            "serial_no": None,
        })
    return items


@frappe.whitelist()
def get_delivery_note_items(name: str, pos_profile=None, pos_opening_shift=None):
    """Get items from a submitted Delivery Note for label printing."""
    context = _label_context(pos_profile, pos_opening_shift, "Delivery Note")
    dn = _source_document("Delivery Note", name, context)
    _validate_item_codes(context.pos_profile, [row.item_code for row in dn.items])

    items = []
    for item in dn.items:
        items.append({
            "item_code": item.item_code,
            "item_name": item.item_name,
            "qty": item.qty,
            "uom": item.uom,
            "barcode": _get_item_barcode(item.item_code),
            "batch_no": getattr(item, "batch_no", None),
            "serial_no": getattr(item, "serial_no", None),
        })
    return items


@frappe.whitelist()
def get_bom_items(bom: str, for_qty: float = 1, pos_profile=None, pos_opening_shift=None):
    """Get BOM items with quantities scaled to production batch size."""
    context = _label_context(pos_profile, pos_opening_shift, "BOM")
    bom_doc = _source_document("BOM", bom, context)
    _validate_item_codes(context.pos_profile, [row.item_code for row in bom_doc.items])
    for_qty = float(for_qty or 1)
    if for_qty <= 0 or for_qty > 1_000_000:
        frappe.throw(_("Production quantity is outside the allowed range."))

    items = []
    for item in bom_doc.items:
        scaled_qty = item.qty * for_qty / (bom_doc.quantity or 1)
        items.append({
            "item_code": item.item_code,
            "item_name": item.item_name,
            "qty": round(scaled_qty, 3),
            "uom": item.uom,
            "barcode": _get_item_barcode(item.item_code),
            "batch_no": None,
            "serial_no": None,
        })
    return items


@frappe.whitelist()
def get_next_serial_numbers(
    naming_series: str = None,
    count: int = 1,
    pos_profile=None,
    pos_opening_shift=None,
):
    """Atomically reserve the next N serial numbers from a Naming Series.

    Uses frappe.model.naming.make_autoname with DB-level locking
    to guarantee uniqueness across all POS terminals and users.

    Args:
        naming_series: ERPNext Naming Series pattern (e.g. "POS-SERIAL-.#####")
        count: Number of serial numbers to reserve (max 1000).

    Returns:
        List of numeric serial numbers.
    """
    context = _label_context(pos_profile, pos_opening_shift)
    count = int(count or 1)
    if count < 1 or count > 100:
        frappe.throw(_("Between 1 and 100 serial numbers can be reserved at once."))

    # Never let a browser advance an arbitrary ERPNext naming series.  Label
    # serials have a dedicated profile-scoped counter instead.
    profile_slug = re.sub(r"[^A-Za-z0-9]+", "-", context.profile_name).strip("-")[:40] or "POS"
    naming_series = f"POS-LABEL-{profile_slug}-.#########"

    numbers = []
    for _ in range(count):
        name = make_autoname(naming_series)
        parts = name.split("-")
        num = int(parts[-1]) if parts else 0
        numbers.append(num)

    return numbers
