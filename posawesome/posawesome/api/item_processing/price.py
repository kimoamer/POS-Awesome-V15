import frappe
from frappe import _
from frappe.utils import flt
from posawesome.posawesome.api.item_processing.barcode import _parse_scale_barcode_data
from posawesome.posawesome.api.utils import (
    assert_doctype_permission,
    assert_pos_profile_access_allowed,
    assert_pos_profile_write_allowed,
)


def _validate_item_codes(*args, **kwargs):
    from posawesome.posawesome.api.item_processing.details import _validate_item_codes as validate_codes

    return validate_codes(*args, **kwargs)


@frappe.whitelist()
def update_price_list_rate(item_code, price_list, rate, uom=None, pos_profile=None):
    """Create or update Item Price for the given item and price list."""
    if not item_code or not price_list:
        frappe.throw(_("Item Code and Price List are required"))

    profile = assert_pos_profile_write_allowed(
        pos_profile,
        action_flag="posa_allow_price_list_rate_change",
    )
    allowed_price_list = profile.get("selling_price_list")
    if not allowed_price_list or price_list != allowed_price_list:
        frappe.throw(_("Price List {0} is not the selling price list for this POS Profile.").format(price_list))

    assert_doctype_permission("Item", "read")
    assert_doctype_permission("Price List", "read")
    _validate_item_codes(profile, [item_code])
    rate = flt(rate)
    if rate < 0:
        frappe.throw(_("Price List Rate cannot be negative."))
    filters = {"item_code": item_code, "price_list": price_list}
    if uom:
        filters["uom"] = uom
    else:
        filters["uom"] = ["in", ["", None]]

    name = frappe.db.exists("Item Price", filters)
    if name:
        doc = frappe.get_doc("Item Price", name)
        assert_doctype_permission("Item Price", "write")
        from posawesome.posawesome.api.utils import assert_document_permission

        assert_document_permission(doc, "write")
        doc.price_list_rate = rate
        doc.save()
    else:
        assert_doctype_permission("Item Price", "create")
        doc = frappe.get_doc(
            {
                "doctype": "Item Price",
                "item_code": item_code,
                "price_list": price_list,
                "uom": uom,
                "price_list_rate": rate,
                "selling": 1,
            }
        )
        doc.insert()

    return _("Item Price has been added or updated")


@frappe.whitelist()
def get_price_for_uom(
    item_code,
    price_list,
    uom,
    pos_profile=None,
    transaction_type="selling",
):
    """Return Item Price for the given item, price list and UOM.

    Tries the exact UOM first; falls back to a price without a UOM if not found.
    """
    if not (item_code and price_list):
        return None
    profile = assert_pos_profile_access_allowed(pos_profile)
    assert_doctype_permission("Item Price", "read")
    _validate_item_codes(profile, [item_code])
    transaction_type = str(transaction_type or "selling").lower()
    if transaction_type == "buying":
        if not profile.get("posa_allow_purchase_order"):
            frappe.throw(_("Purchase pricing is disabled for this POS Profile."), frappe.PermissionError)
        price_list_enabled = frappe.db.get_value(
            "Price List", price_list, ["buying", "enabled"], as_dict=True
        )
        if not price_list_enabled or not price_list_enabled.get("buying") or not price_list_enabled.get("enabled"):
            frappe.throw(_("Buying Price List is not available."))
    else:
        price_list_enabled = frappe.db.get_value(
            "Price List", price_list, ["selling", "enabled"], as_dict=True
        )
        if not price_list_enabled or not price_list_enabled.get("selling") or not price_list_enabled.get("enabled"):
            frappe.throw(_("Selling Price List is not available."))

    filters = {"item_code": item_code, "price_list": price_list}

    if uom:
        filters["uom"] = uom
        price = frappe.db.get_value("Item Price", filters, "price_list_rate")
        if price is not None:
            return price

    filters.pop("uom", None)
    filters["uom"] = ["in", ["", None]]
    return frappe.db.get_value("Item Price", filters, "price_list_rate")
