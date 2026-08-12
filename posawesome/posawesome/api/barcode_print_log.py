# Copyright (c) 2025, Youssef Restom and contributors
# For license information, please see license.txt

"""API for Barcode Print Log audit trail and verification."""

import frappe
from frappe import _
from frappe.utils import now_datetime
from posawesome.posawesome.api.utils import (
    assert_document_permission,
    get_pos_request_context,
)


def _print_context(pos_profile, pos_opening_shift=None, permission_type="read", company=None):
    return get_pos_request_context(
        pos_profile,
        company=company,
        doctype="Barcode Print Log",
        permission_type=permission_type,
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )


@frappe.whitelist()
def batch_create_print_logs(entries, pos_profile=None, pos_opening_shift=None):
    """Bulk insert print logs using frappe.db.bulk_insert for performance."""
    if not entries:
        return []
    parsed = frappe.parse_json(entries) if isinstance(entries, str) else entries
    if not isinstance(parsed, list):
        frappe.throw(_("Entries must be a JSON array"))
    if len(parsed) > 500:
        frappe.throw(_("A maximum of 500 print-log rows is allowed per request."))
    context = _print_context(pos_profile, pos_opening_shift, "create")

    docs = []
    now = now_datetime()
    for entry in parsed:
        doc = frappe.get_doc({
            "doctype": "Barcode Print Log",
            "posting_date": now.strftime("%Y-%m-%d"),
            "timestamp": now,
            "item_code": entry.get("item_code"),
            "item_name": entry.get("item_name"),
            "barcode": entry.get("barcode"),
            "barcode_type": entry.get("barcode_type"),
            "qty": max(int(entry.get("qty") or 1), 1),
            "uom": entry.get("uom"),
            "price": entry.get("price", 0),
            "symbology": entry.get("symbology"),
            "label_size": entry.get("label_size"),
            "user": frappe.session.user,
            "company": context.company,
            "pos_profile": context.profile_name,
            "print_method": entry.get("print_method"),
            "status": entry.get("status") if entry.get("status") in {"Sent", "Failed"} else "Sent",
            "error_message": entry.get("error_message"),
            "reference_doctype": entry.get("reference_doctype"),
            "reference_docname": entry.get("reference_docname"),
            "batch_no": entry.get("batch_no"),
            "serial_no": entry.get("serial_no"),
            "warehouse": context.warehouse,
        })
        docs.append(doc)
    for doc in docs:
        doc.insert()
    return [d.name for d in docs]


@frappe.whitelist()
def verify_barcode(
    log_id,
    scanned_barcode,
    status="Verified",
    pos_profile=None,
    pos_opening_shift=None,
):
    """Mark a print log as verified or mismatched."""
    if not log_id or not scanned_barcode:
        frappe.throw(_("Log ID and scanned barcode are required"))
    doc = frappe.get_doc("Barcode Print Log", log_id)
    context = _print_context(
        pos_profile or doc.pos_profile,
        pos_opening_shift,
        "write",
        company=doc.company,
    )
    assert_document_permission(doc, "write")
    if doc.pos_profile != context.profile_name or doc.user != frappe.session.user:
        frappe.throw(_("Print log is outside the active POS session."), frappe.PermissionError)
    if status not in {"Verified", "Mismatch"}:
        frappe.throw(_("Invalid verification status."))
    doc.verification_status = status
    doc.scanned_barcode = scanned_barcode
    doc.verified_at = now_datetime()
    doc.verified_by = frappe.session.user
    doc.save()
    return {"name": doc.name, "verification_status": doc.verification_status}


