from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from functools import cache
from typing import Any

import frappe

# Reusable ORM filter to exclude template items
HAS_VARIANTS_EXCLUSION = {"has_variants": 0}


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class POSRequestContext:
    user: str
    pos_profile: Any
    profile_name: str
    company: str | None
    warehouse: str | None
    opening_shift: Any | None = None


def _get_mapping_value(source: Any, key: str, default: Any = None) -> Any:
    """Read a field from either a Frappe document-like object or a dict."""

    if source is None:
        return default

    if isinstance(source, dict):
        return source.get(key, default)

    if hasattr(source, "get"):
        return source.get(key, default)

    return getattr(source, key, default)


def _is_guest_user(user: str | None) -> bool:
    """Return True when the request user cannot perform POS writes."""

    return not user or user == "Guest"


def _is_profile_company_allowed(profile_company: str | None, company: str | None) -> bool:
    """Return True when a requested company is compatible with a POS Profile."""

    if not company:
        return True

    return bool(profile_company) and profile_company == company


def _is_profile_action_enabled(pos_profile: Any, action_flag: str | None) -> bool:
    """Return True when the optional POS Profile feature flag permits the action."""

    if not action_flag:
        return True

    return bool(_get_mapping_value(pos_profile, action_flag))


def _throw_permission(message: str):
    permission_error = getattr(frappe, "PermissionError", None)
    if permission_error:
        frappe.throw(message, permission_error)
    frappe.throw(message)


def assert_doctype_permission(doctype: str, permission_type: str = "read", user=None):
    """Enforce the matching ERPNext DocType permission when Frappe exposes it."""

    from frappe import _

    user = user or getattr(frappe.session, "user", None)
    if _is_guest_user(user):
        _throw_permission(_("Guest users are not allowed to access {0}.").format(doctype))

    checker = getattr(frappe, "has_permission", None)
    if callable(checker) and not checker(doctype, ptype=permission_type, user=user):
        _throw_permission(
            _("User {0} does not have {1} permission for {2}.").format(
                user,
                permission_type,
                doctype,
            )
        )
    return True


def assert_document_permission(doc: Any, permission_type: str = "read", user=None):
    """Enforce ERPNext permission for one concrete document.

    DocType checks alone do not apply user-permission and document ownership
    constraints.  POS endpoints that load an existing document must call this
    helper before returning or mutating it.
    """

    from frappe import _

    if doc is None:
        _throw_permission(_("The requested document is not accessible."))

    user = user or getattr(frappe.session, "user", None)
    if _is_guest_user(user):
        _throw_permission(_("Guest users are not allowed to access this document."))

    doctype = _get_mapping_value(doc, "doctype")
    name = _get_mapping_value(doc, "name")
    checker = getattr(frappe, "has_permission", None)
    if callable(checker):
        try:
            allowed = checker(
                doctype,
                ptype=permission_type,
                doc=doc,
                user=user,
            )
        except TypeError:
            # Compatibility with older Frappe versions that do not accept a
            # user argument when a document is supplied.
            allowed = checker(doctype, ptype=permission_type, doc=doc)
        if not allowed:
            _throw_permission(
                _("User {0} does not have {1} permission for {2} {3}.").format(
                    user,
                    permission_type,
                    doctype,
                    name or "",
                )
            )
    return True


def _resolve_opening_shift(profile_doc, opening_shift=None, required=False):
    from frappe import _

    if not required and not opening_shift:
        return None

    user = getattr(frappe.session, "user", None)
    profile_name = _get_mapping_value(profile_doc, "name")
    company = _get_mapping_value(profile_doc, "company")
    shift_name = _get_mapping_value(opening_shift, "name", opening_shift)

    if not shift_name:
        shift_name = frappe.db.get_value(
            "POS Opening Shift",
            {
                "user": user,
                "pos_profile": profile_name,
                "company": company,
                "docstatus": 1,
                "status": "Open",
                "pos_closing_shift": ["is", "not set"],
            },
            "name",
        )

    if not shift_name:
        _throw_permission(_("An active POS Opening Shift is required."))

    shift_doc = frappe.get_doc("POS Opening Shift", shift_name)
    valid = all(
        (
            _get_mapping_value(shift_doc, "user") == user,
            _get_mapping_value(shift_doc, "pos_profile") == profile_name,
            _get_mapping_value(shift_doc, "company") == company,
            int(_get_mapping_value(shift_doc, "docstatus", 0) or 0) == 1,
            _get_mapping_value(shift_doc, "status") == "Open",
            not _get_mapping_value(shift_doc, "pos_closing_shift"),
        )
    )
    if not valid:
        _throw_permission(_("The POS Opening Shift does not belong to this session."))
    return shift_doc


