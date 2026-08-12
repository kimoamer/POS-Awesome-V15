import importlib.util
import pathlib
import sys
import types
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(
    0,
    str(REPO_ROOT / "posawesome" / "posawesome" / "api" / "test_support"),
)

from offline_sync_harness import (
    install_offline_sync_package_stubs,
    load_offline_sync_common,
)


class AttrDict(dict):
    __getattr__ = dict.get

    def as_dict(self):
        return dict(self)


RULE_ROWS = [
    AttrDict(
        {
            "name": "RULE-GROUP",
            "company": "Test Co",
            "selling": 1,
            "disable": 0,
            "apply_on": "Item Group",
            "customer": None,
            "customer_group": "Retail",
            "modified": "2026-06-01T11:00:00",
        }
    ),
    AttrDict(
        {
            "name": "RULE-CUSTOMER",
            "company": "Test Co",
            "selling": 1,
            "disable": 0,
            "apply_on": "Item Code",
            "customer": "CUST-001",
            "customer_group": None,
            "modified": "2026-06-01T11:01:00",
        }
    ),
    AttrDict(
        {
            "name": "RULE-DISABLED",
            "company": "Test Co",
            "selling": 1,
            "disable": 1,
            "apply_on": "Item Code",
            "modified": "2026-06-01T11:02:00",
        }
    ),
]


def _install_stubs():
    install_offline_sync_package_stubs()

    frappe_module = types.ModuleType("frappe")
    frappe_module._ = lambda text: text
    frappe_module.throw = lambda message: (_ for _ in ()).throw(Exception(message))
    frappe_module.whitelist = lambda *args, **kwargs: (lambda fn: fn)
    frappe_module.get_cached_doc = lambda doctype, name: AttrDict(
        {"name": name, "company": "Test Co"}
    )

    def fake_get_all(doctype, **kwargs):
        if doctype == "Pricing Rule":
            filters = kwargs.get("filters") or {}
            rows = list(RULE_ROWS)
            if filters.get("company"):
                rows = [row for row in rows if row["company"] == filters["company"]]
            if filters.get("selling") is not None:
                rows = [row for row in rows if row["selling"] == filters["selling"]]
            if filters.get("disable") is not None:
                rows = [row for row in rows if row["disable"] == filters["disable"]]
            modified_filter = filters.get("modified")
            if modified_filter:
                if modified_filter[0] == "between":
                    rows = [
                        row
                        for row in rows
                        if modified_filter[1][0]
                        <= row["modified"]
                        <= modified_filter[1][1]
                    ]
                elif modified_filter[0] == "<=":
                    rows = [
                        row
                        for row in rows
                        if row["modified"] <= modified_filter[1]
                    ]
                else:
                    rows = [
                        row
                        for row in rows
                        if row["modified"] > modified_filter[1]
                    ]
            name_filter = filters.get("name")
            if name_filter:
                rows = [row for row in rows if row["name"] > name_filter[1]]
            rows.sort(key=lambda row: row["name"])
            limit = kwargs.get("limit_page_length") or len(rows)
            return rows[:limit]
        if doctype == "Deleted Document":
            filters = kwargs.get("filters") or {}
            rows = [
                AttrDict(
                    {
                        "deleted_name": "RULE-DELETED",
                        "creation": "2026-06-01T11:03:00",
                    }
                )
            ]
            name_filter = filters.get("deleted_name")
            if name_filter:
                rows = [
                    row
                    for row in rows
                    if row["deleted_name"] > name_filter[1]
                ]
            return rows[: kwargs.get("limit_page_length") or len(rows)]
        return []

    frappe_module.get_all = fake_get_all
    sys.modules["frappe"] = frappe_module

    pricing_module = types.ModuleType("posawesome.posawesome.api.pricing_rules")
    pricing_module._normalise_rule = lambda row: AttrDict(
        {
            "name": row["name"],
            "company": row["company"],
            "apply_on": row["apply_on"],
            "customer": row.get("customer"),
            "customer_group": row.get("customer_group"),
        }
    )
    pricing_module._get_targets_map = lambda names: {
        "item_code": {"RULE-CUSTOMER": ["ITEM-001"]},
        "item_group": {"RULE-GROUP": ["Products"]},
        "brand": {},
    }

    def serialize_rule(base, target_field, targets):
        if not target_field or not targets:
            return [base]
        return [AttrDict({**base, target_field: target}) for target in targets]

    pricing_module._serialize_rule = serialize_rule
    sys.modules["posawesome.posawesome.api.pricing_rules"] = pricing_module

    api_utils_module = types.ModuleType("posawesome.posawesome.api.utils")
    api_utils_module.get_active_pos_profile = lambda user=None: {
        "name": "POS-TEST",
        "company": "Test Co",
    }
    sys.modules["posawesome.posawesome.api.utils"] = api_utils_module
    sys.modules["posawesome.posawesome.api.offline_sync.common"] = load_offline_sync_common()


