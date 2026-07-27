import { describe, expect, it } from "vitest";
import { canEditRate, canEditItemDiscount } from "../src/posapp/composables/pos/items/useItemPermissions";

describe("Pass 6.9 — Cart Item Mobile Actions & Permissions", () => {
	it("allows rate edit when POS Profile enables rate edit and item is not locked", () => {
		const posProfile = { posa_allow_user_to_edit_rate: 1 };
		const item = { item_code: "ITEM-001", rate: 10 };
		expect(canEditRate(posProfile, item)).toBe(true);
	});

	it("prevents rate edit when POS Profile explicitly disables rate edit (0)", () => {
		const posProfile = { posa_allow_user_to_edit_rate: 0 };
		const item = { item_code: "ITEM-001", rate: 10 };
		expect(canEditRate(posProfile, item)).toBe(false);
	});

	it("preserves rate edit permission when posa_allow_user_to_edit_rate is undefined in legacy profile", () => {
		const posProfile = {};
		const item = { item_code: "ITEM-001", rate: 10 };
		expect(canEditRate(posProfile, item)).toBe(true);
	});
});
