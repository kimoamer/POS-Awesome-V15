import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Pos from "../src/posapp/components/pos/shell/Pos.vue";

describe("Compact Cart Responsive Viewport Tests", () => {
	it("maintains single navigation-only footer across 360x800, 390x844, 430x932, 768x1024, and 1024x768 viewports on Cart view", async () => {
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

		(wrapper.vm as any).compactPanel = "invoice";

		const viewports = [360, 390, 430, 768, 1024];
		for (const vp of viewports) {
			(wrapper.vm as any).responsive.windowWidth = vp;
			await wrapper.vm.$nextTick();

			expect(wrapper.find(".mobile-pos-stack").exists()).toBe(true);
			expect(wrapper.find(".mobile-sale-dock").exists()).toBe(false);
			expect(wrapper.find(".mobile-pos-dock").exists()).toBe(true);
		}
	});
});
