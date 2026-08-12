# -*- coding: utf-8 -*-
# Copyright (c) 2020, Youssef Restom and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import json
import frappe
from frappe.utils import cint, nowdate
from frappe import _
from .utilities import get_version
from .utils import (
    assert_doctype_permission,
    assert_pos_profile_access_allowed,
    assert_pos_profile_write_allowed,
)


@frappe.whitelist()
def get_opening_dialog_data():
    assert_doctype_permission("POS Profile", "read")
    assert_doctype_permission("POS Opening Shift", "read")
    data = {}

    # Get only POS Profiles where current user is defined in POS Profile User table
    pos_profiles_data = frappe.db.sql(
        """
        SELECT DISTINCT p.name, p.company, p.currency 
        FROM `tabPOS Profile` p
        INNER JOIN `tabPOS Profile User` u ON u.parent = p.name
        WHERE p.disabled = 0 AND u.user = %s
        ORDER BY p.name
    """,
        frappe.session.user,
        as_dict=1,
    )

    data["pos_profiles_data"] = pos_profiles_data

    # Derive companies from accessible POS Profiles
    company_names = []
    for profile in pos_profiles_data:
        if profile.company and profile.company not in company_names:
            company_names.append(profile.company)
    data["companies"] = [{"name": c} for c in company_names]

    pos_profiles_list = []
    for i in data["pos_profiles_data"]:
        pos_profiles_list.append(i.name)

    payment_method_table = "POS Payment Method" if get_version() == 13 else "Sales Invoice Payment"
    data["payments_method"] = frappe.get_list(
        payment_method_table,
        filters={"parent": ["in", pos_profiles_list]},
        fields=["*"],
        limit_page_length=0,
        order_by="parent",
        ignore_permissions=True,
    )
    # set currency from pos profile
    for mode in data["payments_method"]:
        mode["currency"] = frappe.get_cached_value("POS Profile", mode["parent"], "currency")

    return data


@frappe.whitelist()
def create_opening_voucher(pos_profile, company, balance_details):
    profile = assert_pos_profile_write_allowed(
        pos_profile,
        company=company,
        doctype="POS Opening Shift",
        permission_type="create",
    )
    company = profile.company
    assert_doctype_permission("POS Opening Shift", "submit")
    balance_details = json.loads(balance_details) if isinstance(balance_details, str) else balance_details
    balance_details = list(balance_details or [])

    existing_shift = frappe.db.exists(
        "POS Opening Shift",
        {
            "user": frappe.session.user,
            "pos_profile": profile.name,
            "docstatus": 1,
            "status": "Open",
            "pos_closing_shift": ["is", "not set"],
        },
    )
    if existing_shift:
        frappe.throw(_("An open POS shift already exists for this user and profile."))

    allowed_modes = {
        row.get("mode_of_payment")
        for row in profile.get("payments", [])
        if row.get("mode_of_payment")
    }
    for row in balance_details:
        mode = row.get("mode_of_payment")
        if mode and mode not in allowed_modes:
            frappe.throw(_("Mode of Payment {0} is not allowed for this POS Profile.").format(mode))

    new_pos_opening = frappe.get_doc(
        {
            "doctype": "POS Opening Shift",
            "period_start_date": frappe.utils.get_datetime(),
            "posting_date": frappe.utils.getdate(),
            "user": frappe.session.user,
            "pos_profile": profile.name,
            "company": company,
        }
    )
    new_pos_opening.set("balance_details", balance_details)
    new_pos_opening.insert()
    new_pos_opening.submit()

    data = {}
    data["pos_opening_shift"] = new_pos_opening.as_dict()
    update_opening_shift_data(data, new_pos_opening.pos_profile)
    return data


@frappe.whitelist()
def check_opening_shift(user=None):
    user = frappe.session.user
    assert_doctype_permission("POS Opening Shift", "read")
    open_vouchers = frappe.db.get_all(
        "POS Opening Shift",
        filters={
            "user": user,
            "pos_closing_shift": ["is", "not set"],
            "docstatus": 1,
            "status": "Open",
        },
        fields=["name", "pos_profile"],
        order_by="period_start_date desc",
    )
    data = ""
    if len(open_vouchers) > 0:
        data = {}
        data["pos_opening_shift"] = frappe.get_doc("POS Opening Shift", open_vouchers[0]["name"])
        update_opening_shift_data(data, open_vouchers[0]["pos_profile"])
    return data


def update_opening_shift_data(data, pos_profile):
    data["pos_profile"] = assert_pos_profile_access_allowed(pos_profile)
    if data["pos_profile"].get("posa_language"):
        frappe.local.lang = data["pos_profile"].posa_language
    data["company"] = frappe.get_doc("Company", data["pos_profile"].company)
    allow_negative_stock = cint(frappe.db.get_single_value("Stock Settings", "allow_negative_stock") or 0)
    data["stock_settings"] = {}
    data["stock_settings"].update({"allow_negative_stock": bool(allow_negative_stock)})
