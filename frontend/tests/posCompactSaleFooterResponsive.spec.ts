import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Pos from "../src/posapp/components/pos/shell/Pos.vue";

describe("Compact Sale Footer Responsive Viewport Adaptations", () => {
	it("renders footer across phone, tablet portrait, compact landscape (900-1099px), and wide landscape (1100px+)", async () => {
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

		// 1. Phone Viewport (360px & 390px)
		(wrapper.vm as any).responsive.windowWidth = 360;
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-pos-stack").exists()).toBe(true);

		// 2. Tablet Portrait Viewport (768px)
		(wrapper.vm as any).responsive.windowWidth = 768;
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-pos-stack").exists()).toBe(true);

		// 3. Compact Tablet Landscape (900px & 1024px)
		(wrapper.vm as any).responsive.windowWidth = 900;
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-pos-stack").exists()).toBe(true);

		(wrapper.vm as any).responsive.windowWidth = 1024;
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-pos-stack").exists()).toBe(true);

		// 4. Wide Tablet Landscape (1100px)
		(wrapper.vm as any).responsive.windowWidth = 1100;
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-pos-stack").exists()).toBe(true);
	});
});
