import { describe, expect, it } from "vitest";
import { canRemoveItem, canToggleOffer, getItemUiCapabilities } from "../src/posapp/composables/pos/items/useItemPermissions";

describe("CartItemRow actions & permission capability contracts", () => {
	const sampleItem = {
		item_code: "ITEM-001",
		item_name: "Test Product",
		qty: 2,
		rate: 50,
		amount: 100,
	};

	const offerItem = {
		item_code: "FREE-001",
		item_name: "Free Gift",
		qty: 1,
		rate: 0,
		amount: 0,
		posa_is_offer: 1,
	};

	const replaceItem = {
		item_code: "REP-001",
		item_name: "Replacement Part",
		qty: 1,
		rate: 20,
		amount: 20,
		posa_is_replace: 1,
	};

	it("evaluates remove item permissions correctly", () => {
		expect(canRemoveItem(sampleItem)).toBe(true);
		expect(canRemoveItem(offerItem)).toBe(false);
		expect(canRemoveItem(replaceItem)).toBe(false);
	});

	it("evaluates offer toggle permissions correctly", () => {
		expect(canToggleOffer(sampleItem, false)).toBe(true);
		expect(canToggleOffer(sampleItem, true)).toBe(false); // Return invoice disables offer
		expect(canToggleOffer(offerItem, false)).toBe(false);
		expect(canToggleOffer(replaceItem, false)).toBe(false);
	});

	it("returns item UI capability matrix including toggleOffer", () => {
		const capabilities = getItemUiCapabilities({}, sampleItem);
		expect(capabilities.removeItem).toBe(true);
		expect(capabilities.toggleOffer).toBe(true);

		const offerCapabilities = getItemUiCapabilities({}, offerItem);
		expect(offerCapabilities.removeItem).toBe(false);
		expect(offerCapabilities.toggleOffer).toBe(false);
	});
});
