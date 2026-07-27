import { describe, expect, it } from "vitest";

describe("Offers & Coupons RTL BDI Rendering", () => {
	it("wraps coupon codes in bdi tags for safe RTL mixed direction rendering", () => {
		const code = "DISC-50-OFF";
		const formatted = `<bdi class="pos-coupon-card__code">${code}</bdi>`;
		expect(formatted).toContain("<bdi");
		expect(formatted).toContain("DISC-50-OFF");
	});
});