def get_pos_request_context(
    pos_profile,
    *,
    company=None,
    action_flag=None,
    doctype=None,
    permission_type="read",
    require_open_shift=False,
    opening_shift=None,
):
    """Resolve the authoritative profile/session boundary for a POS request."""

    from frappe import _

    profile_doc = assert_pos_profile_access_allowed(pos_profile)
    profile_name = _get_mapping_value(profile_doc, "name")
    profile_company = _get_mapping_value(profile_doc, "company")
    if company and not _is_profile_company_allowed(profile_company, company):
        _throw_permission(
            _("POS Profile {0} is not allowed to access company {1}.").format(
                profile_name,
                company,
            )
        )
    if action_flag and not _is_profile_action_enabled(profile_doc, action_flag):
        _throw_permission(
            _("POS Profile {0} does not allow this action: {1}.").format(
                profile_name,
                action_flag,
            )
        )
    if doctype:
        assert_doctype_permission(doctype, permission_type)

    shift_doc = _resolve_opening_shift(
        profile_doc,
        opening_shift=opening_shift,
        required=require_open_shift,
    )
    return POSRequestContext(
        user=getattr(frappe.session, "user", ""),
        pos_profile=profile_doc,
        profile_name=profile_name,
        company=profile_company,
        warehouse=_get_mapping_value(profile_doc, "warehouse"),
        opening_shift=shift_doc,
    )


def _get_pos_profile_doc(pos_profile: Any):
    """Resolve a POS Profile name, dict, JSON string, or document-like object."""

    if pos_profile is None:
        return None

    if isinstance(pos_profile, str):
        raw_value = pos_profile.strip()
        if not raw_value:
            return None

        try:
            decoded_value = json.loads(raw_value)
        except Exception:
            decoded_value = raw_value

        if isinstance(decoded_value, dict):
            profile_name = decoded_value.get("name")
            if profile_name:
                if not frappe.db.exists("POS Profile", profile_name):
                    return None
                return frappe.get_cached_doc("POS Profile", profile_name)
            return None

        if isinstance(decoded_value, str) and decoded_value:
            if not frappe.db.exists("POS Profile", decoded_value):
                return None
            return frappe.get_cached_doc("POS Profile", decoded_value)

        return None

    if isinstance(pos_profile, dict):
        profile_name = pos_profile.get("name")
        if profile_name:
            if not frappe.db.exists("POS Profile", profile_name):
                return None
            return frappe.get_cached_doc("POS Profile", profile_name)
        return None

    profile_name = _get_mapping_value(pos_profile, "name")
    if profile_name and frappe.db.exists("POS Profile", profile_name):
        return pos_profile

    return None


def assert_pos_profile_access_allowed(pos_profile):
    """Return the authoritative POS Profile document for this session.

    Request payloads are treated only as profile-name selectors.  Company,
    warehouse, price lists and feature flags are always reloaded server-side,
    and non-Administrator users must be explicitly listed in POS Profile User.
    """

    from frappe import _

    user = getattr(frappe.session, "user", None)
    if _is_guest_user(user):
        frappe.throw(_("Guest users are not allowed to access POS data."))

    profile_doc = _get_pos_profile_doc(pos_profile)
    if not profile_doc:
        frappe.throw(_("POS Profile {0} was not found.").format(pos_profile or ""))

    profile_name = _get_mapping_value(profile_doc, "name")
    if _get_mapping_value(profile_doc, "disabled", 0):
        frappe.throw(_("POS Profile {0} is disabled.").format(profile_name))

    if user != "Administrator":
        is_assigned = frappe.db.exists(
            "POS Profile User",
            {"parent": profile_name, "user": user},
        )
        if not is_assigned:
            frappe.throw(
                _("User {0} is not assigned to POS Profile {1}.").format(
                    user,
                    profile_name,
                )
            )

    return profile_doc


