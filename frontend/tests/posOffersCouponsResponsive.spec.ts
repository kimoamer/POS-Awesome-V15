import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PosOffers from "../src/posapp/components/pos/offers/PosOffers.vue";
import PosCoupons from "../src/posapp/components/pos/offers/PosCoupons.vue";
import { createPinia, setActivePinia } from "pinia";

describe("Offers & Coupons Responsive Workspace Sizing", () => {
	it("renders action buttons in PosOffers and PosCoupons", () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const offersWrapper = mount(PosOffers, {
			global: { plugins: [pinia], provide: { eventBus } },
		});
		const couponsWrapper = mount(PosCoupons, {
			global: { plugins: [pinia], provide: { eventBus } },
		});

		expect(offersWrapper.find(".pos-offers-back-btn").exists()).toBe(true);
		expect(couponsWrapper.find(".add-coupon-btn").exists()).toBe(true);
	});
});
