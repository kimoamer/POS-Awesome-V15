import { describe, expect, it } from "vitest";
import { parseBooleanSetting } from "../src/posapp/composables/pos/items/useItemPermissions";

describe("Pass 6.9 — POS Profile Settings Matrix", () => {
	it("disables features when explicitly set to 0, '0', false, or 'false'", () => {
		expect(parseBooleanSetting(0)).toBe(false);
		expect(parseBooleanSetting("0")).toBe(false);
		expect(parseBooleanSetting(false)).toBe(false);
		expect(parseBooleanSetting("false")).toBe(false);
	});

	it("enables features when explicitly set to 1, '1', true, or 'true'", () => {
		expect(parseBooleanSetting(1)).toBe(true);
		expect(parseBooleanSetting("1")).toBe(true);
		expect(parseBooleanSetting(true)).toBe(true);
		expect(parseBooleanSetting("true")).toBe(true);
	});
});
