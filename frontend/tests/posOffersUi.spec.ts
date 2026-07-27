import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import PosOffers from "../src/posapp/components/pos/offers/PosOffers.vue";
import { createPinia, setActivePinia } from "pinia";
import { useUIStore } from "../src/posapp/stores/uiStore";

describe("PosOffers Component Integration", () => {
	it("renders offers workspace and handles back_to_invoice method", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const uiStore = useUIStore();

		const eventBus = {
			on: () => {},
			off: () => {},
			emit: () => {},
		};

		const wrapper = mount(PosOffers, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
			},
		});

		expect(wrapper.find(".pos-offers-container").exists()).toBe(true);

		(wrapper.vm as any).back_to_invoice();
		expect(uiStore.activeView).toBe("items");
	});

	it("Apply and Remove Offer actions update actual component state and Give Item selector renders", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const eventBus = {
			on: () => {},
			off: () => {},
			emit: () => {},
		};

		(globalThis as any).frappe = {
			call: () => Promise.resolve({ message: [] }),
			_: (s: string) => s,
		};

		const wrapper = mount(PosOffers, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
			},
		});

		const sampleOffer = {
			name: "Promo Discount",
			apply_on: "Item Code",
			apply_type: "Item Code",
			apply_item_code: "ITEM-001",
			offer: "Give Product",
			give_item: "ITEM-002",
			offer_applied: false,
		};

		await wrapper.setData({ pos_offers: [sampleOffer] });

		// 1. Apply offer changes component state
		const applyBtn = wrapper.find(".pos-offer-action-btn");
		expect(applyBtn.exists()).toBe(true);
		await applyBtn.trigger("click");
		expect(wrapper.vm.pos_offers[0]?.offer_applied).toBe(true);

		// 2. Remove offer changes component state
		const removeBtn = wrapper.find(".pos-offer-action-btn");
		expect(removeBtn.text()).toContain("Remove");
		await removeBtn.trigger("click");
		expect(wrapper.vm.pos_offers[0]?.offer_applied).toBe(false);

		// 3. Give Item selector renders
		expect(wrapper.find(".pos-offer-give-item").exists()).toBe(true);
	});
});
