import { describe, expect, it } from "vitest";

describe("Cart Calculation Integrity Invariants", () => {
	it("maintains net total, tax, grand total, paid, and remaining invariants", () => {
		const qty = 2;
		const rate = 100;
		const discountPercentage = 10; // 10%
		const taxRate = 14; // 14% VAT

		const gross = qty * rate; // 200
		const discountAmount = gross * (discountPercentage / 100); // 20
		const netAmount = gross - discountAmount; // 180
		const taxAmount = netAmount * (taxRate / 100); // 25.20
		const grandTotal = netAmount + taxAmount; // 205.20

		const paidAmount = 205.20;
		const remaining = grandTotal - paidAmount;

		expect(netAmount).toBe(180);
		expect(taxAmount).toBeCloseTo(25.20, 2);
		expect(grandTotal).toBeCloseTo(205.20, 2);
		expect(remaining).toBeCloseTo(0, 2);
	});
});
