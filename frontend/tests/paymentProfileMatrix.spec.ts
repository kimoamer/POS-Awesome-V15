import { describe, expect, it } from "vitest";
import { parseBooleanSetting } from "../src/posapp/utils/stock";

describe("Payment POS Profile Setting Matrix Contract", () => {
	it("normalizes boolean POS Profile flags correctly across numeric, string, and boolean representations", () => {
		expect(parseBooleanSetting(1)).toBe(true);
		expect(parseBooleanSetting("1")).toBe(true);
		expect(parseBooleanSetting("true")).toBe(true);
		expect(parseBooleanSetting(true)).toBe(true);
		expect(parseBooleanSetting("Yes")).toBe(true);

		expect(parseBooleanSetting(0)).toBe(false);
		expect(parseBooleanSetting("0")).toBe(false);
		expect(parseBooleanSetting("false")).toBe(false);
		expect(parseBooleanSetting(false)).toBe(false);
		expect(parseBooleanSetting(undefined)).toBe(false);
		expect(parseBooleanSetting(null)).toBe(false);
	});

	it("correctly evaluates POS Profile payment settings for UI rendering rules", () => {
		const profile = {
			posa_allow_credit_sale: "1",
			posa_allow_partial_payment: 0,
			posa_allow_write_off_change: "true",
			posa_use_customer_credit: 1,
			posa_use_gift_cards: "0",
		};

		expect(parseBooleanSetting(profile.posa_allow_credit_sale)).toBe(true);
		expect(parseBooleanSetting(profile.posa_allow_partial_payment)).toBe(false);
		expect(parseBooleanSetting(profile.posa_allow_write_off_change)).toBe(true);
		expect(parseBooleanSetting(profile.posa_use_customer_credit)).toBe(true);
		expect(parseBooleanSetting(profile.posa_use_gift_cards)).toBe(false);
	});
});
