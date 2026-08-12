from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

import frappe
from frappe import _

from posawesome.posawesome.api.utils import assert_pos_profile_access_allowed

POS_SUPERVISOR_ROLE = "POS Awesome Supervisor"
CASHIER_GRANT_TTL_SECONDS = 8 * 60 * 60
PIN_MAX_ATTEMPTS = 5
PIN_LOCK_SECONDS = 15 * 60


def _resolve_profile_name(pos_profile=None) -> str:
    if isinstance(pos_profile, dict):
        return str(pos_profile.get("name") or "").strip()

    if isinstance(pos_profile, str):
        return pos_profile.strip()

    return ""


def _get_terminal_users(profile_name: str) -> list[str]:
    rows = frappe.get_all(
        "POS Profile User",
        filters={"parent": profile_name},
        fields=["user"],
        order_by="idx asc, creation asc",
        ignore_permissions=True,
    )
    return [row.get("user") for row in rows if row.get("user")]


def _grant_secret() -> bytes:
    local = getattr(frappe, "local", None)
    conf = getattr(local, "conf", None) or getattr(frappe, "conf", None)
    secret = getattr(conf, "encryption_key", None) if conf else None
    if not secret and isinstance(conf, dict):
        secret = conf.get("encryption_key")
    if not secret:
        frappe.throw(_("Site encryption key is required for cashier access grants."))
    return str(secret).encode("utf-8")


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _issue_cashier_grant(profile_name: str, user: str) -> tuple[str, int]:
    expires_at = int(time.time()) + CASHIER_GRANT_TTL_SECONDS
    payload = {
        "v": 1,
        "profile": profile_name,
        "cashier": user,
        "session_user": frappe.session.user,
        "exp": expires_at,
    }
    encoded = _b64encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signature = _b64encode(hmac.new(_grant_secret(), encoded.encode("ascii"), hashlib.sha256).digest())
    return f"{encoded}.{signature}", expires_at


def verify_cashier_grant(
    cashier_grant,
    pos_profile,
    cashier=None,
    *,
    require_supervisor=False,
):
    """Validate a PIN-issued cashier identity bound to this authenticated session."""

    profile_name = _resolve_profile_name(pos_profile)
    token = str(cashier_grant or "").strip()
    if not profile_name or not token or "." not in token:
        frappe.throw(_("Unlock the terminal with the cashier PIN to continue."), frappe.PermissionError)
    encoded, supplied_signature = token.rsplit(".", 1)
    expected_signature = _b64encode(
        hmac.new(_grant_secret(), encoded.encode("ascii"), hashlib.sha256).digest()
    )
    if not hmac.compare_digest(supplied_signature, expected_signature):
        frappe.throw(_("Cashier access grant is invalid."), frappe.PermissionError)
    try:
        payload = json.loads(_b64decode(encoded).decode("utf-8"))
    except Exception:
        frappe.throw(_("Cashier access grant is invalid."), frappe.PermissionError)

    resolved_cashier = str(payload.get("cashier") or "").strip()
    if (
        payload.get("profile") != profile_name
        or payload.get("session_user") != frappe.session.user
        or int(payload.get("exp") or 0) < int(time.time())
        or (cashier and resolved_cashier != str(cashier).strip())
    ):
        frappe.throw(_("Cashier access grant has expired or does not match this terminal."), frappe.PermissionError)

    _ensure_terminal_user(profile_name, resolved_cashier)
    user_doc = _get_user_doc(resolved_cashier)
    if require_supervisor and not _is_pos_supervisor(user_doc):
        frappe.throw(_("A POS supervisor is required for this action."), frappe.PermissionError)
    return user_doc


def _pin_attempt_key(profile_name: str, user: str) -> str:
    return "posawesome:cashier-pin:{0}:{1}:{2}".format(
        frappe.session.user,
        profile_name,
        user,
    )


def _cache():
    cache_factory = getattr(frappe, "cache", None)
    return cache_factory() if callable(cache_factory) else cache_factory


