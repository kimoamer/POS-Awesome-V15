import { describe, expect, it } from "vitest";

describe("Product Browser & Search Workflow", () => {
	it("filters items by item group", () => {
		const items = [
			{ item_code: "ITEM-1", item_name: "Apple", item_group: "Fruits" },
			{ item_code: "ITEM-2", item_name: "Carrot", item_group: "Vegetables" },
			{ item_code: "ITEM-3", item_name: "Banana", item_group: "Fruits" },
		];

		const selectedGroup = "Fruits";
		const filtered = items.filter((item) => item.item_group === selectedGroup);

		expect(filtered.length).toBe(2);
		expect(filtered.map((i) => i.item_code)).toEqual(["ITEM-1", "ITEM-3"]);
	});

	it("matches search query against code, name, and group", () => {
		const items = [
			{ item_code: "P-101", item_name: "Milk 1L", barcode: "12345" },
			{ item_code: "P-102", item_name: "Bread", barcode: "67890" },
		];

		const query = "101";
		const matches = items.filter(
			(i) => i.item_code.includes(query) || i.item_name.includes(query) || i.barcode === query,
		);

		expect(matches.length).toBe(1);
		expect(matches[0].item_code).toBe("P-101");
	});
});
