import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PosCoupons from "../src/posapp/components/pos/offers/PosCoupons.vue";
import { createPinia, setActivePinia } from "pinia";
import { useUIStore } from "../src/posapp/stores/uiStore";

describe("PosCoupons Component Integration", () => {
	it("renders coupons workspace, customer notice, input bar, and handles back action", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const uiStore = useUIStore();

		const eventBus = {
			on: () => {},
			off: () => {},
			emit: () => {},
		};

		const wrapper = mount(PosCoupons, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
			},
		});

		expect(wrapper.find(".pos-coupons-container").exists()).toBe(true);
		expect(wrapper.find(".pos-coupons-customer-bar").exists()).toBe(true);
		expect(wrapper.find(".coupon-input").exists()).toBe(true);

		const backBtn = wrapper.find(".pos-coupons-back-btn");
		expect(backBtn.exists()).toBe(true);
		await backBtn.trigger("click");
		expect(uiStore.activeView).toBe("items");
	});
});