def assert_pos_profile_write_allowed(
    pos_profile,
    action_flag=None,
    company=None,
    doctype=None,
    permission_type="create",
    require_open_shift=False,
    opening_shift=None,
):
    """Validate the current request can perform a POS Profile-scoped write.

    This intentionally does not replace document permissions or remove existing
    ``ignore_permissions`` usage. It centralizes the lightweight POS checks that
    write APIs can call before performing POS-specific persistence.
    """

    from frappe import _

    user = getattr(frappe.session, "user", None)
    if _is_guest_user(user):
        frappe.throw(_("Guest users are not allowed to perform POS write actions."))

    profile_doc = (
        assert_pos_profile_access_allowed(pos_profile)
        if pos_profile
        else None
    )
    if pos_profile and not profile_doc:
        frappe.throw(_("POS Profile {0} was not found.").format(pos_profile))

    if (company or action_flag) and not profile_doc:
        frappe.throw(_("POS Profile is required for this POS write action."))

    if profile_doc and company:
        profile_company = _get_mapping_value(profile_doc, "company")
        if not _is_profile_company_allowed(profile_company, company):
            frappe.throw(
                _("POS Profile {0} is not allowed to write for company {1}.").format(
                    _get_mapping_value(profile_doc, "name", pos_profile),
                    company,
                )
            )

    if profile_doc and action_flag and not _is_profile_action_enabled(profile_doc, action_flag):
        frappe.throw(
            _("POS Profile {0} does not allow this action: {1}.").format(
                _get_mapping_value(profile_doc, "name", pos_profile),
                action_flag,
            )
        )

    if doctype:
        assert_doctype_permission(doctype, permission_type)
    if profile_doc and (require_open_shift or opening_shift):
        _resolve_opening_shift(
            profile_doc,
            opening_shift=opening_shift,
            required=require_open_shift,
        )

    return profile_doc


def expand_item_groups(item_groups):
    """Expand any parent item groups to include their children.

    This function takes a list of item groups and expands any parent groups
    to include all their descendants, while keeping leaf groups as-is.
    """
    if not item_groups:
        return item_groups

    try:
        from erpnext.utilities.doctype.item_group.item_group import get_child_groups
    except Exception:
        get_child_groups = None

    expanded_groups = set()
    for group in item_groups:
        if not group:
            continue

        # Check if this is a parent group
        is_group = frappe.db.get_value("Item Group", group, "is_group")

        if is_group:
            # If it's a parent group, get all its children
            if get_child_groups:
                try:
                    descendants = get_child_groups(group) or []
                    expanded_groups.update(descendants)
                except Exception:
                    # Fallback to database method
                    descendants = frappe.db.get_descendants("Item Group", group) or []
                    expanded_groups.update(descendants)
            else:
                descendants = frappe.db.get_descendants("Item Group", group) or []
                expanded_groups.update(descendants)
        else:
            # If it's a leaf group, add it directly
            expanded_groups.add(group)

    return list(expanded_groups)


def _ensure_pos_profile(pos_profile):
    """Return a ``(profile_dict, profile_json)`` tuple for the given input.

    The POS profile parameter can arrive as a JSON string, a python ``dict``,
    a bare profile name or even ``None`` (when the frontend has not yet loaded
    the active profile). This helper normalises those inputs so downstream code
    can rely on a fully populated dictionary and a JSON serialised
    representation of the same profile. If no valid profile can be resolved a
    user-facing validation error is raised.
    """
    from frappe import _
    from frappe import as_json

    profile_selector = None

    if isinstance(pos_profile, dict):
        profile_selector = pos_profile.get("name")
    elif isinstance(pos_profile, str):
        raw_value = pos_profile.strip()
        if raw_value:
            try:
                decoded_value = json.loads(raw_value)
            except Exception:
                decoded_value = raw_value

            if isinstance(decoded_value, dict):
                profile_selector = decoded_value.get("name")
            elif isinstance(decoded_value, str):
                profile_selector = decoded_value or None

    if not profile_selector:
        active_profile = get_active_pos_profile()
        profile_selector = _get_mapping_value(active_profile, "name")

    if not profile_selector:
        frappe.throw(_("POS profile data is missing or invalid."))

    profile_doc = assert_pos_profile_access_allowed(profile_selector)
    profile_dict = (
        profile_doc.as_dict()
        if hasattr(profile_doc, "as_dict")
        else dict(profile_doc)
    )
    profile_json = as_json(profile_dict)
    return profile_dict, profile_json


@frappe.whitelist()
def get_active_pos_profile(user=None):
    """Return the active POS profile for the given user."""
    user = user or frappe.session.user
    profile = frappe.db.get_value("POS Profile User", {"user": user}, "parent")
    if not profile and user == "Administrator":
        profile = frappe.db.get_single_value("POS Settings", "pos_profile")
    if not profile:
        return None
    profile_doc = assert_pos_profile_access_allowed(profile)
    return profile_doc.as_dict()


