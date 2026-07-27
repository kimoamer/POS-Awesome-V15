import { describe, expect, it } from "vitest";
import { parseBooleanSetting } from "../src/posapp/composables/pos/items/useItemPermissions";

describe("Pass 6.9 — POS Profile Missing Fields Fallback Rule", () => {
	it("preserves default behavior (true) when setting is undefined or null", () => {
		expect(parseBooleanSetting(undefined)).toBe(true);
		expect(parseBooleanSetting(null)).toBe(true);
		expect(parseBooleanSetting(undefined, true)).toBe(true);
		expect(parseBooleanSetting(undefined, false)).toBe(false);
	});
});
