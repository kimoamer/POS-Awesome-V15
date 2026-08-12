# Copyright (c) 2026, Youssef Restom and contributors
# For license information, please see license.txt

"""API for POSA Printer Profile CRUD and connection testing."""

import ipaddress
import socket

import frappe
from frappe import _
from posawesome.posawesome.api.utils import (
    assert_doctype_permission,
    assert_document_permission,
)


PRINTER_TYPES = {"ZPL", "EPL", "HTML"}
SUPPORTED_DPI = {96, 203, 300, 600}


def _validate_printer_settings(printer_type, dpi, ip_address=None, port=None):
    printer_type = str(printer_type or "").upper()
    if printer_type not in PRINTER_TYPES:
        frappe.throw(_("Unsupported printer type."))
    dpi = int(dpi or 203)
    if dpi not in SUPPORTED_DPI:
        frappe.throw(_("Unsupported printer resolution."))
    if ip_address:
        try:
            address = ipaddress.ip_address(str(ip_address).strip())
        except ValueError:
            frappe.throw(_("Printer address must be a valid IP address."))
        if not address.is_private or any(
            (
                address.is_loopback,
                address.is_link_local,
                address.is_multicast,
                address.is_reserved,
                address.is_unspecified,
            )
        ):
            frappe.throw(_("Printer address must be a private network address."))
        port = int(port or 9100)
        if port < 1 or port > 65535:
            frappe.throw(_("Printer port is invalid."))
    return printer_type, dpi, str(ip_address).strip() if ip_address else None, int(port or 0) or None


@frappe.whitelist()
def get_printer_profiles():
    """Return list of non-disabled printer profiles."""
    assert_doctype_permission("POSA Printer Profile", "read")
    profiles = frappe.get_list(
        "POSA Printer Profile",
        filters={"disabled": 0},
        fields=[
            "name",
            "printer_name",
            "printer_type",
            "dpi",
            "ip_address",
            "port",
            "default_label_width",
            "default_label_height",
            "is_default",
            "printer_group",
        ],
        order_by="is_default desc, printer_name asc",
    )
    return profiles


@frappe.whitelist()
def get_printer_profile_detail(name):
    """Return full printer profile including routing rules."""
    if not name:
        frappe.throw(_("Printer profile name is required"))
    doc = frappe.get_doc("POSA Printer Profile", name)
    assert_document_permission(doc, "read")
    return {
        "name": doc.name,
        "printer_name": doc.printer_name,
        "printer_type": doc.printer_type,
        "dpi": doc.dpi,
        "ip_address": doc.ip_address,
        "port": doc.port,
        "default_label_width": doc.default_label_width,
        "default_label_height": doc.default_label_height,
        "is_default": doc.is_default,
        "disabled": doc.disabled,
        "printer_group": doc.printer_group,
        "routing_rules": [
            {
                "name": r.name,
                "item_group": r.item_group,
                "warehouse": r.warehouse,
                "printer": r.printer,
            }
            for r in (doc.get("routing_rules") or [])
        ],
    }


@frappe.whitelist()
def save_printer_profile(
    printer_name,
    printer_type="ZPL",
    dpi=203,
    ip_address=None,
    port=None,
    default_label_width=None,
    default_label_height=None,
    is_default=0,
    printer_group=None,
    name=None,
):
    """Create or update a printer profile."""
    assert_doctype_permission("POSA Printer Profile", "write" if name else "create")
    if not printer_name:
        frappe.throw(_("Printer name is required"))
    printer_type, dpi, ip_address, port = _validate_printer_settings(
        printer_type,
        dpi,
        ip_address,
        port,
    )

    if name:
        doc = frappe.get_doc("POSA Printer Profile", name)
        assert_document_permission(doc, "write")
        doc.printer_name = printer_name
        doc.printer_type = printer_type
        doc.dpi = dpi
        doc.ip_address = ip_address
        doc.port = port
        doc.default_label_width = default_label_width
        doc.default_label_height = default_label_height
        doc.is_default = is_default
        doc.printer_group = printer_group
        doc.save()
    else:
        doc = frappe.get_doc({
            "doctype": "POSA Printer Profile",
            "printer_name": printer_name,
            "printer_type": printer_type,
            "dpi": dpi,
            "ip_address": ip_address,
            "port": port,
            "default_label_width": default_label_width,
            "default_label_height": default_label_height,
            "is_default": is_default,
            "printer_group": printer_group,
        })
        doc.insert()

    return {"name": doc.name, "printer_name": doc.printer_name}


