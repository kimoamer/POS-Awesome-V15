import { describe, expect, it } from "vitest";
import { parseBooleanSetting } from "../src/posapp/composables/pos/items/useItemPermissions";

describe("Pass 6.9 — POS Profile Missing Fields Fallback Rule", () => {
	it("preserves baseline behavior (false) when setting is undefined or null", () => {
		expect(parseBooleanSetting(undefined)).toBe(false);
		expect(parseBooleanSetting(null)).toBe(false);
	});
});