@frappe.whitelist()
def get_print_logs(
    filters=None,
    limit=50,
    offset=0,
    pos_profile=None,
    pos_opening_shift=None,
):
    """Return filtered print logs with stats."""
    filters = frappe.parse_json(filters) if isinstance(filters, str) else (filters or {})
    limit = min(int(limit or 50), 500)
    offset = max(int(offset or 0), 0)
    context = _print_context(pos_profile, pos_opening_shift)

    conditions = ["`company` = %(company)s", "`pos_profile` = %(pos_profile)s", "`user` = %(session_user)s"]
    values = {
        "company": context.company,
        "pos_profile": context.profile_name,
        "session_user": frappe.session.user,
    }

    if filters.get("date"):
        conditions.append("`posting_date` = %(date)s")
        values["date"] = filters["date"]
    if filters.get("verification_status"):
        if isinstance(filters["verification_status"], list):
            conditions.append("`verification_status` IN %(vstatus)s")
            values["vstatus"] = tuple(filters["verification_status"])
        else:
            conditions.append("`verification_status` = %(vstatus)s")
            values["vstatus"] = filters["verification_status"]
    if filters.get("status"):
        conditions.append("`status` = %(status)s")
        values["status"] = filters["status"]
    if filters.get("barcode"):
        conditions.append("`barcode` LIKE %(barcode)s")
        values["barcode"] = f"%{filters['barcode']}%"

    where = " AND ".join(conditions) if conditions else "1=1"

    logs = frappe.db.sql(
        f"""SELECT name, item_code, item_name, barcode, barcode_type, qty,
                   print_method, status, verification_status, user, timestamp,
                   scanned_barcode, verified_at, verified_by, company, pos_profile
            FROM `tabBarcode Print Log`
            WHERE {where}
            ORDER BY timestamp DESC
            LIMIT {limit} OFFSET {offset}""",
        values,
        as_dict=True,
    )

    total = frappe.db.sql(
        f"""SELECT COUNT(*) as cnt FROM `tabBarcode Print Log` WHERE {where}""",
        values,
        as_dict=True,
    )[0]["cnt"]

    stats = frappe.db.sql(
        f"""SELECT
                COUNT(*) as total,
                SUM(CASE WHEN verification_status = 'Verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN verification_status = 'Mismatch' THEN 1 ELSE 0 END) as mismatch,
                SUM(CASE WHEN verification_status = 'Unverified' THEN 1 ELSE 0 END) as unverified,
                SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed
            FROM `tabBarcode Print Log`
            WHERE {where}""",
        values,
        as_dict=True,
    )[0]

    return {"logs": logs, "total": total, "stats": stats}


@frappe.whitelist()
def get_print_stats(filters=None, pos_profile=None, pos_opening_shift=None):
    """Aggregate print statistics for dashboard."""
    filters = frappe.parse_json(filters) if isinstance(filters, str) else (filters or {})

    context = _print_context(pos_profile, pos_opening_shift)
    conditions = ["`company` = %(company)s", "`pos_profile` = %(pos_profile)s", "`user` = %(session_user)s"]
    values = {
        "company": context.company,
        "pos_profile": context.profile_name,
        "session_user": frappe.session.user,
    }
    if filters.get("date_from"):
        conditions.append("`posting_date` >= %(date_from)s")
        values["date_from"] = filters["date_from"]
    if filters.get("date_to"):
        conditions.append("`posting_date` <= %(date_to)s")
        values["date_to"] = filters["date_to"]
    where = " AND ".join(conditions) if conditions else "1=1"

    rows = frappe.db.sql(
        f"""SELECT
                DATE(`timestamp`) as day,
                COUNT(*) as prints,
                COUNT(DISTINCT `user`) as users,
                SUM(CASE WHEN `verification_status` = 'Verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN `verification_status` = 'Mismatch' THEN 1 ELSE 0 END) as mismatch,
                SUM(CASE WHEN `status` = 'Failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN `print_method` = 'Browser' THEN 1 ELSE 0 END) as browser,
                SUM(CASE WHEN `print_method` = 'QZ HTML' THEN 1 ELSE 0 END) as qz_html,
                SUM(CASE WHEN `print_method` = 'QZ Raw' THEN 1 ELSE 0 END) as qz_raw,
                SUM(CASE WHEN `print_method` = 'PDF' THEN 1 ELSE 0 END) as pdf
            FROM `tabBarcode Print Log`
            WHERE {where}
            GROUP BY DATE(`timestamp`)
            ORDER BY day DESC
            LIMIT 30""",
        values,
        as_dict=True,
    )

    return {"daily": rows}
