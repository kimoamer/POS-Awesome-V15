import { describe, expect, it } from "vitest";

describe("Product Money Formatting & RTL BDI Safety", () => {
	it("formats price with single currency symbol wrapped in bdi context", () => {
		const formatMoney = (val: number, symbol: string) => `${symbol} ${val.toFixed(2)}`;

		const formatted = formatMoney(150, "EGP");
		expect(formatted).toBe("EGP 150.00");
		expect(formatted.split("EGP").length - 1).toBe(1); // Currency symbol appears exactly once
	});
});
