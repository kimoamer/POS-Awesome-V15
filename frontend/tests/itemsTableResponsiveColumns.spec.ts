import { describe, expect, it } from "vitest";

import {
	buildFinalVisibleColumns,
	getResponsiveVisibleHeaders,
} from "../src/posapp/composables/pos/items/useItemsTableResponsive";

const headers = [
	{ key: "item_name", title: "Name", required: true },
	{ key: "qty", title: "QTY", required: true },
	{ key: "uom", title: "UOM" },
	{ key: "price_list_rate", title: "Price List Rate" },
	{ key: "discount_percentage", title: "Discount %" },
	{ key: "discount_amount", title: "Discount Amount" },
	{ key: "rate", title: "Rate", required: true },
	{ key: "amount", title: "Amount", required: true },
	{ key: "posa_is_offer", title: "Offer?" },
	{ key: "actions", title: "Actions", required: true, width: 96 },
];

describe("items table final visible columns", () => {
	it("keeps the body column order aligned with the responsive header order without data-table-expand", () => {
		const visible = buildFinalVisibleColumns(headers, 1200);

		expect(visible.map((column) => column.key)).toEqual([
			"item_name",
			"qty",
			"uom",
			"price_list_rate",
			"discount_percentage",
			"discount_amount",
			"rate",
			"amount",
			"posa_is_offer",
			"actions",
		]);
		expect(visible.find((col) => col.key === "actions")?.width).toBe(96);
	});

	it("keeps selected optional columns visible when the cart pane has enough room", () => {
		const responsive = getResponsiveVisibleHeaders(headers, 760);
		const finalColumns = buildFinalVisibleColumns(headers, 760);

		expect(responsive.map((column) => column.key)).toEqual([
			"item_name",
			"qty",
			"uom",
			"price_list_rate",
			"discount_percentage",
			"discount_amount",
			"rate",
			"amount",
			"posa_is_offer",
			"actions",
		]);
		expect(finalColumns).toEqual(responsive);
	});

	it("keeps actions column when compact columns collapse optional fields", () => {
		const finalColumns = buildFinalVisibleColumns(headers, 620);

		expect(finalColumns.map((column) => column.key)).toEqual([
			"item_name",
			"qty",
			"rate",
			"amount",
			"actions",
		]);
	});

	it("collapses optional columns throughout the mobile cart row range", () => {
		const finalColumns = buildFinalVisibleColumns(headers, 480);

		expect(finalColumns.map((column) => column.key)).toEqual([
			"item_name",
			"qty",
			"rate",
			"amount",
			"actions",
		]);
	});

	it("collapses optional columns when compact cart rows are forced by viewport", () => {
		const finalColumns = buildFinalVisibleColumns(headers, 1024, {
			collapseOptional: true,
		});

		expect(finalColumns.map((column) => column.key)).toEqual([
			"item_name",
			"qty",
			"rate",
			"amount",
			"actions",
		]);
	});

	it("preserves selected optional columns when collapseOptional is false even if container width is below 680px", () => {
		const finalColumns = buildFinalVisibleColumns(headers, 600, {
			collapseOptional: false,
		});

		expect(finalColumns.map((column) => column.key)).toEqual([
			"item_name",
			"qty",
			"uom",
			"price_list_rate",
			"discount_percentage",
			"discount_amount",
			"rate",
			"amount",
			"posa_is_offer",
			"actions",
		]);
	});
});