def _load_module():
    module_name = "test_offline_sync_pricing_rules_target"
    file_path = REPO_ROOT / "posawesome" / "posawesome" / "api" / "offline_sync" / "pricing_rules.py"
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


class TestOfflineSyncPricingRules(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._orig_sys_modules = sys.modules.copy()
        _install_stubs()
        cls.module = _load_module()

    @classmethod
    def tearDownClass(cls):
        sys.modules.clear()
        sys.modules.update(cls._orig_sys_modules)

    def test_syncs_customer_and_group_rules_without_current_customer_filtering(self):
        response = self.module.sync_pricing_rules(
            pos_profile="POS-TEST",
            watermark=None,
            limit=10,
        )

        self.assertEqual(
            [row["data"]["name"] for row in response["changes"]],
            ["RULE-CUSTOMER", "RULE-GROUP"],
        )
        self.assertEqual(response["changes"][0]["data"]["item_code"], "ITEM-001")
        self.assertEqual(response["changes"][0]["data"]["customer"], "CUST-001")
        self.assertEqual(response["changes"][1]["data"]["item_group"], "Products")
        self.assertEqual(response["deleted"], [])

    def test_returns_parent_rule_name_for_atomic_target_replacement(self):
        response = self.module.sync_pricing_rules(
            pos_profile="POS-TEST",
            watermark="2026-05-31T00:00:00",
            sync_until="2026-06-01T11:03:00",
            limit=10,
        )

        group_change = response["changes"][1]
        self.assertEqual(group_change["data"]["rule_name"], "RULE-GROUP")
        self.assertEqual(group_change["data"]["target_type"], "item_group")
        self.assertEqual(group_change["data"]["target_value"], "Products")
        self.assertEqual(group_change["modified"], "2026-06-01T11:00:00")
        self.assertEqual(
            response["deleted"],
            [
                {"key": "pricing_rule::RULE-DISABLED"},
                {"key": "pricing_rule::RULE-DELETED"},
            ],
        )
        self.assertEqual(response["next_watermark"], "2026-06-01T11:03:00")

    def test_paginates_rules_by_name_with_one_snapshot_boundary(self):
        first = self.module.sync_pricing_rules(
            pos_profile="POS-TEST",
            watermark=None,
            sync_until="2026-06-01T11:05:00",
            limit=1,
        )
        second = self.module.sync_pricing_rules(
            pos_profile="POS-TEST",
            watermark=None,
            start_after=first["next_cursor"],
            sync_until=first["sync_until"],
            limit=1,
        )

        self.assertTrue(first["has_more"])
        self.assertEqual(first["next_cursor"], "RULE-CUSTOMER")
        self.assertFalse(second["has_more"])
        self.assertEqual(second["next_watermark"], "2026-06-01T11:05:00")


if __name__ == "__main__":
    unittest.main()
