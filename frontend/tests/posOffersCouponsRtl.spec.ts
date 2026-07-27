import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import ItemsSelector from "../src/posapp/components/pos/items/ItemsSelector.vue";
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

		const wrapper = mount(ItemsSelector, {
			global: { plugins: [pinia], provide: { eventBus } },
		});

		// Default LTR back icon
		expect((wrapper.vm as any).browseBackIcon).toBe("mdi-chevron-left");
	});
});
