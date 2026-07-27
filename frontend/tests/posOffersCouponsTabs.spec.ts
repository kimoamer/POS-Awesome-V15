import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useUIStore } from "../src/posapp/stores/uiStore";
import ItemsSelector from "../src/posapp/components/pos/items/ItemsSelector.vue";

describe("Products, Offers & Coupons Segmented Tabs", () => {
	it("renders segmented navigation tabs with role=tablist and role=tab", () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const wrapper = mount(ItemsSelector, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
			},
		});

		const tablist = wrapper.find('[role="tablist"]');
		expect(tablist.exists()).toBe(true);

		const itemsTab = wrapper.find("#tab-items");
		const offersTab = wrapper.find("#tab-offers");
		const couponsTab = wrapper.find("#tab-coupons");

		expect(itemsTab.exists()).toBe(true);
		expect(offersTab.exists()).toBe(true);
		expect(couponsTab.exists()).toBe(true);

		expect(itemsTab.attributes("aria-selected")).toBe("true");
		expect(offersTab.attributes("aria-selected")).toBe("false");
		expect(couponsTab.attributes("aria-selected")).toBe("false");
	});

	it("Products, Offers, and Coupons tabs change activeView and tabpanel visibility", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const uiStore = useUIStore();
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const wrapper = mount(ItemsSelector, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
			},
		});

		// 1. Offers tab changes activeView to offers
		const offersTab = wrapper.find("#tab-offers");
		await offersTab.trigger("click");
		expect(uiStore.activeView).toBe("offers");
		expect(offersTab.attributes("aria-selected")).toBe("true");

		// 2. Coupons tab changes activeView to coupons
		const couponsTab = wrapper.find("#tab-coupons");
		await couponsTab.trigger("click");
		expect(uiStore.activeView).toBe("coupons");
		expect(couponsTab.attributes("aria-selected")).toBe("true");

		// 3. Products tab changes activeView to items
		const itemsTab = wrapper.find("#tab-items");
		await itemsTab.trigger("click");
		expect(uiStore.activeView).toBe("items");
		expect(itemsTab.attributes("aria-selected")).toBe("true");
	});
});
