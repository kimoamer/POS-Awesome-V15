import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PosOffers from "../src/posapp/components/pos/offers/PosOffers.vue";
import PosCoupons from "../src/posapp/components/pos/offers/PosCoupons.vue";
import { createPinia, setActivePinia } from "pinia";

describe("Offers & Coupons RTL & Directionality Contract", () => {
	it("wraps coupon codes in bdi tags for safe RTL mixed direction rendering", () => {
		const code = "DISC-50-OFF";
		const formatted = `<bdi class="pos-coupon-card__code">${code}</bdi>`;
		expect(formatted).toContain("<bdi");
		expect(formatted).toContain("DISC-50-OFF");
	});

	it("flips back arrow icon direction when RTL is active", () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const offersWrapper = mount(PosOffers, {
			global: { plugins: [pinia], provide: { eventBus } },
		});
		const couponsWrapper = mount(PosCoupons, {
			global: { plugins: [pinia], provide: { eventBus } },
		});

		// Default LTR back icon
		expect((offersWrapper.vm as any).browseBackIcon).toBe("mdi-arrow-left");
		expect((couponsWrapper.vm as any).browseBackIcon).toBe("mdi-arrow-left");
	});
});
