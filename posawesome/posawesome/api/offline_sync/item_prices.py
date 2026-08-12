import frappe

from posawesome.posawesome.api.offline_sync.common import (
    SYNC_SCHEMA_VERSION,
    _build_response,
    _max_timestamp,
    _resolve_sync_until,
    _resolve_profile,
)

ITEM_PRICE_FIELDS = [
    "name",
    "price_list",
    "item_code",
    "uom",
    "currency",
    "customer",
    "price_list_rate",
    "valid_from",
    "valid_upto",
    "modified",
]


def _coerce_int(value, default, minimum=0, maximum=2000):
    try:
        resolved = int(value if value is not None else default)
    except (TypeError, ValueError):
        resolved = default
    return max(minimum, min(resolved, maximum))


def _selling_price_lists(profile):
    rows = (
        frappe.get_all(
            "Price List",
            filters={"selling": 1},
            fields=["name"],
            order_by="name asc",
        )
        or []
    )
    names = [row.get("name") for row in rows if row.get("name")]
    selected = profile.get("selling_price_list")
    if selected and selected not in names:
        names.append(selected)
    return sorted(set(names))


def _deleted_item_prices(
    watermark,
    start_after=None,
    limit=501,
    sync_until=None,
):
    if not watermark:
        return []
    filters = {
        "deleted_doctype": "Item Price",
        "creation": ["between", [watermark, sync_until]]
        if sync_until
        else [">", watermark],
    }
    if start_after:
        filters["deleted_name"] = [">", start_after]
    rows = (
        frappe.get_all(
            "Deleted Document",
            filters=filters,
            fields=["deleted_name", "creation"],
            order_by="deleted_name asc",
            limit_page_length=limit,
        )
        or []
    )
    return [
        {
            "key": f"item_price::{row.get('deleted_name')}",
            "modified": row.get("creation"),
        }
        for row in rows
        if row.get("deleted_name")
    ]


@frappe.whitelist()
def sync_item_prices(
    pos_profile=None,
    watermark=None,
    offset=0,
    start_after=None,
    limit=500,
    schema_version=None,
    sync_until=None,
):
    if schema_version and schema_version != SYNC_SCHEMA_VERSION:
        return _build_response(full_resync_required=True)

    profile = _resolve_profile(pos_profile)
    if not profile:
        frappe.throw("pos_profile is required")

    resolved_sync_until = _resolve_sync_until(sync_until)
    price_lists = _selling_price_lists(profile)
    if not price_lists:
        response = _build_response(
            next_watermark=resolved_sync_until,
            sync_until=resolved_sync_until,
        )
        response["scope"] = {"price_lists": []}
        return response

    resolved_limit = _coerce_int(limit, 500, minimum=1)
    filters = {"price_list": ("in", price_lists)}
    if watermark:
        filters["modified"] = ["between", [watermark, resolved_sync_until]]
    else:
        filters["modified"] = ["<=", resolved_sync_until]
    if start_after:
        filters["name"] = [">", start_after]

    rows = (
        frappe.get_all(
            "Item Price",
            filters=filters,
            fields=ITEM_PRICE_FIELDS,
            order_by="name asc",
            limit_page_length=resolved_limit + 1,
        )
        or []
    )
    deleted_rows = _deleted_item_prices(
        watermark,
        start_after=start_after,
        limit=resolved_limit + 1,
        sync_until=resolved_sync_until,
    )
    rows_by_name = {row.get("name"): row for row in rows if row.get("name")}
    deleted_by_name = {
        str(row.get("key") or "").removeprefix("item_price::"): row
        for row in deleted_rows
        if row.get("key")
    }
    page_names = sorted(set(rows_by_name) | set(deleted_by_name))
    has_more = len(page_names) > resolved_limit
    page_names = page_names[:resolved_limit]
    page_rows = [rows_by_name[name] for name in page_names if name in rows_by_name]
    deleted_rows = [
        deleted_by_name[name]
        for name in page_names
        if name in deleted_by_name
    ]

    changes = [
        {
            "key": f"item_price::{row.get('name')}",
            "modified": row.get("modified"),
            "data": dict(row),
        }
        for row in page_rows
        if row.get("name")
    ]
    deleted = [{"key": row["key"]} for row in deleted_rows]
    next_watermark = (
        _max_timestamp(
            watermark,
            [row.get("modified") for row in page_rows],
            [row.get("modified") for row in deleted_rows],
        )
        if has_more
        else resolved_sync_until
    )

    response = _build_response(
        changes=changes,
        deleted=deleted,
        next_watermark=next_watermark,
        next_cursor=page_names[-1] if has_more and page_names else None,
        sync_until=resolved_sync_until,
        has_more=has_more,
    )
    response["scope"] = {"price_lists": price_lists}
    return response
