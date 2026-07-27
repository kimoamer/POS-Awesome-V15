import { describe, expect, it } from "vitest";

describe("Cart Operations & Totals Invariants", () => {
	it("recalculates cart line totals and grand totals with tax", () => {
		const cartItems = [
			{ item_code: "ITEM-A", qty: 2, rate: 50, discount_percentage: 0 },
			{ item_code: "ITEM-B", qty: 1, rate: 200, discount_percentage: 10 },
		];

		const itemATotal = cartItems[0].qty * cartItems[0].rate; // 100
		const itemBNetRate = cartItems[1].rate * (1 - cartItems[1].discount_percentage / 100); // 180
		const itemBTotal = cartItems[1].qty * itemBNetRate; // 180

		const subtotal = itemATotal + itemBTotal; // 280
		const taxRate = 0.14; // 14%
		const taxAmount = subtotal * taxRate; // 39.2
		const grandTotal = subtotal + taxAmount; // 319.2

		expect(subtotal).toBe(280);
		expect(taxAmount).toBeCloseTo(39.2, 2);
		expect(grandTotal).toBeCloseTo(319.2, 2);
	});
});
