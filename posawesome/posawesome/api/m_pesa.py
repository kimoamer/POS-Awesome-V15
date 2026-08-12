# Copyright (c) 2021, Youssef Restom and contributors
# For license information, please see license.txt

from __future__ import annotations

import hmac
import json
from contextlib import contextmanager

import frappe
import requests
from frappe import _
from frappe.utils import flt
from requests.auth import HTTPBasicAuth

from posawesome.posawesome.api.utils import assert_doctype_permission, get_pos_request_context


def get_token(app_key, app_secret, base_url):
    authenticate_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
    response = requests.get(
        authenticate_url,
        auth=HTTPBasicAuth(app_key, app_secret),
        timeout=15,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get("access_token"):
        frappe.throw(_("M-Pesa did not return an access token"))
    return payload["access_token"]


def _value(source, key, default=None):
    if isinstance(source, dict):
        return source.get(key, default)
    getter = getattr(source, "get", None)
    if callable(getter):
        return getter(key, default)
    return getattr(source, key, default)


def _profile_methods(profile):
    return {
        _value(row, "mode_of_payment")
        for row in (_value(profile, "payments", []) or [])
        if _value(row, "mode_of_payment")
    }


def _registered_webhook(shortcode):
    if not shortcode:
        return None
    rows = frappe.get_all(
        "Mpesa C2B Register URL",
        filters={"business_shortcode": shortcode, "register_status": "Success"},
        fields=["name", "company", "mode_of_payment"],
        limit=1,
    )
    if not rows:
        return None
    registration = rows[0]
    registration.webhook_secret = frappe.get_doc(
        "Mpesa C2B Register URL", registration.name
    ).get_password("webhook_secret")
    return registration


def _assert_webhook_token(args):
    registration = _registered_webhook(args.get("BusinessShortCode"))
    if not registration:
        frappe.throw(_("Unknown M-Pesa business shortcode"), frappe.PermissionError)

    expected = _value(registration, "webhook_secret") or ""
    supplied = args.get("token") or ""
    if not expected or not supplied or not hmac.compare_digest(str(expected), str(supplied)):
        frappe.throw(_("Invalid M-Pesa webhook token"), frappe.PermissionError)
    return registration


@contextmanager
def _transaction_lock(key):
    """Serialize duplicate callbacks/claims on the current MariaDB connection."""

    lock_name = f"posawesome:{key}"[:64]
    acquired = frappe.db.sql("SELECT GET_LOCK(%s, 5)", (lock_name,))[0][0]
    if not acquired:
        frappe.throw(_("M-Pesa transaction is already being processed"))
    try:
        yield
    finally:
        frappe.db.sql("SELECT RELEASE_LOCK(%s)", (lock_name,))


@frappe.whitelist(allow_guest=True)
def confirmation(**kwargs):
    """Idempotently accept an authenticated Safaricom C2B confirmation."""

    try:
        args = frappe._dict(kwargs)
        registration = _assert_webhook_token(args)
        transid = str(args.get("TransID") or "").strip()
        amount = flt(args.get("TransAmount"))
        if not transid or amount <= 0:
            frappe.throw(_("M-Pesa transaction id and positive amount are required"))

        with _transaction_lock(f"mpesa:{transid}"):
            if frappe.db.exists("Mpesa Payment Register", {"transid": transid}):
                return {"ResultCode": 0, "ResultDesc": "Accepted"}

            doc = frappe.new_doc("Mpesa Payment Register")
            doc.transactiontype = args.get("TransactionType")
            doc.transid = transid
            doc.transtime = args.get("TransTime")
            doc.transamount = amount
            doc.businessshortcode = args.get("BusinessShortCode")
            doc.billrefnumber = args.get("BillRefNumber")
            doc.invoicenumber = args.get("InvoiceNumber")
            doc.orgaccountbalance = args.get("OrgAccountBalance")
            doc.thirdpartytransid = args.get("ThirdPartyTransID")
            doc.msisdn = args.get("MSISDN")
            doc.firstname = args.get("FirstName")
            doc.middlename = args.get("MiddleName")
            doc.lastname = args.get("LastName")
            doc.company = _value(registration, "company")
            doc.mode_of_payment = _value(registration, "mode_of_payment")
            doc.insert(ignore_permissions=True)
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    except Exception as error:
        frappe.log_error(frappe.get_traceback(), f"M-Pesa confirmation rejected: {str(error)[:120]}")
        return {"ResultCode": 1, "ResultDesc": "Rejected"}


@frappe.whitelist(allow_guest=True)
def validation(**kwargs):
    try:
        args = frappe._dict(kwargs)
        _assert_webhook_token(args)
        if not args.get("TransID") or flt(args.get("TransAmount")) <= 0:
            frappe.throw(_("Invalid M-Pesa transaction"))
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    except Exception:
        return {"ResultCode": 1, "ResultDesc": "Rejected"}


@frappe.whitelist()
def get_mpesa_mode_of_payment(company, pos_profile):
    context = get_pos_request_context(
        pos_profile,
        company=company,
        action_flag="posa_allow_mpesa_reconcile_payments",
        doctype="Mpesa C2B Register URL",
        permission_type="read",
    )
    allowed = _profile_methods(context.pos_profile)
    modes = frappe.get_list(
        "Mpesa C2B Register URL",
        filters={"company": context.company, "register_status": "Success"},
        fields=["mode_of_payment"],
    )
    return list(dict.fromkeys(row.mode_of_payment for row in modes if row.mode_of_payment in allowed))


@frappe.whitelist()
def get_mpesa_draft_payments(
    company,
    pos_profile,
    mode_of_payment=None,
    mobile_no=None,
    full_name=None,
    payment_methods_list=None,
):
    context = get_pos_request_context(
        pos_profile,
        company=company,
        action_flag="posa_allow_mpesa_reconcile_payments",
        doctype="Mpesa Payment Register",
        permission_type="read",
        require_open_shift=True,
    )
    allowed_methods = _profile_methods(context.pos_profile)
    if payment_methods_list:
        requested_methods = json.loads(payment_methods_list)
        if not isinstance(requested_methods, list):
            frappe.throw(_("Invalid payment methods filter"))
        allowed_methods &= {str(method) for method in requested_methods}
    if mode_of_payment:
        if mode_of_payment not in allowed_methods:
            frappe.throw(_("Mode of Payment is not allowed by this POS Profile"), frappe.PermissionError)
        allowed_methods = {mode_of_payment}
    if not allowed_methods:
        return []

    filters = {
        "company": context.company,
        "docstatus": 0,
        "mode_of_payment": ["in", sorted(allowed_methods)],
    }
    if mobile_no:
        filters["msisdn"] = ["like", f"%{str(mobile_no).strip()}%"]
    if full_name:
        filters["full_name"] = ["like", f"%{str(full_name).strip()}%"]

    return frappe.get_list(
        "Mpesa Payment Register",
        filters=filters,
        fields=[
            "name",
            "transid",
            "msisdn as mobile_no",
            "full_name",
            "posting_date",
            "transamount as amount",
            "currency",
            "mode_of_payment",
            "company",
        ],
        order_by="posting_date desc, name desc",
        page_length=200,
    )


@frappe.whitelist()
def submit_mpesa_payment(
    mpesa_payment,
    customer,
    pos_profile,
    pos_opening_shift_name=None,
):
    context = get_pos_request_context(
        pos_profile,
        action_flag="posa_allow_mpesa_reconcile_payments",
        doctype="Mpesa Payment Register",
        permission_type="write",
        require_open_shift=True,
        opening_shift=pos_opening_shift_name,
    )
    assert_doctype_permission("Mpesa Payment Register", "submit")
    assert_doctype_permission("Payment Entry", "create")
    assert_doctype_permission("Payment Entry", "submit")
    assert_doctype_permission("Customer", "read")
    if not frappe.db.exists("Customer", customer):
        frappe.throw(_("Customer {0} was not found").format(customer))

    with _transaction_lock(f"mpesa-submit:{mpesa_payment}"):
        doc = frappe.get_doc("Mpesa Payment Register", mpesa_payment)
        if (
            doc.company != context.company
            or doc.mode_of_payment not in _profile_methods(context.pos_profile)
            or doc.docstatus != 0
            or doc.payment_entry
        ):
            frappe.throw(_("M-Pesa payment is unavailable for this POS session"), frappe.PermissionError)
        doc.customer = customer
        doc.submit_payment = 1
        doc.submit()
        doc.reload()

    payment_entry = frappe.get_doc("Payment Entry", doc.payment_entry)
    if payment_entry.company != context.company or payment_entry.party != customer:
        frappe.throw(_("Created M-Pesa payment entry failed scope validation"))
    return payment_entry
