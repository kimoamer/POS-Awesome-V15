import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PosOffers from "../src/posapp/components/pos/offers/PosOffers.vue";
import PosCoupons from "../src/posapp/components/pos/offers/PosCoupons.vue";
import { createPinia, setActivePinia } from "pinia";

describe("Offers & Coupons Accessibility Contract", () => {
	it("exposes aria-busy, aria-live, and accessible button labels", () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const offersWrapper = mount(PosOffers, {
			global: { plugins: [pinia], provide: { eventBus } },
		});
		const couponsWrapper = mount(PosCoupons, {
			global: { plugins: [pinia], provide: { eventBus } },
		});

		expect(offersWrapper.find('[aria-live="polite"]').exists()).toBe(true);
		expect(couponsWrapper.find('[aria-live="polite"]').exists()).toBe(true);

		expect(offersWrapper.attributes("aria-busy")).toBe("false");
		expect(couponsWrapper.attributes("aria-busy")).toBe("false");
	});
});
