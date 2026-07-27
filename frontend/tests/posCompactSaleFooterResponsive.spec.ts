import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Pos from "../src/posapp/components/pos/shell/Pos.vue";

describe("Compact Sale Footer Responsive Viewport Adaptations", () => {
	it("renders single unified footer container for phone, tablet portrait and tablet landscape", async () => {
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

		// 1. Phone Viewport (390px)
		(wrapper.vm as any).responsive.windowWidth = 390;
		await wrapper.vm.$nextTick();

		const phoneStack = wrapper.find(".mobile-pos-stack");
		expect(phoneStack.exists()).toBe(true);

		// 2. Tablet Portrait Viewport (768px)
		(wrapper.vm as any).responsive.windowWidth = 768;
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-pos-stack").exists()).toBe(true);

		// 3. Tablet Landscape Viewport (1024px)
		(wrapper.vm as any).responsive.windowWidth = 1024;
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-pos-stack").exists()).toBe(true);
	});
});
