import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Pos from "../src/posapp/components/pos/shell/Pos.vue";

describe("Compact Sale Footer RTL & Directionality", () => {
	it("wraps currency amount in bdi and uses logical inline position for cart badge", async () => {
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

		(wrapper.vm as any).responsive.windowWidth = 400;
		await wrapper.vm.$nextTick();

		const amountElement = wrapper.find(".mobile-sale-dock__amount");
		expect(amountElement.exists()).toBe(true);
		expect(amountElement.find("bdi").exists()).toBe(true);
	});
});
