# -*- coding: utf-8 -*-
# Copyright (c) 2024, yosys solutions and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from posawesome.posawesome.api.utils import assert_doctype_permission


ALLOWED_PRINT_DOCTYPES = {
    "Sales Invoice",
    "POS Invoice",
    "Payment Entry",
    "Purchase Order",
    "Purchase Receipt",
    "Purchase Invoice",
    "Sales Order",
    "Quotation",
}


@frappe.whitelist()
def get_print_formats(doctype):
    if doctype not in ALLOWED_PRINT_DOCTYPES:
        frappe.throw("Unsupported print document type")
    assert_doctype_permission(doctype, "print")

    # Print formats are configuration metadata for an already-authorized print
    # action. POS cashiers commonly have print permission on the transaction but
    # intentionally do not have direct read access to the Print Format DocType.
    # Restricting the requested DocType above and checking its print permission
    # keeps this lookup scoped without granting broader configuration access.
    print_formats = frappe.get_all(
        "Print Format",
        filters={"doc_type": doctype, "disabled": 0},
        fields=["name"],
        order_by="name asc",
    )
    return [p.name for p in print_formats]
