import frappe
from frappe import _
from posawesome.posawesome.api.utils import get_pos_request_context


@frappe.whitelist()
def get_last_invoice_rates(
    customer,
    item_codes,
    company=None,
    pos_profile=None,
    pos_opening_shift=None,
):
    """
    Get the last invoice rate for a list of items for a specific customer.
    If no customer-specific rate is found, fall back to the overall latest invoice rate for each item.
    """
    context = get_pos_request_context(
        pos_profile,
        company=company,
        doctype="Sales Invoice",
        permission_type="read",
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )
    company = context.company

    if isinstance(customer, dict):
        customer = customer.get("name") or customer.get("value") or str(customer)

    if isinstance(item_codes, str):
        import json

        try:
            item_codes = json.loads(item_codes)
        except Exception:
            item_codes = [item_codes]

    if not item_codes:
        return []
    if not isinstance(item_codes, (list, tuple)):
        frappe.throw(_("Item codes must be a list."))
    item_codes = list(dict.fromkeys(str(code).strip() for code in item_codes if str(code).strip()))
    if len(item_codes) > 200:
        frappe.throw(_("A maximum of 200 item codes can be requested."))
    if customer and not frappe.db.exists("Customer", customer):
        frappe.throw(_("Customer was not found."))

    latest_rates = {}

    # Query customer-specific invoice rates first
    if customer:
        placeholders = ", ".join(["%s"] * len(item_codes))
        query_cust = f"""
            SELECT
                item.item_code,
                item.rate,
                inv.currency,
                inv.name as invoice,
                item.uom,
                inv.posting_date
            FROM
                `tabSales Invoice` inv
            JOIN
                `tabSales Invoice Item` item ON item.parent = inv.name
            WHERE
                inv.customer = %s
                AND inv.company = %s
                AND inv.docstatus = 1
                AND item.item_code IN ({placeholders})
            ORDER BY
                inv.posting_date DESC, inv.creation DESC
        """
        params_cust = [customer, company] + list(item_codes)
        cust_data = frappe.db.sql(query_cust, tuple(params_cust), as_dict=True)
        for row in cust_data:
            if row.item_code not in latest_rates:
                latest_rates[row.item_code] = row

    # Fallback to company-wide latest invoice rates for missing items
    missing_codes = [code for code in item_codes if code not in latest_rates]
    if missing_codes:
        missing_placeholders = ", ".join(["%s"] * len(missing_codes))
        query_global = f"""
            SELECT
                item.item_code,
                item.rate,
                inv.currency,
                inv.name as invoice,
                item.uom,
                inv.posting_date
            FROM
                `tabSales Invoice` inv
            JOIN
                `tabSales Invoice Item` item ON item.parent = inv.name
            WHERE
                inv.company = %s
                AND inv.docstatus = 1
                AND item.item_code IN ({missing_placeholders})
            ORDER BY
                inv.posting_date DESC, inv.creation DESC
        """
        params_global = [company] + list(missing_codes)
        global_data = frappe.db.sql(query_global, tuple(params_global), as_dict=True)
        for row in global_data:
            if row.item_code not in latest_rates:
                latest_rates[row.item_code] = row

    return list(latest_rates.values())
