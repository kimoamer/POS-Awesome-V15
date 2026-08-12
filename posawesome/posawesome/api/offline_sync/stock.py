import frappe

from posawesome.posawesome.api.item_processing.stock import _get_bulk_stock_availability
from posawesome.posawesome.api.offline_sync.common import (
    SYNC_SCHEMA_VERSION,
    _build_response,
    _max_timestamp,
    _resolve_sync_until,
    _resolve_profile,
)


def _coerce_limit(value, default=200, maximum=2000):
    try:
        resolved = int(value or default)
    except (TypeError, ValueError):
        resolved = default
    return max(1, min(resolved, maximum))


def _resolve_warehouses(profile):
    warehouse = profile.get("warehouse")
    if not warehouse:
        return []
    is_group = 0
    if getattr(frappe, "db", None):
        is_group = frappe.db.get_value("Warehouse", warehouse, "is_group")
    if is_group and getattr(frappe.db, "get_descendants", None):
        return frappe.db.get_descendants("Warehouse", warehouse) or []
    return [warehouse]


def _collect_stock_rows(
    profile,
    watermark,
    start_after,
    limit,
    sync_until=None,
):
    warehouses = _resolve_warehouses(profile)
    if not warehouses:
        return []

    filters = {
        "warehouse": ["in", warehouses],
    }
    if watermark:
        filters["modified"] = ["between", [watermark, sync_until]]
    elif sync_until:
        filters["modified"] = ["<=", sync_until]
    if start_after:
        filters["item_code"] = [">", start_after]

    rows = (
        frappe.get_all(
            "Bin",
            filters=filters,
            fields=["item_code", "max(modified) as modified"],
            group_by="item_code",
            order_by="item_code asc",
            limit_page_length=limit,
        )
        or []
    )
    return [row for row in rows if row.get("item_code")]


@frappe.whitelist()
def sync_stock(
    pos_profile=None,
    watermark=None,
    start_after=None,
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
    warehouse = profile.get("warehouse")
    rows = _collect_stock_rows(
        profile,
        watermark,
        start_after,
        fetch_limit,
        sync_until=resolved_sync_until,
    )
    has_more = len(rows) > resolved_limit
    rows = rows[:resolved_limit]

    stock_rows = [
        {
            "item_code": row.get("item_code"),
            "warehouse": warehouse,
        }
        for row in rows
        if row.get("item_code") and warehouse
    ]
    stock_map = _get_bulk_stock_availability(stock_rows)

    changes = []
    for row in rows:
        item_code = row.get("item_code")
        if not item_code or not warehouse:
            continue
        changes.append(
            {
                "key": f"stock::{item_code}",
                "modified": row.get("modified"),
                "data": {
                    "item_code": item_code,
                    "warehouse": warehouse,
                    "actual_qty": stock_map.get((item_code, warehouse, ""), 0.0),
                },
            }
        )

    next_watermark = (
        _max_timestamp(watermark, [row.get("modified") for row in rows])
        if has_more
        else resolved_sync_until
    )
    return _build_response(
        changes=changes,
        deleted=[],
        next_watermark=next_watermark,
        next_cursor=rows[-1].get("item_code") if has_more and rows else None,
        sync_until=resolved_sync_until,
        has_more=has_more,
    )
