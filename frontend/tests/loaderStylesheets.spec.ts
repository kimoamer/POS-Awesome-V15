// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { resolveBuildStylesheetUrls } from "../src/loader";

describe("POS loader stylesheet manifest", () => {
	it("loads every split entry stylesheet and removes duplicate URLs", () => {
		expect(
			resolveBuildStylesheetUrls(
				{
					assets: {
						styles: [
							"/assets/posawesome/shell.css",
							"/assets/posawesome/vendor.css",
							"/assets/posawesome/shell.css",
						],
					},
				},
				"build-1",
			),
		).toEqual([
			"/assets/posawesome/shell.css",
			"/assets/posawesome/vendor.css",
		]);
	});

	it("falls back to the compatibility stylesheet for older manifests", () => {
		expect(
			resolveBuildStylesheetUrls({ version: "old" }, "old"),
		).toEqual([
			"/assets/posawesome/dist/js/posawesome.css?v=old",
		]);
	});
});
