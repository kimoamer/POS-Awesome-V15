import frappe

from posawesome.posawesome.api.customers import (
    get_customer_groups,
    get_customer_names,
)
from posawesome.posawesome.api.offline_sync.common import (
    SYNC_SCHEMA_VERSION,
    _build_response,
    _max_timestamp,
    _resolve_sync_until,
    _resolve_profile,
    _serialize_profile,
)


def _build_customer_response(**kwargs):
    response = _build_response(**kwargs)
    response["schema_version"] = SYNC_SCHEMA_VERSION
    return response


def _coerce_limit(value, default=200, maximum=2000):
    try:
        resolved = int(value or default)
    except (TypeError, ValueError):
        resolved = default
    return max(1, min(resolved, maximum))


def _collect_deleted_customers(
    profile,
    watermark,
    limit,
    start_after=None,
    sync_until=None,
):
    if not watermark:
        return []

    filters = {
        "modified": ["between", [watermark, sync_until]]
        if sync_until
        else [">", watermark]
    }
    if start_after:
        filters["name"] = [">", start_after]

    rows = (
        frappe.get_all(
            "Customer",
            filters=filters,
            fields=["name", "modified", "disabled", "customer_group"],
            order_by="name asc",
            limit_page_length=limit,
        )
        or []
    )
    allowed_groups = set(get_customer_groups(profile) or [])

    return [
        {
            "key": f"customer::{row.get('name')}",
            "modified": row.get("modified"),
        }
        for row in rows
        if row.get("name")
        and (row.get("disabled") or (allowed_groups and row.get("customer_group") not in allowed_groups))
    ]


@frappe.whitelist()
def sync_customers(
    pos_profile=None,
    watermark=None,
    start_after=None,
    limit=200,
    schema_version=None,
    sync_until=None,
):
    if schema_version and schema_version != SYNC_SCHEMA_VERSION:
        return _build_customer_response(full_resync_required=True)

    profile = _resolve_profile(pos_profile)
    if not profile:
        frappe.throw("pos_profile is required")

    resolved_limit = _coerce_limit(limit)
    fetch_limit = resolved_limit + 1
    resolved_sync_until = _resolve_sync_until(sync_until)
    serialized_profile = _serialize_profile(profile)
    rows = (
        get_customer_names(
            serialized_profile,
            limit=fetch_limit,
            start_after=start_after,
            modified_after=watermark,
            modified_before=resolved_sync_until,
        )
        or []
    )

    deleted_rows = _collect_deleted_customers(
        profile,
        watermark,
        fetch_limit,
        start_after=start_after,
        sync_until=resolved_sync_until,
    )
    rows_by_name = {row.get("name"): row for row in rows if row.get("name")}
    deleted_by_name = {
        str(row.get("key") or "").removeprefix("customer::"): row
        for row in deleted_rows
        if row.get("key")
    }
    page_names = sorted(set(rows_by_name) | set(deleted_by_name))
    has_more = len(page_names) > resolved_limit
    page_names = page_names[:resolved_limit]
    rows = [rows_by_name[name] for name in page_names if name in rows_by_name]
    deleted_rows = [
        deleted_by_name[name]
        for name in page_names
        if name in deleted_by_name
    ]

    changes = [
        {
            "key": f"customer::{row.get('name')}",
            "modified": row.get("modified"),
            "data": row,
        }
        for row in rows
        if row.get("name")
    ]

    deleted = [{"key": row["key"]} for row in deleted_rows]
    next_watermark = (
        _max_timestamp(
            watermark,
            [row.get("modified") for row in rows],
            [row.get("modified") for row in deleted_rows],
        )
        if has_more
        else resolved_sync_until
    )
    return _build_customer_response(
        changes=changes,
        deleted=deleted,
        next_watermark=next_watermark,
        next_cursor=page_names[-1] if has_more and page_names else None,
        sync_until=resolved_sync_until,
        has_more=has_more,
    )