def _pin_attempts(profile_name: str, user: str) -> int:
    cache = _cache()
    if not cache:
        return 0
    return int(cache.get_value(_pin_attempt_key(profile_name, user)) or 0)


def _record_failed_pin(profile_name: str, user: str):
    cache = _cache()
    if not cache:
        return
    key = _pin_attempt_key(profile_name, user)
    attempts = _pin_attempts(profile_name, user) + 1
    cache.set_value(key, attempts, expires_in_sec=PIN_LOCK_SECONDS)


def _clear_failed_pin(profile_name: str, user: str):
    cache = _cache()
    if cache:
        cache.delete_value(_pin_attempt_key(profile_name, user))


def _ensure_terminal_user(profile_name: str, user: str):
    terminal_users = _get_terminal_users(profile_name)
    if user not in terminal_users:
        frappe.throw(_("Selected cashier is not assigned to this POS profile."))
    return terminal_users


def _get_user_doc(user: str):
    user_doc = frappe.get_doc("User", user)
    if not int(getattr(user_doc, "enabled", 1) or 0):
        frappe.throw(_("Selected cashier is disabled."))
    return user_doc


def _get_user_pin(user_doc) -> str:
    try:
        return str(user_doc.get_password("posa_pos_pin") or "").strip()
    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            f"POS Awesome: failed to read cashier PIN for user {getattr(user_doc, 'name', '')}",
        )
        return ""


def _is_pos_supervisor(user_doc) -> bool:
    user = getattr(user_doc, "name", None)
    if user and POS_SUPERVISOR_ROLE in _get_roles_for_user(user):
        return True
    return bool(getattr(user_doc, "posa_is_pos_supervisor", 0))


def _get_roles_for_user(user: str) -> set[str]:
    get_roles = getattr(frappe, "get_roles", None)
    if not callable(get_roles):
        return set()

    try:
        return set(get_roles(user) or [])
    except Exception:
        if hasattr(frappe, "log_error"):
            frappe.log_error(
                frappe.get_traceback(),
                f"POS Awesome: failed to read roles for user {user}",
            )
        return set()


def _has_legacy_supervisor_field() -> bool:
    try:
        db = getattr(frappe, "db", None)
        if db and hasattr(db, "has_column"):
            return bool(db.has_column("User", "posa_is_pos_supervisor"))
    except Exception:
        pass

    try:
        return bool(frappe.get_meta("User").has_field("posa_is_pos_supervisor"))
    except Exception:
        return False


def _as_user_doc(row):
    if hasattr(frappe, "_dict"):
        return frappe._dict(row)
    return type("UserRow", (), row)()


def _validate_new_pin(new_pin: str) -> str:
    pin = str(new_pin or "").strip()
    if not pin:
        frappe.throw(_("Enter a new PIN."))
    if not pin.isdigit():
        frappe.throw(_("PIN must contain digits only."))
    if len(pin) < 4 or len(pin) > 8:
        frappe.throw(_("PIN must be between 4 and 8 digits."))
    return pin


@frappe.whitelist()
def get_terminal_employees(pos_profile=None):
    profile_name = _resolve_profile_name(pos_profile)
    if not profile_name:
        frappe.throw(_("POS profile is required to load terminal employees."))
    assert_pos_profile_access_allowed(profile_name)

    users = _get_terminal_users(profile_name)
    if not users:
        return []

    fields = ["name", "full_name", "enabled"]
    if _has_legacy_supervisor_field():
        fields.append("posa_is_pos_supervisor")

    user_rows = frappe.get_all(
        "User",
        filters={"name": ["in", users], "enabled": 1},
        fields=fields,
        order_by="full_name asc, name asc",
        ignore_permissions=True,
    )
    user_map = {row.get("name"): row for row in user_rows}
    current_user = frappe.session.user

    employees = []
    for user in users:
        row = user_map.get(user)
        if not row:
            continue
        employees.append(
            {
                "user": row.get("name"),
                "full_name": row.get("full_name") or row.get("name"),
                "enabled": row.get("enabled", 1),
                "is_current": row.get("name") == current_user,
                "is_supervisor": _is_pos_supervisor(_as_user_doc(row)),
            }
        )

    return employees


