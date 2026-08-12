import importlib.util
import pathlib
import sys
import types
import unittest


REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]


class TestPrintFormatLookup(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original_modules = sys.modules.copy()
        cls.permission_checks = []
        cls.get_all_calls = []

        frappe_module = types.ModuleType("frappe")
        frappe_module.whitelist = lambda *args, **kwargs: (lambda fn: fn)
        frappe_module.throw = lambda message: (_ for _ in ()).throw(Exception(message))

        def get_all(doctype, **kwargs):
            cls.get_all_calls.append((doctype, kwargs))
            return [types.SimpleNamespace(name="Compact Receipt")]

        frappe_module.get_all = get_all
        sys.modules["frappe"] = frappe_module

        utils_module = types.ModuleType("posawesome.posawesome.api.utils")
        utils_module.assert_doctype_permission = (
            lambda doctype, permission: cls.permission_checks.append((doctype, permission))
        )
        sys.modules["posawesome.posawesome.api.utils"] = utils_module

        module_path = REPO_ROOT / "posawesome" / "posawesome" / "api" / "print_formats.py"
        spec = importlib.util.spec_from_file_location("print_formats_under_test", module_path)
        cls.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.module)

    @classmethod
    def tearDownClass(cls):
        sys.modules.clear()
        sys.modules.update(cls.original_modules)

    def setUp(self):
        self.permission_checks.clear()
        self.get_all_calls.clear()

    def test_cashier_only_needs_print_permission_on_transaction(self):
        result = self.module.get_print_formats("Purchase Order")

        self.assertEqual(result, ["Compact Receipt"])
        self.assertEqual(self.permission_checks, [("Purchase Order", "print")])
        self.assertEqual(self.get_all_calls[0][0], "Print Format")
        self.assertEqual(
            self.get_all_calls[0][1]["filters"],
            {"doc_type": "Purchase Order", "disabled": 0},
        )

    def test_unsupported_doctype_is_rejected_before_query(self):
        with self.assertRaisesRegex(Exception, "Unsupported print document type"):
            self.module.get_print_formats("User")

        self.assertEqual(self.permission_checks, [])
        self.assertEqual(self.get_all_calls, [])


if __name__ == "__main__":
    unittest.main()
