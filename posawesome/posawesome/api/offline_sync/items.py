import frappe

from posawesome.posawesome.api.items import get_delta_items, get_items
from posawesome.posawesome.api.offline_sync.common import (
    SYNC_SCHEMA_VERSION,
    _build_response,
    _max_timestamp,
    _resolve_sync_until,
    _resolve_profile,
    _serialize_profile,
)
from posawesome.posawesome.api.utils import (
    expand_item_groups,
    get_item_groups,
)

def _coerce_limit(value, default=200, maximum=2000):
    try:
        resolved = int(value or default)
    except (TypeError, ValueError):
        resolved = default
    return max(1, min(resolved, maximum))


def _get_allowed_item_groups(profile):
    try:
        return expand_item_groups(get_item_groups(profile.get("name")) or [])
    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            f"POS Awesome: failed to resolve offline-sync item groups for profile {profile.get('name') if isinstance(profile, dict) else ''}",
        )
        return []


def _is_item_allowed(item_row, allowed_groups):
    if item_row.get("disabled"):
        return False
    if not item_row.get("is_sales_item", 0):
        return False
    if item_row.get("is_fixed_asset"):
        return False
    if allowed_groups and item_row.get("item_group") not in allowed_groups:
        return False
    return True


def _collect_deleted_items(
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
        filters["item_code"] = [">", start_after]

    rows = (
        frappe.get_all(
            "Item",
            filters=filters,
            fields=[
                "item_code",
                "modified",
                "disabled",
                "is_sales_item",
                "is_fixed_asset",
                "item_group",
                "variant_of",
            ],
            order_by="item_code asc",
            limit_page_length=limit,
        )
        or []
    )

    allowed_groups = _get_allowed_item_groups(profile)
    return [
        {
            "key": f"item::{row.get('item_code')}",
            "modified": row.get("modified"),
        }
        for row in rows
        if row.get("item_code") and not _is_item_allowed(row, allowed_groups)
    ]


@frappe.whitelist()
def sync_items(
    pos_profile=None,
    watermark=None,
    price_list=None,
    customer=None,
    start_after=None,
    offset=None,
    limit=200,
    schema_version=None,
    sync_until=None,
):
    if schema_version and schema_version != SYNC_SCHEMA_VERSION:
        return _build_response(full_resync_required=True)

    profile = _resolve_profile(pos_profile)
    if not profile:
        frappe.throw("pos_profile is required")

    resolved_limit = _coerce_limit(limit)
    fetch_limit = resolved_limit + 1
    resolved_sync_until = _resolve_sync_until(sync_until)
    serialized_profile = _serialize_profile(profile)
    effective_price_list = price_list or profile.get("selling_price_list")

    if watermark:
        rows = (
            get_delta_items(
                serialized_profile,
                modified_after=watermark,
                modified_before=resolved_sync_until,
                price_list=effective_price_list,
                customer=customer,
                limit=fetch_limit,
                start_after_item_code=start_after or "",
                include_related_changes=False,
                include_image=True,
            )
            or []
        )
    else:
        pagination_args = {}
        if start_after is not None or offset is None:
            pagination_args["start_after_item_code"] = start_after or ""
        else:
            pagination_args["offset"] = offset
        rows = (
            get_items(
                serialized_profile,
                price_list=effective_price_list,
                item_group="",
                search_value="",
                customer=customer,
                limit=fetch_limit,
                modified_before=resolved_sync_until,
                include_image=True,
                **pagination_args,
            )
            or []
        )

    deleted_rows = _collect_deleted_items(
        profile,
        watermark,
        fetch_limit,
        start_after=start_after,
        sync_until=resolved_sync_until,
    )
    rows_by_code = {
        row.get("item_code"): row
        for row in rows
        if row.get("item_code")
    }
    deleted_by_code = {
        str(row.get("key") or "").removeprefix("item::"): row
        for row in deleted_rows
        if row.get("key")
    }
    page_codes = sorted(set(rows_by_code) | set(deleted_by_code))
    has_more = len(page_codes) > resolved_limit
    page_codes = page_codes[:resolved_limit]
    rows = [rows_by_code[code] for code in page_codes if code in rows_by_code]
    deleted_rows = [
        deleted_by_code[code]
        for code in page_codes
        if code in deleted_by_code
    ]

    changes = [
        {
            "key": f"item::{row.get('item_code')}",
            "modified": row.get("modified"),
            "data": row,
        }
        for row in rows
        if row.get("item_code")
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
    return _build_response(
        changes=changes,
        deleted=deleted,
        next_watermark=next_watermark,
        next_cursor=page_codes[-1] if has_more and page_codes else None,
        sync_until=resolved_sync_until,
        has_more=has_more,
    )
