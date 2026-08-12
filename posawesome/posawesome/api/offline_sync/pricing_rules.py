import frappe

from posawesome.posawesome.api.offline_sync.common import (
    SYNC_SCHEMA_VERSION,
    _build_response,
    _max_timestamp,
    _resolve_sync_until,
    _resolve_profile,
)
from posawesome.posawesome.api.pricing_rules import (
    _get_targets_map,
    _normalise_rule,
    _serialize_rule,
)

BASE_FIELDS = [
    "name",
    "priority",
    "apply_multiple_pricing_rules",
    "apply_on",
    "min_qty",
    "valid_from",
    "valid_upto",
    "price_or_product_discount",
    "rate_or_discount",
    "discount_percentage",
    "discount_amount",
    "rate",
    "currency",
    "for_price_list",
    "company",
    "customer",
    "customer_group",
    "territory",
    "selling",
    "disable",
    "modified",
]

OPTIONAL_FIELDS = [
    "margin_type",
    "max_qty",
    "min_amt",
    "max_amt",
    "margin_rate_or_amount",
    "apply_discount_on_rate",
    "same_item",
    "free_item",
    "free_qty",
    "free_qty_per_unit",
    "free_item_rate",
    "apply_per_threshold",
    "max_free_qty",
    "is_recursive",
    "recurse_for",
    "apply_recursion_over",
    "round_free_qty",
    "dont_enforce_free_item_qty",
    "stop_further_rules",
    "for_price_list_rate",
    "uom",
    "apply_rule_on_other",
    "other_item_code",
    "other_item_group",
    "other_brand",
]


def _coerce_int(value, default, minimum=0, maximum=2000):
    try:
        resolved = int(value if value is not None else default)
    except (TypeError, ValueError):
        resolved = default
    return max(minimum, min(resolved, maximum))


def _pricing_rule_fields():
    try:
        meta = frappe.get_meta("Pricing Rule")
    except Exception:
        return BASE_FIELDS
    return BASE_FIELDS + [field for field in OPTIONAL_FIELDS if meta.has_field(field)]


def _deleted_rules(
    watermark,
    start_after=None,
    limit=201,
    sync_until=None,
):
    if not watermark:
        return []
    filters = {
        "deleted_doctype": "Pricing Rule",
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
            "key": f"pricing_rule::{row.get('deleted_name')}",
            "modified": row.get("creation"),
        }
        for row in rows
        if row.get("deleted_name")
    ]


def _target_descriptor(rule):
    mapping = {
        "Item Code": ("item_code", rule.get("item_code")),
        "Item Group": ("item_group", rule.get("item_group")),
        "Brand": ("brand", rule.get("brand")),
    }
    return mapping.get(rule.get("apply_on"), ("all", ""))


def _serialize_rows(rows):
    parent_names = [row.get("name") for row in rows if row.get("name")]
    targets = _get_targets_map(parent_names)
    changes = []

    for row in rows:
        normalised = _normalise_rule(row)
        target_field = {
            "Item Code": "item_code",
            "Item Group": "item_group",
            "Brand": "brand",
        }.get(row.get("apply_on"))
        target_values = targets.get(target_field, {}).get(row.get("name")) if target_field else None
        for rule in _serialize_rule(normalised, target_field, target_values):
            target_type, target_value = _target_descriptor(rule)
            data = dict(rule)
            data.update(
                {
                    "key": f"{row.get('name')}::{target_type}::{target_value or ''}",
                    "rule_name": row.get("name"),
                    "target_type": target_type,
                    "target_value": target_value or "",
                    "modified": row.get("modified"),
                }
            )
            changes.append(
                {
                    "key": f"pricing_rule::{data['key']}",
                    "modified": row.get("modified"),
                    "data": data,
                }
            )
    return changes


@frappe.whitelist()
def sync_pricing_rules(
    pos_profile=None,
    watermark=None,
    offset=0,
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
    company = profile.get("company")
    if not company:
        frappe.throw("POS Profile company is required")

    resolved_limit = _coerce_int(limit, 200, minimum=1)
    resolved_sync_until = _resolve_sync_until(sync_until)
    if watermark:
        filters = {
            "modified": ["between", [watermark, resolved_sync_until]],
        }
    else:
        filters = {
            "company": company,
            "selling": 1,
            "disable": 0,
            "modified": ["<=", resolved_sync_until],
        }
    if start_after:
        filters["name"] = [">", start_after]

    rows = (
        frappe.get_all(
            "Pricing Rule",
            filters=filters,
            fields=_pricing_rule_fields(),
            order_by="name asc",
            limit_page_length=resolved_limit + 1,
        )
        or []
    )
    deleted_rows = _deleted_rules(
        watermark,
        start_after=start_after,
        limit=resolved_limit + 1,
        sync_until=resolved_sync_until,
    )
    rows_by_name = {row.get("name"): row for row in rows if row.get("name")}
    deleted_by_name = {
        str(row.get("key") or "").removeprefix("pricing_rule::"): row
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
    active_rows = [
        row
        for row in page_rows
        if row.get("company") == company
        and row.get("selling")
        and not row.get("disable")
    ]
    inactive_rows = [
        row
        for row in page_rows
        if row.get("name") and row not in active_rows
    ]
    deleted = [
        {"key": f"pricing_rule::{row.get('name')}"}
        for row in inactive_rows
    ] + [{"key": row["key"]} for row in deleted_rows]

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
        changes=_serialize_rows(active_rows),
        deleted=deleted,
        next_watermark=next_watermark,
        next_cursor=page_names[-1] if has_more and page_names else None,
        sync_until=resolved_sync_until,
        has_more=has_more,
    )
    return response
