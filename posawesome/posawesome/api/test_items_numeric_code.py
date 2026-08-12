import json
from unittest.mock import patch

import frappe
from frappe.tests.utils import FrappeTestCase

from posawesome.posawesome.api.items import get_items


class TestNumericItemCodes(FrappeTestCase):
    def setUp(self):
        super().setUp()
        profile = {"name": "TestProfile"}
        resolver = patch(
            "posawesome.posawesome.api.item_processing.search._ensure_pos_profile",
            return_value=(profile, json.dumps(profile)),
        )
        resolver.start()
        self.addCleanup(resolver.stop)
        def fake_details(_profile, items_json, **_kwargs):
            return [
                {
                    "item_code": row["item_code"],
                    "item_barcode": (
                        [{"barcode": "123456789"}]
                        if row["item_code"] == "TEST-ITEM-123"
                        else []
                    ),
                }
                for row in json.loads(items_json)
            ]

        details = patch(
            "posawesome.posawesome.api.item_processing.search.get_items_details",
            side_effect=fake_details,
        )
        details.start()
        self.addCleanup(details.stop)
        items = [
            ("ALPHA-TEST", "Alpha"),
            ("BETA-TEST", "Beta"),
            ("002", "Gamma"),
        ]
        for code, name in items:
            if frappe.db.exists("Item", code):
                item = frappe.get_doc("Item", code)
                item.item_name = name
                item.is_sales_item = 1
                item.is_fixed_asset = 0
                item.save(ignore_permissions=True)
            else:
                frappe.get_doc(
                    {
                        "doctype": "Item",
                        "item_code": code,
                        "item_name": name,
                        "stock_uom": "Nos",
                        "is_stock_item": 0,
                        "item_group": "All Item Groups",
                        "is_sales_item": 1,
                        "is_fixed_asset": 0,
                    }
                ).insert(ignore_permissions=True, ignore_mandatory=True)

    def test_numeric_code_appears_without_search(self):
        pos_profile = json.dumps({"name": "TestProfile"})
        codes = []
        cursor = None
        for _page in range(50):
            rows = get_items(pos_profile, limit=50, start_after=cursor)
            if not rows:
                break
            codes.extend(row["item_code"] for row in rows)
            if "002" in codes or len(rows) < 50:
                break
            cursor = rows[-1]["item_name"]
        self.assertIn("002", codes)

    def test_item_search_with_whitespace(self):
        # Create an item with a barcode
        item_code = "TEST-ITEM-123"
        barcode = "123456789"

        if not frappe.db.exists("Item", item_code):
            frappe.get_doc(
                {
                    "doctype": "Item",
                    "item_code": item_code,
                    "item_name": "Test Item Whitespace",
                    "stock_uom": "Nos",
                    "item_group": "All Item Groups",
                    "is_sales_item": 1,
                    "barcodes": [{"barcode": barcode}],
                }
            ).insert(ignore_permissions=True)

        pos_profile = json.dumps({"name": "TestProfile"})

        # Search with leading/trailing whitespace
        items = get_items(pos_profile, search_value=f"  {barcode}  ")

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["item_code"], item_code)
