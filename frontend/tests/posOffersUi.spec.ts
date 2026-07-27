import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PosOffers from "../src/posapp/components/pos/offers/PosOffers.vue";
import { createPinia, setActivePinia } from "pinia";
import { useUIStore } from "../src/posapp/stores/uiStore";

describe("PosOffers Component Integration", () => {
	it("renders offers workspace with summary badges and handles back action", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const uiStore = useUIStore();

		const eventBus = {
			on: () => {},
			off: () => {},
			emit: () => {},
		};

		const wrapper = mount(PosOffers, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
			},
		});

		expect(wrapper.find(".pos-offers-container").exists()).toBe(true);
		expect(wrapper.find(".pos-offers-header").exists()).toBe(true);

		const backBtn = wrapper.find(".pos-offers-back-btn");
		expect(backBtn.exists()).toBe(true);
		await backBtn.trigger("click");
		expect(uiStore.activeView).toBe("items");
	});
});
