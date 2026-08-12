import json
from datetime import datetime, timezone

import frappe

from posawesome.posawesome.api.utils import get_active_pos_profile

try:
    from posawesome.posawesome.api.utils import _ensure_pos_profile
except ImportError:  # Lightweight isolated endpoint tests provide a minimal stub.
    _ensure_pos_profile = None

# Public protocol version shared by every offline-sync endpoint and the
# frontend coordinator. Bump this only when the request/response contract or
# cursor semantics change, and keep the TypeScript constant in
# frontend/src/offline/sync/schemaVersion.ts in lock-step.
SYNC_SCHEMA_VERSION = "2026-08-08"


def _normalize_timestamp(value):
    text = str(value or "").strip()
    return text or None


def _max_timestamp(*values):
    normalized = []
    for value in values:
        if isinstance(value, (list, tuple, set)):
            normalized.extend([item for item in (_normalize_timestamp(entry) for entry in value) if item])
            continue
        timestamp = _normalize_timestamp(value)
        if timestamp:
            normalized.append(timestamp)
    return max(normalized) if normalized else None


def _resolve_sync_until(value=None):
    supplied = _normalize_timestamp(value)
    if supplied:
        return supplied
    return datetime.now(timezone.utc).isoformat()


def _serialize_profile(profile):
    """Serialize an authoritative POS Profile with Frappe's date handler.

    ``Document.as_dict()`` may contain ``date``/``datetime`` values (including
    values in child tables), so Python's plain ``json.dumps`` is not safe here.
    The fallback keeps the lightweight isolated endpoint tests independent of
    a complete Frappe runtime while preserving the same JSON contract.
    """

    serializer = getattr(frappe, "as_json", None)
    if callable(serializer):
        return serializer(profile)
    return json.dumps(profile, default=str)


def _build_response(
    changes=None,
    deleted=None,
    next_watermark=None,
    next_cursor=None,
    sync_until=None,
    has_more=False,
    full_resync_required=False,
):
    response = {
        "changes": changes or [],
        "deleted": deleted or [],
        "next_watermark": next_watermark,
        "next_cursor": next_cursor,
        "sync_until": sync_until,
        "has_more": bool(has_more),
        "schema_version": SYNC_SCHEMA_VERSION,
    }
    if full_resync_required:
        response["full_resync_required"] = True
    return response


def _resolve_profile(pos_profile=None):
    if _ensure_pos_profile:
        profile, _profile_json = _ensure_pos_profile(pos_profile)
        return profile

    # Compatibility path for isolated unit-test stubs. Production always uses
    # the authoritative resolver above and never trusts these client fields.
    if isinstance(pos_profile, dict):
        profile_name = pos_profile.get("name")
        if profile_name:
            try:
                doc = frappe.get_cached_doc("POS Profile", profile_name)
                return doc.as_dict() if hasattr(doc, "as_dict") else doc
            except Exception:
                return pos_profile

    if isinstance(pos_profile, str):
        raw_value = pos_profile.strip()
        if not raw_value:
            return get_active_pos_profile()
        try:
            decoded = json.loads(raw_value)
        except json.JSONDecodeError:
            decoded = raw_value

        if isinstance(decoded, dict):
            return decoded
        if isinstance(decoded, str):
            try:
                doc = frappe.get_cached_doc("POS Profile", decoded)
            except frappe.DoesNotExistError:
                return decoded
            return doc.as_dict() if hasattr(doc, "as_dict") else doc

    return get_active_pos_profile()
