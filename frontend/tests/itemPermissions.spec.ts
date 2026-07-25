import { describe, expect, it } from "vitest";

import {
	canChangePriceListRate,
	canChangeUom,
	canEditItemDiscount,
	canEditQty,
	canEditRate,
	canOverrideItemName,
	canRemoveItem,
	isLockedPromotionLine,
	isPricingLocked,
} from "../src/posapp/composables/pos/items/useItemPermissions";

describe("useItemPermissions composable", () => {
	const defaultProfile = {
		posa_allow_user_to_edit_rate: 1,
		posa_allow_user_to_edit_item_discount: 1,
		posa_allow_price_list_rate_change: 1,
		posa_allow_line_item_name_override: 1,
	};

	const restrictedProfile = {
		posa_allow_user_to_edit_rate: 0,
		posa_allow_user_to_edit_item_discount: 0,
		posa_allow_price_list_rate_change: 0,
		posa_allow_line_item_name_override: 0,
	};

	const normalItem = {
		item_code: "ITEM-001",
		rate: 100,
		qty: 1,
	};

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

	describe("isPricingLocked", () => {
		it("returns false for regular item on normal invoice", () => {
			expect(isPricingLocked(normalItem, false)).toBe(false);
		});

		it("returns true on return invoice or offer applied line", () => {
			expect(isPricingLocked(normalItem, true)).toBe(true);
			expect(isPricingLocked({ posa_offer_applied: 1 }, false)).toBe(true);
			expect(isPricingLocked({ posa_is_offer: 1 }, false)).toBe(true);
		});
	});

	describe("canEditRate", () => {
		it("allows rate editing for regular item when profile allows", () => {
			expect(canEditRate(defaultProfile, normalItem, false)).toBe(true);
		});

		it("disallows rate editing when profile prohibits", () => {
			expect(canEditRate(restrictedProfile, normalItem, false)).toBe(false);
		});

		it("disallows rate editing for offer, replacement, offer_applied, or return lines", () => {
			expect(canEditRate(defaultProfile, { posa_is_offer: 1 }, false)).toBe(false);
			expect(canEditRate(defaultProfile, { posa_is_replace: 1 }, false)).toBe(false);
			expect(canEditRate(defaultProfile, { posa_offer_applied: 1 }, false)).toBe(false);
			expect(canEditRate(defaultProfile, normalItem, true)).toBe(false);
		});
	});

	describe("canEditItemDiscount", () => {
		it("allows discount editing for regular item when profile allows", () => {
			expect(canEditItemDiscount(defaultProfile, normalItem, false)).toBe(true);
		});

		it("disallows discount editing when profile prohibits", () => {
			expect(canEditItemDiscount(restrictedProfile, normalItem, false)).toBe(false);
		});

		it("disallows discount editing for offer, replacement, offer_applied, or return lines", () => {
			expect(canEditItemDiscount(defaultProfile, { posa_is_offer: 1 }, false)).toBe(false);
			expect(canEditItemDiscount(defaultProfile, { posa_is_replace: 1 }, false)).toBe(false);
			expect(canEditItemDiscount(defaultProfile, { posa_offer_applied: 1 }, false)).toBe(false);
			expect(canEditItemDiscount(defaultProfile, normalItem, true)).toBe(false);
		});
	});

	describe("canChangePriceListRate", () => {
		it("allows changing price list rate when profile allows and line is unlocked", () => {
			expect(canChangePriceListRate(defaultProfile, normalItem, false)).toBe(true);
		});

		it("disallows changing price list rate when profile prohibits or pricing is locked", () => {
			expect(canChangePriceListRate(restrictedProfile, normalItem, false)).toBe(false);
			expect(canChangePriceListRate(defaultProfile, { posa_is_offer: 1 }, false)).toBe(false);
		});
	});

	describe("canOverrideItemName", () => {
		it("allows name override when profile allows and item is not replacement", () => {
			expect(canOverrideItemName(defaultProfile, normalItem)).toBe(true);
		});

		it("disallows name override when profile prohibits or item is replacement", () => {
			expect(canOverrideItemName(restrictedProfile, normalItem)).toBe(false);
			expect(canOverrideItemName(defaultProfile, { posa_is_replace: 1 })).toBe(false);
		});
	});

	describe("canEditQty & canChangeUom & canRemoveItem", () => {
		it("allows Qty, UOM, and Remove on normal items", () => {
			expect(canEditQty(normalItem, false)).toBe(true);
			expect(canChangeUom(normalItem, false)).toBe(true);
			expect(canRemoveItem(normalItem)).toBe(true);
		});

		it("locks Qty, UOM, and Remove on locked promotional or return lines", () => {
			const offerLine = { posa_is_offer: 1 };
			expect(canEditQty(offerLine, false)).toBe(false);
			expect(canChangeUom(offerLine, false)).toBe(false);
			expect(canRemoveItem(offerLine)).toBe(false);

			expect(canChangeUom(normalItem, true)).toBe(false);
		});
	});
});
