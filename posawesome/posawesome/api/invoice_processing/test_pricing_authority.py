import importlib.util
import pathlib
import sys
import types
import unittest

from posawesome.posawesome.api.invoice_processing.test_creation import (
    AttrDict,
    FakeDoc,
    _install_framework_stubs,
    _install_package_stubs,
)


MODULE_NAME = "posawesome.posawesome.api.invoice_processing.pricing_authority"
MODULE_PATH = pathlib.Path(__file__).with_name("pricing_authority.py")


class PricingDocument(FakeDoc):
    def __init__(self, erp_price=100, **kwargs):
        super().__init__(**kwargs)
        self.erp_price = erp_price
        self.calculation_count = 0

    def apply_pricing_rule(self):
        for item in self.items:
            if not item.get("is_free_item"):
                item.price_list_rate = self.erp_price
                item.rate = self.erp_price
                item.discount_percentage = 0
                item.discount_amount = 0

    def append(self, fieldname, values):
        row = FakeDoc(**values)
        getattr(self, fieldname).append(row)
        return row

    def calculate_taxes_and_totals(self):
        self.calculation_count += 1


class TestAuthoritativePricing(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._orig_sys_modules = sys.modules.copy()
        cls.frappe, _ = _install_framework_stubs()
        _install_package_stubs()
        sys.modules.pop(MODULE_NAME, None)
        spec = importlib.util.spec_from_file_location(MODULE_NAME, MODULE_PATH)
        cls.pricing = importlib.util.module_from_spec(spec)
        sys.modules[MODULE_NAME] = cls.pricing
        spec.loader.exec_module(cls.pricing)

    @classmethod
    def tearDownClass(cls):
        sys.modules.clear()
        sys.modules.update(cls._orig_sys_modules)

    def setUp(self):
        self.profile = AttrDict(
            name="Main POS",
            posa_allow_user_to_edit_rate=0,
            posa_allow_user_to_edit_item_discount=0,
            posa_allow_zero_rated_items=0,
        )
        self.frappe.get_cached_value = lambda *args, **kwargs: None
        self.frappe.db.get_value = lambda *args, **kwargs: None
        self.frappe.get_list = lambda *args, **kwargs: []
        self.frappe.get_doc = lambda *args, **kwargs: None

    def _document(self, **overrides):
        values = {
            "doctype": "Sales Invoice",
            "company": "Test Company",
            "customer": "CUST-0001",
            "posting_date": "2026-03-21",
            "is_return": 0,
            "return_against": None,
            "set_warehouse": "Stores - TC",
            "items": [
                FakeDoc(
                    item_code="ITEM-1",
                    qty=1,
                    price_list_rate=5,
                    rate=5,
                    discount_percentage=0,
                    discount_amount=0,
                    conversion_factor=1,
                    is_free_item=0,
                )
            ],
            "flags": types.SimpleNamespace(ignore_pricing_rule=True),
            "total": 100,
            "posa_coupons": [],
        }
        values.update(overrides)
        return PricingDocument(**values)

    def _state(self, **overrides):
        values = {
            "snapshots": [
                self.pricing.PricingSnapshot(
                    item_code="ITEM-1",
                    row_id="1",
                    rate=5,
                    discount_percentage=0,
                    discount_amount=0,
                )
            ],
            "invoice_offer_claims": [],
            "free_rows": [],
            "active_offers": {},
        }
        values.update(overrides)
        return self.pricing.PricingState(**values)

    def test_client_rate_is_replaced_by_erp_price_when_manual_rate_is_disabled(self):
        invoice = self._document()
        state = self._state()

        self.pricing.prepare_invoice_pricing(invoice, self.profile, state)
        self.pricing.apply_authoritative_pricing(invoice, self.profile, state)

        self.assertEqual(invoice.items[0].rate, 100)
        self.assertEqual(invoice.items[0].price_list_rate, 100)
        self.assertFalse(invoice.flags.ignore_pricing_rule)

    def test_manual_rate_is_restored_only_when_profile_allows_it(self):
        invoice = self._document()
        state = self._state(
            snapshots=[
                self.pricing.PricingSnapshot(
                    item_code="ITEM-1",
                    row_id="1",
                    rate=80,
                    discount_percentage=0,
                    discount_amount=0,
                )
            ]
        )
        self.profile.posa_allow_user_to_edit_rate = 1

        self.pricing.prepare_invoice_pricing(invoice, self.profile, state)
        self.pricing.apply_authoritative_pricing(invoice, self.profile, state)

        self.assertEqual(invoice.items[0].price_list_rate, 100)
        self.assertEqual(invoice.items[0].rate, 80)

    def test_forged_offer_identifier_is_rejected(self):
        invoice = self._document()
        state = self._state(
            snapshots=[
                self.pricing.PricingSnapshot(
                    item_code="ITEM-1",
                    row_id="1",
                    rate=1,
                    discount_percentage=99,
                    discount_amount=99,
                    offer_ids=["FORGED-OFFER"],
                    offer_applied=True,
                )
            ]
        )

        with self.assertRaisesRegex(Exception, "invalid or no longer active"):
            self.pricing.apply_authoritative_pricing(invoice, self.profile, state)

    def test_verified_item_offer_is_recomputed_server_side(self):
        invoice = self._document()
        offer = {
            "row_id": "OFFER-10",
            "name": "OFFER-10",
            "offer": "Item Price",
            "apply_on": "Item Code",
            "item": "ITEM-1",
            "discount_type": "Discount Percentage",
            "discount_percentage": 10,
        }
        state = self._state(
            snapshots=[
                self.pricing.PricingSnapshot(
                    item_code="ITEM-1",
                    row_id="1",
                    rate=1,
                    discount_percentage=99,
                    discount_amount=99,
                    offer_ids=["OFFER-10"],
                    offer_applied=True,
                )
            ],
            active_offers={"OFFER-10": offer},
        )

        self.pricing.apply_authoritative_pricing(invoice, self.profile, state)

        self.assertEqual(invoice.items[0].rate, 90)
        self.assertEqual(invoice.items[0].discount_percentage, 10)

    def test_unverified_client_free_item_is_rejected(self):
        invoice = self._document()
        state = self._state(free_rows=[{"item_code": "FREE-1", "is_free_item": 1}])

        with self.assertRaisesRegex(Exception, "not backed by an active POS offer"):
            self.pricing.apply_authoritative_pricing(invoice, self.profile, state)

    def test_return_uses_original_invoice_row_price(self):
        original = FakeDoc(
            doctype="Sales Invoice",
            name="SINV-ORIGINAL",
            company="Test Company",
            customer="CUST-0001",
            items=[
                FakeDoc(
                    name="ORIGINAL-ROW-1",
                    item_code="ITEM-1",
                    rate=75,
                    price_list_rate=100,
                    discount_percentage=25,
                    discount_amount=25,
                )
            ],
        )
        self.frappe.get_doc = lambda *_args, **_kwargs: original
        invoice = self._document(is_return=1, return_against="SINV-ORIGINAL")
        state = self._state(
            snapshots=[
                self.pricing.PricingSnapshot(
                    item_code="ITEM-1",
                    row_id="ORIGINAL-ROW-1",
                    rate=0,
                    discount_percentage=0,
                    discount_amount=0,
                    locked_price=True,
                )
            ]
        )

        self.pricing.apply_authoritative_pricing(invoice, self.profile, state)

        self.assertEqual(invoice.items[0].rate, 75)
        self.assertEqual(invoice.items[0].discount_percentage, 25)

    def test_capture_prefers_erp_return_row_reference_over_ui_row_id(self):
        state = self.pricing.capture_pricing_state(
            {
                "items": [
                    {
                        "item_code": "ITEM-1",
                        "sales_invoice_item": "ORIGINAL-ROW-1",
                        "posa_row_id": "RANDOM-UI-ID",
                    }
                ]
            },
            self.profile,
        )

        self.assertEqual(state.snapshots[0].row_id, "ORIGINAL-ROW-1")


if __name__ == "__main__":
    unittest.main()