@frappe.whitelist()
def get_warehouses(company=None, pos_profile=None, pos_opening_shift=None):
    """Return non-group, non-disabled warehouses optionally scoped by company."""
    context = get_pos_request_context(
        pos_profile,
        company=company,
        doctype="Warehouse",
        permission_type="read",
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )
    warehouses = [context.warehouse] if context.warehouse else []
    if context.warehouse and frappe.db.get_value("Warehouse", context.warehouse, "is_group"):
        warehouses = frappe.db.get_descendants("Warehouse", context.warehouse) or []
    if not warehouses:
        return []
    return frappe.get_list(
        "Warehouse",
        filters={
            "name": ["in", warehouses],
            "company": context.company,
            "is_group": 0,
            "disabled": 0,
        },
        fields=["name", "warehouse_name"],
        order_by="name asc",
        limit_page_length=500,
    )


@frappe.whitelist()
def get_default_warehouse(company=None, pos_profile=None, pos_opening_shift=None):
    """Return the default warehouse for the given company."""
    context = get_pos_request_context(
        pos_profile,
        company=company,
        doctype="Warehouse",
        permission_type="read",
        require_open_shift=True,
        opening_shift=pos_opening_shift,
    )
    return context.warehouse


def _get_default_warehouse(company=None):
    """Internal settings fallback; callers must establish authorization."""

    company = company or frappe.defaults.get_default("company")
    if not company:
        return None
    return frappe.db.get_single_value("Stock Settings", "default_warehouse")


def _resolve_pos_profile_input(pos_profile=None):
    """Return a POS profile dict from a name, JSON string, dict or fallback."""

    if isinstance(pos_profile, dict):
        pos_profile = pos_profile.get("name")

    if isinstance(pos_profile, str):
        raw_value = pos_profile.strip()
        if not raw_value:
            return None

        try:
            decoded_value = json.loads(raw_value)
        except Exception:
            decoded_value = raw_value

        if isinstance(decoded_value, dict):
            pos_profile = decoded_value.get("name")

        elif isinstance(decoded_value, str) and decoded_value:
            pos_profile = decoded_value

    if pos_profile:
        return assert_pos_profile_access_allowed(pos_profile).as_dict()
    return None


def fetch_sales_person_names(pos_profile=None):
    """Return the list of enabled sales persons allowed for the active POS profile."""

    logger.info("Fetching sales persons...")

    try:
        assert_doctype_permission("Sales Person", "read")
        profile = _resolve_pos_profile_input(pos_profile) or get_active_pos_profile()
        allowed = []
        if profile:
            allowed = [
                d.get("sales_person") for d in profile.get("posa_sales_persons", []) if d.get("sales_person")
            ]

        filters = {"enabled": 1}
        if allowed:
            filters["name"] = ["in", allowed]
            sales_persons = frappe.get_list(
                "Sales Person",
                filters=filters,
                fields=["name", "sales_person_name"],
                limit_page_length=100000,
                order_by="sales_person_name asc, name asc",
            )
        else:
            sales_persons = frappe.get_list(
                "Sales Person",
                filters=filters,
                fields=["name", "sales_person_name"],
                limit_page_length=100000,
                order_by="sales_person_name asc, name asc",
            )

        logger.info(
            "Found %s sales persons: %s",
            len(sales_persons),
            json.dumps(sales_persons),
        )

        return sales_persons
    except Exception as exc:
        logger.exception("Error fetching sales persons")
        frappe.log_error(
            f"Error fetching sales persons: {exc}",
            "POS Sales Person Error",
        )
        return []


def is_perf_logging_enabled() -> bool:
    """Return True when lightweight POS performance logging is enabled."""

    return bool(frappe.conf.get("posa_perf_log_enabled"))


def log_perf_event(event: str, started_at: float, **context):
    """Emit a structured performance log line when enabled."""

    if not is_perf_logging_enabled():
        return

    elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
    context_parts = [f"{key}={context[key]}" for key in sorted(context.keys())]
    context_str = " ".join(context_parts)
    logger.info("[POSA_PERF] event=%s elapsed_ms=%s %s", event, elapsed_ms, context_str)


@cache
def get_item_groups(pos_profile: str) -> list[str]:
    """Return all item groups for a POS profile, including descendants.

    The linked groups from the ``POS Item Group`` child table are
    expanded to include all of their descendants. Results are cached
    to avoid duplicate database calls within a process.


    """
    if not pos_profile or not frappe.db.exists("DocType", "POS Item Group"):
        return []

    groups = frappe.get_all(
        "POS Item Group",
        filters={"parent": pos_profile},
        pluck="item_group",
    )

    return expand_item_groups(groups)
