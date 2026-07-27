import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Pos from "../src/posapp/components/pos/shell/Pos.vue";

describe("Compact Cart Contextual Deduplication", () => {
	it("hides global mobile-sale-dock when Cart view is open and shows it on Browse view", async () => {
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

		// 1. On Browse view (compactPanel === "selector"), mobile-sale-dock is present
		(wrapper.vm as any).compactPanel = "selector";
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-sale-dock").exists()).toBe(true);

		// 2. On Cart view (compactPanel === "invoice"), mobile-sale-dock is absent (deduplicated)
		(wrapper.vm as any).compactPanel = "invoice";
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-sale-dock").exists()).toBe(false);

		// 3. Navigation dock remains present on both views
		expect(wrapper.find(".mobile-pos-dock").exists()).toBe(true);

		// 4. Switching back to Browse restores mobile-sale-dock
		(wrapper.vm as any).compactPanel = "selector";
		await wrapper.vm.$nextTick();
		expect(wrapper.find(".mobile-sale-dock").exists()).toBe(true);
	});
});
