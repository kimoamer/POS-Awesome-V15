import frappe
from erpnext.accounts.doctype.journal_entry.journal_entry import get_default_bank_cash_account
from posawesome.posawesome.api.utils import assert_document_permission, get_pos_request_context


def _payment_utility_context(pos_profile, company, pos_opening_shift=None, permission_type="read"):
    context = get_pos_request_context(
        pos_profile,
        company=company,
        doctype="Payment Entry",
        permission_type=permission_type,
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )
    profile = context.pos_profile
    if not (
        profile.get("posa_allow_make_new_payments")
        or profile.get("posa_allow_reconcile_payments")
        or profile.get("posa_allow_mpesa_reconcile_payments")
    ):
        frappe.throw("This POS Profile does not allow payment operations.", frappe.PermissionError)
    return context


def _allowed_modes(profile):
    return {
        row.get("mode_of_payment")
        for row in (profile.get("payments") or [])
        if row.get("mode_of_payment")
    }


def get_party_account(party_type, party, company):
    try:
        # First try to get from Party Account
        account = frappe.get_cached_value(
            "Party Account",
            {"parenttype": party_type, "parent": party, "company": company},
            "account",
        )

        if not account:
            # Try to get default account from company
            account = frappe.get_cached_value(
                "Company",
                company,
                ("default_receivable_account" if party_type == "Customer" else "default_payable_account"),
            )

        if not account:
            frappe.log_error(
                f"No account found for {party_type} {party} in company {company}",
                "POS Account Error",
            )

        return account
    except Exception as e:
        frappe.log_error(f"Error getting party account: {str(e)}")
        return None


def get_bank_cash_account(company, mode_of_payment, bank_account=None):
    bank = get_default_bank_cash_account(
        company, "Bank", mode_of_payment=mode_of_payment, account=bank_account
    )

    if not bank:
        bank = get_default_bank_cash_account(
            company, "Cash", mode_of_payment=mode_of_payment, account=bank_account
        )

    return bank


def set_paid_amount_and_received_amount(
    party_account_currency,
    bank,
    outstanding_amount,
    payment_type,
    bank_amount,
    conversion_rate,
):
    paid_amount = received_amount = 0
    if party_account_currency == bank.account_currency:
        paid_amount = received_amount = abs(outstanding_amount)
    elif payment_type == "Receive":
        paid_amount = abs(outstanding_amount)
        if bank_amount:
            received_amount = bank_amount
        else:
            received_amount = paid_amount * conversion_rate

    else:
        received_amount = abs(outstanding_amount)
        if bank_amount:
            paid_amount = bank_amount
        else:
            # if party account currency and bank currency is different then populate paid amount as well
            paid_amount = received_amount * conversion_rate

    return paid_amount, received_amount


@frappe.whitelist()
def get_available_accounts_for_mop(
    company,
    mode_of_payment,
    pos_profile=None,
    pos_opening_shift=None,
):
    """Get all bank/cash accounts available for a given mode of payment."""
    context = _payment_utility_context(pos_profile, company, pos_opening_shift)
    company = context.company
    if mode_of_payment not in _allowed_modes(context.pos_profile):
        frappe.throw("Mode of Payment is outside this POS Profile", frappe.PermissionError)
    default_account = get_bank_cash_account(company, mode_of_payment)
    if not default_account:
        return []

    account_type = default_account.get("account_type")
    if not account_type:
        return []

    accounts = frappe.get_list(
        "Account",
        filters={
            "company": company,
            "account_type": account_type,
            "is_group": 0,
            "disabled": 0,
        },
        fields=["name as account", "account_currency", "account_type", "account_name"],
        order_by="name asc",
    )
    return accounts


def _get_mode_of_payment_accounts(company, mode_of_payments):
    import json

    if isinstance(mode_of_payments, str):
        mode_of_payments = json.loads(mode_of_payments)

    result = {}
    for mode in mode_of_payments:
        account = get_bank_cash_account(company, mode)
        if account:
            result[mode] = {
                "account": account.get("account"),
                "account_currency": account.get("account_currency"),
                "account_type": account.get("account_type"),
            }
    return result


@frappe.whitelist()
def get_mode_of_payment_accounts(
    company,
    mode_of_payments,
    pos_profile=None,
    pos_opening_shift=None,
):
    context = _payment_utility_context(pos_profile, company, pos_opening_shift)
    company = context.company
    if isinstance(mode_of_payments, str):
        import json

        mode_of_payments = json.loads(mode_of_payments)
    allowed = _allowed_modes(context.pos_profile)
    requested = list(dict.fromkeys(mode_of_payments or []))
    if any(mode not in allowed for mode in requested):
        frappe.throw("Mode of Payment is outside this POS Profile", frappe.PermissionError)
    return _get_mode_of_payment_accounts(company, requested)


@frappe.whitelist()
def get_party_account_info(
    party_type,
    party,
    company,
    pos_profile=None,
    pos_opening_shift=None,
):
    context = _payment_utility_context(pos_profile, company, pos_opening_shift)
    company = context.company
    if party_type not in {"Customer", "Supplier"}:
        frappe.throw("Unsupported party type")
    if not frappe.db.exists(party_type, party):
        frappe.throw("Party was not found")
    assert_document_permission(frappe.get_doc(party_type, party), "read")
    account = get_party_account(party_type, party, company)
    if not account:
        return None

    account_values = frappe.get_cached_value(
        "Account",
        account,
        ["account_currency", "account_name"],
    )
    if isinstance(account_values, dict):
        currency = account_values.get("account_currency")
        account_name = account_values.get("account_name")
    else:
        currency, account_name = account_values or (None, None)
    return {
        "account": account,
        "account_name": account_name,
        "currency": currency,
    }
