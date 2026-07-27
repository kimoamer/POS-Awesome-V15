import { describe, expect, it } from "vitest";
import { parseBooleanSetting } from "../src/posapp/utils/stock";

describe("POS Profile Boolean Matrix Rules", () => {
	it("parses all disabled boolean variants to false", () => {
		const disabledValues = [0, "0", false, "false", null, undefined, ""];
		disabledValues.forEach((val) => {
			expect(parseBooleanSetting(val)).toBe(false);
		});
	});

	it("parses all enabled boolean variants to true", () => {
		const enabledValues = [1, "1", true, "true"];
		enabledValues.forEach((val) => {
			expect(parseBooleanSetting(val)).toBe(true);
		});
	});
});
