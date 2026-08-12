import { describe, expect, it } from "vitest";

import {
	getItemUiCapabilities,
	isLockedPromotionLine,
	parseBooleanSetting,
} from "../src/posapp/composables/pos/items/useItemPermissions";

describe("useItemPermissions composable", () => {
	const defaultProfile = {
		posa_allow_user_to_edit_rate: 1,
		posa_allow_user_to_edit_item_discount: 1,
		posa_allow_price_list_rate_change: 1,
		posa_allow_line_item_name_override: 1,
		posa_display_additional_notes: 1,
		posa_allow_sales_order: 1,
	};

	const normalItem = {
		item_code: "ITEM-001",
		rate: 100,
		qty: 1,
	};

	describe("parseBooleanSetting", () => {
		it("normalizes boolean values", () => {
			expect(parseBooleanSetting(true)).toBe(true);
			expect(parseBooleanSetting(false)).toBe(false);
		});

		it("normalizes number values", () => {
			expect(parseBooleanSetting(1)).toBe(true);
			expect(parseBooleanSetting(0)).toBe(false);
		});

		it("normalizes string values ('0', '1', 'false', 'true')", () => {
			expect(parseBooleanSetting("1")).toBe(true);
			expect(parseBooleanSetting("0")).toBe(false);
			expect(parseBooleanSetting("true")).toBe(true);
			expect(parseBooleanSetting("false")).toBe(false);
			expect(parseBooleanSetting(" 0 ")).toBe(false);
		});

		it("handles undefined and null safely", () => {
			expect(parseBooleanSetting(undefined)).toBe(false);
			expect(parseBooleanSetting(null)).toBe(false);
		});
	});

	describe("isLockedPromotionLine", () => {
		it("returns false for regular item", () => {
			expect(isLockedPromotionLine(normalItem)).toBe(false);
		});

		it("returns true for offer, replacement, or free item", () => {
			expect(isLockedPromotionLine({ posa_is_offer: 1 })).toBe(true);
			expect(isLockedPromotionLine({ posa_is_replace: 1 })).toBe(true);
			expect(isLockedPromotionLine({ is_free_item: 1 })).toBe(true);
		});
	});

	describe("getItemUiCapabilities matrix", () => {
		it("returns full permissions for normal item when profile allows", () => {
			const caps = getItemUiCapabilities(defaultProfile, normalItem, {
				invoiceType: "Order",
			});
			expect(caps.editQty).toBe(true);
			expect(caps.editRate).toBe(true);
			expect(caps.editDiscount).toBe(true);
			expect(caps.changeUom).toBe(true);
			expect(caps.changePriceListRate).toBe(true);
			expect(caps.overrideItemName).toBe(true);
			expect(caps.removeItem).toBe(true);
			expect(caps.showAdditionalNotes).toBe(true);
			expect(caps.showDeliveryDate).toBe(true);
		});

		it("hides delivery date on regular Sales Invoice", () => {
			const caps = getItemUiCapabilities(defaultProfile, normalItem, {
				invoiceType: "Sales Invoice",
			});
			expect(caps.showDeliveryDate).toBe(false);
		});

		it("locks editing on offer, replacement, free, or return items", () => {
			const offerCaps = getItemUiCapabilities(defaultProfile, { posa_is_offer: 1 });
			expect(offerCaps.editQty).toBe(false);
			expect(offerCaps.editRate).toBe(false);
			expect(offerCaps.editDiscount).toBe(false);
			expect(offerCaps.changeUom).toBe(false);
			expect(offerCaps.removeItem).toBe(false);

			const returnCaps = getItemUiCapabilities(defaultProfile, normalItem, { isReturnInvoice: true });
			expect(returnCaps.editRate).toBe(false);
			expect(returnCaps.editDiscount).toBe(false);
			expect(returnCaps.changeUom).toBe(false);
		});
	});
});
