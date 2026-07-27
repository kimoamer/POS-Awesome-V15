import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useUIStore } from "../src/posapp/stores/uiStore";
import ItemsSelector from "../src/posapp/components/pos/items/ItemsSelector.vue";

describe("Offers & Coupons Navigation Architecture", () => {
	it("does not render top segmented tabs bar in ItemsSelector", () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const wrapper = mount(ItemsSelector, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
			},
		});

		expect(wrapper.find(".pos-segmented-tabs").exists()).toBe(false);
		expect(wrapper.find("#tab-items").exists()).toBe(false);
	});

	it("uses consolidated single subview header for Offers and Coupons with back action", async () => {
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

		// 1. Open Offers subview
		uiStore.setActiveView("offers");
		await wrapper.vm.$nextTick();

		const offersHeader = wrapper.find('.browse-subview-panel[aria-hidden="false"] .browse-subview-header');
		expect(offersHeader.exists()).toBe(true);
		expect(offersHeader.text()).toContain("Offers");

		// Click single consolidated back button
		const offersBackBtn = offersHeader.find(".browse-subview-back");
		await offersBackBtn.trigger("click");
		expect(uiStore.activeView).toBe("items");

		// 2. Open Coupons subview
		uiStore.setActiveView("coupons");
		await wrapper.vm.$nextTick();

		const couponsHeader = wrapper.find('.browse-subview-panel[aria-hidden="false"] .browse-subview-header');
		expect(couponsHeader.exists()).toBe(true);
		expect(couponsHeader.text()).toContain("Coupons");

		// Click single consolidated back button
		const couponsBackBtn = couponsHeader.find(".browse-subview-back");
		await couponsBackBtn.trigger("click");
		expect(uiStore.activeView).toBe("items");
	});
});
