import { describe, expect, it } from "vitest";

import { canEditRate } from "../src/posapp/composables/pos/items/useItemPermissions";

describe("InvoiceItemCard rate inline editing permission contract", () => {
	const allowedProfile = {
		posa_allow_user_to_edit_rate: 1,
		posa_allow_user_to_edit_item_discount: 1,
		posa_allow_price_list_rate_change: 1,
		posa_allow_line_item_name_override: 1,
	};

	const stringAllowedProfile = {
		posa_allow_user_to_edit_rate: "1",
	};

	const disabledProfile = {
		posa_allow_user_to_edit_rate: 0,
	};

	const stringDisabledProfile = {
		posa_allow_user_to_edit_rate: "0",
	};

	const normalItem = {
		item_code: "ITEM-001",
		rate: 50,
		qty: 2,
		amount: 100,
	};

	it("allows rate edit on normal item when profile permits (number 1 or string '1')", () => {
		expect(canEditRate(allowedProfile, normalItem, false)).toBe(true);
		expect(canEditRate(stringAllowedProfile, normalItem, false)).toBe(true);
	});

	it("disallows rate edit when profile disables permission (0 or '0')", () => {
		expect(canEditRate(disabledProfile, normalItem, false)).toBe(false);
		expect(canEditRate(stringDisabledProfile, normalItem, false)).toBe(false);
	});

	it("disallows rate edit on offer items even if profile permits", () => {
		const offerItem = { ...normalItem, posa_is_offer: 1 };
		expect(canEditRate(allowedProfile, offerItem, false)).toBe(false);
	});

	it("disallows rate edit on replacement items even if profile permits", () => {
		const replaceItem = { ...normalItem, posa_is_replace: 1 };
		expect(canEditRate(allowedProfile, replaceItem, false)).toBe(false);
	});

	it("disallows rate edit on free items even if profile permits", () => {
		const freeItem = { ...normalItem, is_free_item: 1 };
		expect(canEditRate(allowedProfile, freeItem, false)).toBe(false);
	});

	it("disallows rate edit on offer-applied lines even if profile permits", () => {
		const offerAppliedItem = { ...normalItem, posa_offer_applied: 1 };
		expect(canEditRate(allowedProfile, offerAppliedItem, false)).toBe(false);
	});

	it("disallows rate edit on return invoice items even if profile permits", () => {
		expect(canEditRate(allowedProfile, normalItem, true)).toBe(false);
	});

	it("validates rate numeric input logic (finite, non-negative, changed)", () => {
		function validateRate(currentRate: number, rawInput: string): number | null {
			const trimmed = rawInput.trim();
			if (trimmed === "") return null;
			const newRate = Number(trimmed);
			if (Number.isFinite(newRate) && newRate >= 0 && newRate !== currentRate) {
				return newRate;
			}
			return null;
		}

		expect(validateRate(50, "75")).toBe(75);
		expect(validateRate(50, "50")).toBe(null); // unchanged
		expect(validateRate(50, "-10")).toBe(null); // negative
		expect(validateRate(50, "abc")).toBe(null); // NaN
		expect(validateRate(50, "")).toBe(null); // empty
	});
});