@frappe.whitelist()
def delete_printer_profile(name):
    """Delete a printer profile."""
    if not name:
        frappe.throw(_("Printer profile name is required"))
    doc = frappe.get_doc("POSA Printer Profile", name)
    assert_document_permission(doc, "delete")
    doc.delete()
    return {"success": True}


@frappe.whitelist()
def test_connection(printer_name, printer_type="ZPL", ip_address=None, port=None):
    """Test connection to a printer by sending a minimal test label via QZ Tray.

    This is a best-effort test that relies on QZ Tray being connected.
    Returns success if QZ Tray is available and the printer name is configured.
    """
    frappe.only_for("System Manager")
    if not printer_name:
        frappe.throw(_("Printer profile is required"))

    # Never connect to an address supplied by the request.  The target must
    # come from a persisted profile that was validated by an administrator.
    profile_name = printer_name if frappe.db.exists("POSA Printer Profile", printer_name) else None
    if not profile_name:
        profile_name = frappe.db.get_value(
            "POSA Printer Profile",
            {"printer_name": printer_name, "disabled": 0},
            "name",
        )
    if not profile_name:
        frappe.throw(_("Printer profile was not found."))
    doc = frappe.get_doc("POSA Printer Profile", profile_name)
    assert_document_permission(doc, "read")
    _printer_type, _dpi, target_ip, target_port = _validate_printer_settings(
        doc.printer_type,
        doc.dpi,
        doc.ip_address,
        doc.port,
    )
    if not target_ip or not target_port:
        return {
            "success": True,
            "message": _("Printer profile saved. No IP/port configured for test."),
        }
    try:
        with socket.create_connection((target_ip, target_port), timeout=3):
            pass
        return {
            "success": True,
            "message": _("Printer is reachable."),
        }
    except OSError:
        return {"success": False, "error": _("Printer is not reachable.")}


@frappe.whitelist()
def get_printers_for_failover(printer_group, exclude_name=None):
    """Return printers in the same group for failover, excluding the current one."""
    if not printer_group:
        return []
    assert_doctype_permission("POSA Printer Profile", "read")
    filters = {
        "printer_group": printer_group,
        "disabled": 0,
    }
    if exclude_name:
        filters["name"] = ["!=", exclude_name]
    printers = frappe.get_list(
        "POSA Printer Profile",
        filters=filters,
        fields=["name", "printer_name", "printer_type", "dpi", "ip_address", "port"],
        order_by="is_default desc",
    )
    return printers


@frappe.whitelist()
def get_routed_printers(items_json):
    """Given an array of items with item_group/warehouse, return a map of printer → items."""
    items = frappe.parse_json(items_json)
    assert_doctype_permission("POSA Printer Profile", "read")
    assert_doctype_permission("POSA Printer Routing Rule", "read")
    if not isinstance(items, list):
        frappe.throw(_("Items must be a JSON array"))
    if len(items) > 1000:
        frappe.throw(_("A maximum of 1000 items can be routed per request."))

    routing_rules = frappe.get_list(
        "POSA Printer Routing Rule",
        fields=["item_group", "warehouse", "printer"],
    )

    default_printer = frappe.db.get_value(
        "POSA Printer Profile",
        filters={"disabled": 0, "is_default": 1},
        order_by="modified desc",
    )

    routes = {}
    for item in items:
        matched = None
        for rule in routing_rules:
            ig_match = not rule.item_group or rule.item_group == item.get("item_group")
            wh_match = not rule.warehouse or rule.warehouse == item.get("warehouse")
            if ig_match and wh_match:
                matched = rule.printer
                break
        printer_key = matched or default_printer
        if not printer_key:
            continue
        if printer_key not in routes:
            routes[printer_key] = []
        routes[printer_key].append(item)

    return routes
