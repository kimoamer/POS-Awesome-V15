import json

import frappe
from frappe import _
from posawesome.posawesome.api.utils import get_pos_request_context, expand_item_groups


@frappe.whitelist()
def get_bundle_components(bundles, pos_profile=None, pos_opening_shift=None):
    """Return component items for Product Bundles.

    Args:
        bundles (str | list): JSON string or list of bundle item codes.

    Returns:
        dict: mapping of bundle_code -> list of components dicts with
        item_code, qty, uom, is_batch, is_serial.
    """
    if isinstance(bundles, str):
        bundles = json.loads(bundles)
    if not isinstance(bundles, (list, tuple)):
        frappe.throw(_("Bundles must be a JSON array."))
    bundles = list(dict.fromkeys(str(code).strip() for code in bundles if str(code).strip()))
    if len(bundles) > 100:
        frappe.throw(_("A maximum of 100 bundles can be requested."))
    context = get_pos_request_context(
        pos_profile,
        doctype="Item",
        permission_type="read",
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )
    profile_groups = [
        row.get("item_group")
        for row in (context.pos_profile.get("item_groups") or [])
        if row.get("item_group")
    ]
    allowed_groups = set(expand_item_groups(profile_groups)) if profile_groups else set()

    result = {}
    for code in bundles or []:
        if allowed_groups:
            bundle_group = frappe.db.get_value("Item", code, "item_group")
            if bundle_group not in allowed_groups:
                frappe.throw(_("Bundle {0} is outside this POS Profile.").format(code), frappe.PermissionError)
        if not frappe.db.exists("Product Bundle", code):
            result[code] = []
            continue
        bundle = frappe.get_doc("Product Bundle", code)

        components = []
        for row in bundle.items:
            item = frappe.db.get_value(
                "Item",
                row.item_code,
                ["has_batch_no", "has_serial_no", "stock_uom", "is_stock_item"],
                as_dict=True,
            )
            uom = row.uom or (item.stock_uom if item else None)
            components.append(
                {
                    "item_code": row.item_code,
                    "qty": row.qty,
                    "uom": uom,
                    "is_batch": item.has_batch_no if item else 0,
                    "is_serial": item.has_serial_no if item else 0,
                    "is_stock_item": item.is_stock_item if item else 0,
                }
            )
        result[code] = components

    return result
