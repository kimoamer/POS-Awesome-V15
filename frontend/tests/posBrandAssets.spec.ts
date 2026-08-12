// @vitest-environment node

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function readPngSize(filePath: string) {
	const buffer = fs.readFileSync(filePath);
	expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG");
	return {
		width: buffer.readUInt32BE(16),
		height: buffer.readUInt32BE(20),
		buffer,
	};
}

describe("POSMate brand assets", () => {
	it.each([
		["logo-144.png", 144],
		["logo-192.png", 192],
		["logo-512.png", 512],
	])("ships %s at its declared PWA size", (fileName, expectedSize) => {
		const iconPath = path.resolve(
			__dirname,
			`../../posawesome/public/icons/${fileName}`,
		);
		const icon = readPngSize(iconPath);
		expect(icon.width).toBe(expectedSize);
		expect(icon.height).toBe(expectedSize);
	});

	it("uses the same 512px mark in the navbar and installed app", () => {
		const navbarIcon = readPngSize(
			path.resolve(__dirname, "../src/posapp/components/pos/pos.png"),
		);
		const pwaIcon = readPngSize(
			path.resolve(
				__dirname,
				"../../posawesome/public/icons/logo-512.png",
			),
		);

		expect(navbarIcon.width).toBe(512);
		expect(navbarIcon.buffer.equals(pwaIcon.buffer)).toBe(true);
	});

	it("declares the modern POSMate identity and all required icons", () => {
		const manifestPath = path.resolve(
			__dirname,
			"../../posawesome/www/manifest.json",
		);
		const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

		expect(manifest.name).toBe("POSMate");
		expect(manifest.theme_color).toBe("#007681");
		expect(
			manifest.icons.map((icon: { sizes: string }) => icon.sizes),
		).toEqual(["512x512", "192x192", "144x144"]);
	});
});
