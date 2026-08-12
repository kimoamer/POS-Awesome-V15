// @vitest-environment node

import { describe, expect, it } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	collectMdiIconNames,
	getMissingMdiIcons,
	isPosFontStylesheet,
	keepOnlyWoff2FontSources,
	subsetMaterialDesignIconCss,
} from "../font-optimization.js";

async function readSources(directory: string): Promise<string[]> {
	const sources: string[] = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const target = path.join(directory, entry.name);
		if (entry.isDirectory()) sources.push(...(await readSources(target)));
		else if (/\.(?:ts|vue)$/.test(entry.name)) {
			sources.push(await readFile(target, "utf8"));
		}
	}
	return sources;
}

describe("production font optimization", () => {
	it("keeps only WOFF2 sources while preserving font-face metadata", () => {
		const css = `
@font-face {
  font-family: "Material Design Icons";
  src: url("font.eot?v=1");
  src: url("font.eot?#iefix") format("embedded-opentype"), url("font.woff2?v=1") format("woff2"), url("font.woff") format("woff"), url("font.ttf") format("truetype");
  font-weight: normal;
}
`;

		const optimized = keepOnlyWoff2FontSources(css);
		expect(optimized).toContain('url("font.woff2?v=1") format("woff2")');
		expect(optimized).toContain("font-weight: normal");
		expect(optimized).not.toMatch(/\.eot|\.ttf|\.woff["')]/);
	});

	it("only transforms the bundled MDI and Roboto entry stylesheets", () => {
		expect(
			isPosFontStylesheet(
				"/workspace/node_modules/@mdi/font/css/materialdesignicons.css",
			),
		).toBe(true);
		expect(
			isPosFontStylesheet(
				"/workspace/node_modules/@fontsource/roboto/500.css?direct",
			),
		).toBe(true);
		expect(isPosFontStylesheet("/workspace/src/posapp/styles/theme.css")).toBe(false);
	});

	it("keeps only icon glyphs referenced by POS source files", () => {
		const css = `
.mdi:before, .mdi-set { font-family: "Material Design Icons"; }
.mdi-cart::before { content: "\\F0110"; }
.mdi-cash::before { content: "\\F0114"; }
.mdi-account::before { content: "\\F0004"; }
.mdi-spin { animation: mdi-spin 2s infinite linear; }
`;
		const icons = collectMdiIconNames([
			'<v-icon icon="mdi-cart" />',
			'const statusIcon = "mdi-account";',
		]);
		const optimized = subsetMaterialDesignIconCss(css, icons);

		expect(Array.from(icons).sort()).toEqual(["mdi-account", "mdi-cart"]);
		expect(getMissingMdiIcons(css, icons)).toEqual([]);
		expect(optimized).toContain(".mdi-cart::before");
		expect(optimized).toContain(".mdi-account::before");
		expect(optimized).not.toContain(".mdi-cash::before");
		expect(optimized).toContain(".mdi-spin");
	});

	it("recognizes every icon used by the application and produces a compact subset", async () => {
		const sourceRoot = fileURLToPath(new URL("../src/posapp", import.meta.url));
		const mdiCssPath = fileURLToPath(
			new URL(
				"../node_modules/@mdi/font/css/materialdesignicons.css",
				import.meta.url,
			),
		);
		const [sources, mdiCss] = await Promise.all([
			readSources(sourceRoot),
			readFile(mdiCssPath, "utf8"),
		]);
		const icons = collectMdiIconNames(sources);
		const subset = subsetMaterialDesignIconCss(mdiCss, icons);

		expect(icons.size).toBeGreaterThan(250);
		expect(getMissingMdiIcons(mdiCss, icons)).toEqual([]);
		expect(subset.length).toBeLessThan(mdiCss.length * 0.25);
	});
});
