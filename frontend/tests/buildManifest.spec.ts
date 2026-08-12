import { describe, expect, it } from "vitest";

import {
	buildVersionPayload,
	getEntryFileName,
	getPrecacheAssetFileNames,
} from "../build-manifest.js";

describe("build manifest helpers", () => {
	it("hashes every entry filename so deploys cannot reuse stale URLs", () => {
		expect(getEntryFileName({ name: "posawesome" })).toBe(
			"[name]-[hash].js",
		);
		expect(getEntryFileName({ name: "loader" })).toBe("[name]-[hash].js");
		expect(getEntryFileName({ name: "offline/index" })).toBe(
			"[name]-[hash].js",
		);
	});

	it("publishes the actual hashed entry filenames from the rollup bundle", () => {
		const payload = buildVersionPayload("build-2000", {
			"loader-XYZ123.js": {
				type: "chunk",
				name: "loader",
				fileName: "loader-XYZ123.js",
			},
			"posawesome-AAA999.js": {
				type: "chunk",
				name: "posawesome",
				fileName: "posawesome-AAA999.js",
			},
			"offline/index-AbCd1234.js": {
				type: "chunk",
				name: "offline/index",
				fileName: "offline/index-AbCd1234.js",
			},
			"style-Z9Z9.css": {
				type: "asset",
				name: "style.css",
				fileName: "style-Z9Z9.css",
				source: "body{}",
			},
			"materialdesignicons-webfont-ICONS.woff2": {
				type: "asset",
				name: "materialdesignicons-webfont.woff2",
				fileName: "materialdesignicons-webfont-ICONS.woff2",
				source: "font",
			},
			"materialdesignicons-webfont-LEGACY.ttf": {
				type: "asset",
				name: "materialdesignicons-webfont.ttf",
				fileName: "materialdesignicons-webfont-LEGACY.ttf",
				source: "font",
			},
			"roboto-latin-400-normal-TEXT.woff": {
				type: "asset",
				name: "roboto-latin-400-normal.woff",
				fileName: "roboto-latin-400-normal-TEXT.woff",
				source: "font",
			},
		});

		expect(payload).toEqual({
			version: "build-2000",
			assets: {
				loader: "/assets/posawesome/dist/js/loader-XYZ123.js?v=build-2000",
				posawesome:
					"/assets/posawesome/dist/js/posawesome-AAA999.js?v=build-2000",
				css: "/assets/posawesome/dist/js/posawesome.css?v=build-2000",
				styles: [
					"/assets/posawesome/dist/js/style-Z9Z9.css?v=build-2000",
				],
				offlineIndex:
					"/assets/posawesome/dist/js/offline/index-AbCd1234.js",
				fonts: [
					"/assets/posawesome/dist/js/materialdesignicons-webfont-ICONS.woff2",
				],
				precache: ["/assets/posawesome/dist/js/posawesome-AAA999.js"],
			},
		});
		expect(payload.assets.fonts).not.toContain(
			"/assets/posawesome/dist/js/roboto-latin-400-normal-TEXT.woff",
		);
		expect(payload.assets.fonts).not.toContain(
			"/assets/posawesome/dist/js/materialdesignicons-webfont-LEGACY.ttf",
		);
	});

	it("publishes every stylesheet attached to the POS entry when CSS is split", () => {
		const payload = buildVersionPayload("split-1", {
			"posawesome-ENTRY.js": {
				type: "chunk",
				name: "posawesome",
				fileName: "posawesome-ENTRY.js",
				imports: ["vuetify-UI.js"],
				viteMetadata: {
					importedCss: new Set([
						"posawesome-SHELL.css",
						"vendor-BASE.css",
					]),
				},
			},
			"vuetify-UI.js": {
				type: "chunk",
				name: "vuetify",
				fileName: "vuetify-UI.js",
				imports: [],
				viteMetadata: {
					importedCss: new Set(["vuetify-UI.css"]),
				},
			},
		});

		expect(payload.assets.styles).toEqual([
			"/assets/posawesome/dist/js/posawesome-SHELL.css?v=split-1",
			"/assets/posawesome/dist/js/vendor-BASE.css?v=split-1",
			"/assets/posawesome/dist/js/vuetify-UI.css?v=split-1",
		]);
		expect(payload.assets.precache).toEqual([
			"/assets/posawesome/dist/js/posawesome-ENTRY.js",
			"/assets/posawesome/dist/js/posawesome-SHELL.css",
			"/assets/posawesome/dist/js/vendor-BASE.css",
			"/assets/posawesome/dist/js/vuetify-UI.css",
			"/assets/posawesome/dist/js/vuetify-UI.js",
		]);
	});

	it("publishes lazy route chunks and their styles for offline use", () => {
		const bundle = {
			"posawesome-ENTRY.js": {
				type: "chunk",
				name: "posawesome",
				fileName: "posawesome-ENTRY.js",
				dynamicImports: ["Payments-LAZY.js"],
			},
			"Payments-LAZY.js": {
				type: "chunk",
				name: "Payments",
				fileName: "Payments-LAZY.js",
				imports: ["vendor-SHARED.js"],
				viteMetadata: { importedCss: new Set(["Payments-LAZY.css"]) },
			},
			"vendor-SHARED.js": {
				type: "chunk",
				name: "vendor",
				fileName: "vendor-SHARED.js",
			},
		};

		expect(getPrecacheAssetFileNames(bundle)).toEqual([
			"Payments-LAZY.css",
			"Payments-LAZY.js",
			"posawesome-ENTRY.js",
			"vendor-SHARED.js",
		]);
	});

	it("falls back to legacy shell paths + cache-busts when bundle lookup fails", () => {
		const payload = buildVersionPayload("build with spaces", {});

		expect(payload.assets.loader).toBe(
			"/assets/posawesome/dist/js/loader.js?v=build%20with%20spaces",
		);
		expect(payload.assets.posawesome).toBe(
			"/assets/posawesome/dist/js/posawesome.js?v=build%20with%20spaces",
		);
		expect(payload.assets.css).toBe(
			"/assets/posawesome/dist/js/posawesome.css?v=build%20with%20spaces",
		);
		expect(payload.assets.styles).toEqual([
			"/assets/posawesome/dist/js/posawesome.css?v=build%20with%20spaces",
		]);
		expect(payload.assets.fonts).toEqual([]);
		expect(payload.assets.precache).toEqual([]);
	});
});