@frappe.whitelist()
def verify_terminal_employee_pin(pos_profile=None, user=None, pin=None):
    profile_name = _resolve_profile_name(pos_profile)
    if not profile_name:
        frappe.throw(_("POS profile is required to verify cashier access."))
    assert_pos_profile_access_allowed(profile_name)

    user = str(user or "").strip()
    pin = str(pin or "").strip()
    if not user or not pin:
        frappe.throw(_("Cashier and PIN are required."))

    _ensure_terminal_user(profile_name, user)
    if _pin_attempts(profile_name, user) >= PIN_MAX_ATTEMPTS:
        frappe.throw(_("Too many incorrect PIN attempts. Try again later."), frappe.PermissionError)
    user_doc = _get_user_doc(user)
    stored_pin = _get_user_pin(user_doc)

    if not stored_pin or not hmac.compare_digest(stored_pin, pin):
        _record_failed_pin(profile_name, user)
        frappe.throw(_("Invalid cashier PIN."))

    _clear_failed_pin(profile_name, user)
    cashier_grant, expires_at = _issue_cashier_grant(profile_name, user)

    return {
        "user": user_doc.name,
        "full_name": user_doc.full_name or user_doc.name,
        "enabled": user_doc.enabled,
        "is_supervisor": _is_pos_supervisor(user_doc),
        "cashier_grant": cashier_grant,
        "cashier_grant_expires_at": expires_at,
    }


@frappe.whitelist()
def get_cashier_pin_status(pos_profile=None, user=None, cashier_grant=None):
    profile_name = _resolve_profile_name(pos_profile)
    if not profile_name:
        frappe.throw(_("POS profile is required to manage cashier PIN."))
    assert_pos_profile_access_allowed(profile_name)

    user = str(user or "").strip()
    if not user:
        frappe.throw(_("Cashier is required."))

    _ensure_terminal_user(profile_name, user)
    if user != frappe.session.user:
        verify_cashier_grant(cashier_grant, profile_name, user)
    user_doc = _get_user_doc(user)
    existing_pin = _get_user_pin(user_doc)

    return {
        "user": user_doc.name,
        "full_name": user_doc.full_name or user_doc.name,
        "has_pin": bool(existing_pin),
        "is_supervisor": _is_pos_supervisor(user_doc),
    }


@frappe.whitelist()
def save_cashier_pin(
    pos_profile=None,
    user=None,
    new_pin=None,
    current_pin=None,
    cashier_grant=None,
):
    profile_name = _resolve_profile_name(pos_profile)
    if not profile_name:
        frappe.throw(_("POS profile is required to save cashier PIN."))
    assert_pos_profile_access_allowed(profile_name)

    user = str(user or "").strip()
    if not user:
        frappe.throw(_("Cashier is required."))

    _ensure_terminal_user(profile_name, user)
    if user != frappe.session.user:
        verify_cashier_grant(cashier_grant, profile_name, user)
    user_doc = _get_user_doc(user)
    existing_pin = _get_user_pin(user_doc)
    next_pin = _validate_new_pin(new_pin)

    if existing_pin and str(current_pin or "").strip() != existing_pin:
        frappe.throw(_("Current PIN is incorrect."))

    if not hasattr(user_doc, "flags") or user_doc.flags is None:
        user_doc.flags = frappe._dict() if hasattr(frappe, "_dict") else type("Flags", (), {})()
    user_doc.set("posa_pos_pin", next_pin)
    # Changing another user's credential is permitted only after that user's
    # signed PIN grant has been verified above.
    user_doc.save(ignore_permissions=user != frappe.session.user)

    return {
        "user": user_doc.name,
        "full_name": user_doc.full_name or user_doc.name,
        "has_pin": True,
        "is_supervisor": _is_pos_supervisor(user_doc),
    }
