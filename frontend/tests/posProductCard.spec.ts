import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ItemCard from "../src/posapp/components/pos/items/ItemCard.vue";

describe("ItemCard Semantic Structure & Capability Integration", () => {
	const defaultProps = {
		item: { item_code: "P-100", item_name: "Test Item", actual_qty: 10, stock_uom: "Nos" },
		posProfile: { currency: "USD", posa_display_items_in_stock: "1", posa_allow_multi_currency: "0" },
		getItemRateInfo: () => ({}),
		currencySymbol: (c: string) => c,
		formatCurrency: (v: number) => `$${v}`,
		formatNumber: (v: number) => String(v),
		ratePrecision: () => 2,
	};

	it("renders as semantic article container and emits click when Add button is triggered", async () => {
		const wrapper = mount(ItemCard, { props: defaultProps });

		expect(wrapper.element.tagName.toLowerCase()).toBe("article");
		const addButton = wrapper.find(".item-card-add");
		expect(addButton.exists()).toBe(true);

		await addButton.trigger("click");
		expect(wrapper.emitted("click")).toBeTruthy();
	});

	it("hides stock row when allowStockDisplay is false", () => {
		const propsNoStock = {
			...defaultProps,
			posProfile: { ...defaultProps.posProfile, posa_display_items_in_stock: "0" },
		};
		const wrapper = mount(ItemCard, { props: propsNoStock });

		expect(wrapper.find(".card-item-stock").exists()).toBe(false);
		expect(wrapper.classes()).toContain("card-item-card--no-stock");
	});
});
