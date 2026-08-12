import importlib.util
import json
import pathlib
import sys
import types
import unittest
from types import SimpleNamespace


REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
CUSTOMERS_API_PATH = REPO_ROOT / "posawesome" / "posawesome" / "api" / "customers.py"


class AttrDict(dict):
    __getattr__ = dict.get


def _install_stubs():
    frappe_module = types.ModuleType("frappe")
    frappe_utils_module = types.ModuleType("frappe.utils")
    frappe_caching_module = types.ModuleType("frappe.utils.caching")
    erpnext_loyalty_module = types.ModuleType(
        "erpnext.accounts.doctype.loyalty_program.loyalty_program"
    )
    api_utils_module = types.ModuleType("posawesome.posawesome.api.utils")
    stored_value_module = types.ModuleType("posawesome.posawesome.api.stored_value")

    state = {
        "loyalty_detail_calls": 0,
        "get_all_calls": [],
        "stored_value_calls": 0,
    }

    def get_all(doctype, **kwargs):
        state["get_all_calls"].append((doctype, kwargs))
        if doctype == "Customer":
            return [
                AttrDict(
                    {
                        "name": "CUST-001",
                        "modified": "2026-05-21 10:00:00",
                        "customer_name": "Alpha Customer",
                        "loyalty_program": "Retail Loyalty",
                        "default_price_list": "Standard Selling",
                    }
                )
            ]
        return []

    def get_loyalty_program_details_with_points(*args, **kwargs):
        state["loyalty_detail_calls"] += 1
        raise AssertionError("Bulk customer sync must not fetch loyalty point balances")

    frappe_module._ = lambda text: text
    frappe_module.whitelist = lambda *args, **kwargs: (lambda fn: fn)
    frappe_module.throw = lambda message: (_ for _ in ()).throw(Exception(message))
    frappe_module.get_all = get_all
    frappe_module.get_list = get_all
    frappe_module.get_doc = lambda doctype, name: AttrDict(
        {
            "doctype": doctype,
            "name": name,
            "customer_name": "Alpha Customer",
            "disabled": 0,
            "customer_group": "Individual",
            "loyalty_program": None,
            "default_price_list": "Standard Selling",
            "email_id": "alpha@example.com",
            "mobile_no": "123",
        }
    )
    frappe_module.get_value = lambda *args, **kwargs: None
    frappe_module.db = SimpleNamespace(
        get_value=lambda *args, **kwargs: None,
        count=lambda *args, **kwargs: 0,
        escape=lambda value: f"'{value}'",
        sql=lambda *args, **kwargs: [],
    )

    frappe_utils_module.nowdate = lambda: "2026-05-21"
    frappe_utils_module.flt = lambda value=0, precision=None: float(value or 0)
    frappe_utils_module.cstr = lambda value="": "" if value is None else str(value)
    frappe_utils_module.get_datetime = lambda value: value
    frappe_caching_module.redis_cache = lambda ttl=None: (lambda fn: fn)
    erpnext_loyalty_module.get_loyalty_program_details_with_points = (
        get_loyalty_program_details_with_points
    )
    api_utils_module.assert_doctype_permission = lambda *args, **kwargs: True
    api_utils_module.assert_document_permission = lambda *args, **kwargs: True
    api_utils_module.get_pos_request_context = lambda profile, **kwargs: SimpleNamespace(
        pos_profile=AttrDict(
            json.loads(profile) if isinstance(profile, str) else (profile or {})
        ),
        profile_name="POS-TEST",
        company=kwargs.get("company") or "Test Company",
        opening_shift=SimpleNamespace(name="SHIFT-001"),
    )
    api_utils_module.fetch_sales_person_names = lambda *args, **kwargs: []
    def get_stored_value_summary(*args, **kwargs):
        state["stored_value_calls"] += 1
        return {"available_amount": 75, "source_count": 2}

    stored_value_module.get_stored_value_summary = get_stored_value_summary

    sys.modules["frappe"] = frappe_module
    sys.modules["frappe.utils"] = frappe_utils_module
    sys.modules["frappe.utils.caching"] = frappe_caching_module
    sys.modules[
        "erpnext.accounts.doctype.loyalty_program.loyalty_program"
    ] = erpnext_loyalty_module
    sys.modules["posawesome.posawesome.api.utils"] = api_utils_module
    sys.modules["posawesome.posawesome.api.stored_value"] = stored_value_module

    return state


def _load_module():
    module_name = "posawesome.posawesome.api.customers"
    spec = importlib.util.spec_from_file_location(module_name, CUSTOMERS_API_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


class TestCustomersApi(unittest.TestCase):
    def setUp(self):
        self._orig_sys_modules = sys.modules.copy()
        self.state = _install_stubs()
        self.module = _load_module()

    def tearDown(self):
        sys.modules.clear()
        sys.modules.update(self._orig_sys_modules)

    def test_customer_list_does_not_fetch_loyalty_balances_per_customer(self):
        rows = self.module.get_customer_names(
            json.dumps({"name": "POS-TEST"}),
            limit=1000,
        )

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["name"], "CUST-001")
        self.assertEqual(rows[0]["loyalty_program"], "Retail Loyalty")
        self.assertNotIn("loyalty_points", rows[0])
        self.assertNotIn("conversion_factor", rows[0])
        self.assertEqual(self.state["loyalty_detail_calls"], 0)

    def test_customer_search_is_applied_server_side(self):
        self.module.get_customer_names(
            json.dumps({"name": "POS-TEST"}),
            limit=20,
            search_text="Alpha",
        )

        _doctype, kwargs = self.state["get_all_calls"][-1]
        self.assertIn(
            ["Customer", "customer_name", "like", "%Alpha%"],
            kwargs["or_filters"],
        )

    def test_customer_info_skips_credit_when_profile_disables_it(self):
        result = self.module.get_customer_info(
            customer="CUST-001",
            company="Test Company",
            pos_profile={"name": "POS-TEST", "use_customer_credit": 0},
            pos_opening_shift="SHIFT-001",
        )

        self.assertEqual(result["name"], "CUST-001")
        self.assertEqual(result["stored_value_balance"], 0)
        self.assertEqual(result["stored_value_sources"], 0)
        self.assertEqual(self.state["stored_value_calls"], 0)

    def test_customer_info_fetches_credit_when_profile_enables_it(self):
        result = self.module.get_customer_info(
            customer="CUST-001",
            company="Test Company",
            pos_profile={"name": "POS-TEST", "use_customer_credit": 1},
            pos_opening_shift="SHIFT-001",
        )

        self.assertEqual(result["stored_value_balance"], 75)
        self.assertEqual(result["stored_value_sources"], 2)
        self.assertEqual(self.state["stored_value_calls"], 1)


if __name__ == "__main__":
    unittest.main()
