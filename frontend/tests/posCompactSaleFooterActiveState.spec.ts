import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useUIStore } from "../src/posapp/stores/uiStore";
import Pos from "../src/posapp/components/pos/shell/Pos.vue";

describe("Compact Sale Footer Active State Isolation", () => {
	it("ensures exactly one navigation destination is active at a time", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const uiStore = useUIStore();
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const wrapper = mount(Pos, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
				stubs: {
					ItemsSelector: true,
					Invoice: true,
				},
			},
		});

		(wrapper.vm as any).responsive.windowWidth = 500;
		await wrapper.vm.$nextTick();

		// 1. Default (items / browse) active
		expect((wrapper.vm as any).activeDockAction).toBe("browse");

		// 2. Open Cart -> activeDockAction is "cart"
		(wrapper.vm as any).compactPanel = "invoice";
		await wrapper.vm.$nextTick();
		expect((wrapper.vm as any).activeDockAction).toBe("cart");

		const activeItems = wrapper.findAll(".mobile-pos-dock__item--active");
		expect(activeItems.length).toBe(1);
		expect(activeItems[0]?.text()).toContain("Cart");

		// 3. Open Offers -> activeDockAction is "offers"
		(wrapper.vm as any).compactPanel = "selector";
		uiStore.setActiveView("offers");
		await wrapper.vm.$nextTick();
		expect((wrapper.vm as any).activeDockAction).toBe("offers");

		const activeOffers = wrapper.findAll(".mobile-pos-dock__item--active");
		expect(activeOffers.length).toBe(1);
		expect(activeOffers[0]?.text()).toContain("Offers");

		// 4. Open Coupons -> activeDockAction is "coupons"
		uiStore.setActiveView("coupons");
		await wrapper.vm.$nextTick();
		expect((wrapper.vm as any).activeDockAction).toBe("coupons");

		const activeCoupons = wrapper.findAll(".mobile-pos-dock__item--active");
		expect(activeCoupons.length).toBe(1);
		expect(activeCoupons[0]?.text()).toContain("Coupons");
	});

	it("renders Pay as CTA button without aria-current or active tab class", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const wrapper = mount(Pos, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
				stubs: {
					ItemsSelector: true,
					Invoice: true,
				},
			},
		});

		(wrapper.vm as any).responsive.windowWidth = 500;
		await wrapper.vm.$nextTick();

		const payBtn = wrapper.find(".mobile-pos-dock__item--pay");
		expect(payBtn.exists()).toBe(true);
		expect(payBtn.classes()).toContain("mobile-pos-dock__item--cta");
		expect(payBtn.classes()).not.toContain("mobile-pos-dock__item--active");
		expect(payBtn.attributes("aria-current")).toBeUndefined();
	});
});
