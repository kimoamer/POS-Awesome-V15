import { describe, expect, it } from "vitest";
import { normalizeItemImageUrl, resolveItemImage } from "../src/posapp/utils/itemImage";

describe("itemImage utility", () => {
	describe("normalizeItemImageUrl", () => {
		it("preserves http, https, data, blob, and absolute URLs", () => {
			expect(normalizeItemImageUrl("http://example.com/a.png")).toBe("http://example.com/a.png");
			expect(normalizeItemImageUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
			expect(normalizeItemImageUrl("data:image/png;base64,123")).toBe("data:image/png;base64,123");
			expect(normalizeItemImageUrl("blob:http://localhost/123")).toBe("blob:http://localhost/123");
			expect(normalizeItemImageUrl("/files/item.png")).toBe("/files/item.png");
			expect(normalizeItemImageUrl("/private/files/item.png")).toBe("/private/files/item.png");
		});

		it("prepends slash to relative files/ and private/files/ paths", () => {
			expect(normalizeItemImageUrl("files/item.png")).toBe("/files/item.png");
			expect(normalizeItemImageUrl("private/files/item.png")).toBe("/private/files/item.png");
		});

		it("returns empty string for empty input", () => {
			expect(normalizeItemImageUrl("")).toBe("");
			expect(normalizeItemImageUrl("   ")).toBe("");
		});
	});

	describe("resolveItemImage", () => {
		it("resolves image from primary item keys in order", () => {
			expect(resolveItemImage({ image: "files/primary.png" })).toBe("/files/primary.png");
			expect(resolveItemImage({ item_image: "files/secondary.png" })).toBe("/files/secondary.png");
			expect(resolveItemImage({ thumbnail: "files/thumb.png" })).toBe("/files/thumb.png");
			expect(resolveItemImage({ item_image_url: "files/url.png" })).toBe("/files/url.png");
		});

		it("falls back to catalog item when primary invoice row item lacks image key", () => {
			const invoiceRow = { item_code: "ITEM-001" };
			const catalogItem = { item_code: "ITEM-001", image: "files/catalog.png" };

			expect(resolveItemImage(invoiceRow, catalogItem)).toBe("/files/catalog.png");
		});

		it("handles object image payload with url/src/file_url properties", () => {
			const item = { image: { file_url: "files/object_file.png" } };
			expect(resolveItemImage(item)).toBe("/files/object_file.png");
		});
	});
});
