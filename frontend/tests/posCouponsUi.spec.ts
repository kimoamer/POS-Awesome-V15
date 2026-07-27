import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PosCoupons from "../src/posapp/components/pos/offers/PosCoupons.vue";
import { createPinia, setActivePinia } from "pinia";
import { useUIStore } from "../src/posapp/stores/uiStore";

describe("PosCoupons Component Integration", () => {
	it("renders coupons workspace, customer notice, input bar, and handles back action", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const uiStore = useUIStore();

		const eventBus = {
			on: () => {},
			off: () => {},
			emit: () => {},
		};

		const wrapper = mount(PosCoupons, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
			},
		});

		expect(wrapper.find(".pos-coupons-container").exists()).toBe(true);
		expect(wrapper.find(".pos-coupons-customer-bar").exists()).toBe(true);
		expect(wrapper.find(".coupon-input").exists()).toBe(true);

		const backBtn = wrapper.find(".pos-coupons-back-btn");
		expect(backBtn.exists()).toBe(true);
		await backBtn.trigger("click");
		expect(uiStore.activeView).toBe("items");
	});

	it("Valid coupon calls exact API method and duplicate coupon performs zero new API calls", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const eventBus = {
			on: () => {},
			off: () => {},
			emit: () => {},
		};

		const frappeCallSpy = vi.fn();
		(globalThis as any).frappe = {
			call: frappeCallSpy,
			_: (s: string) => s,
		};

		const wrapper = mount(PosCoupons, {
			global: {
				plugins: [pinia],
				provide: { eventBus },
			},
		});

		await wrapper.setData({ customer: "Jane Doe", pos_profile: { company: "Test Co" } });

		// 1. Valid coupon calls exact API
		await wrapper.vm.add_coupon("WELCOME10");
		expect(frappeCallSpy).toHaveBeenCalledTimes(1);
		expect(frappeCallSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				method: "posawesome.posawesome.api.offers.get_pos_coupon",
				args: {
					coupon: "WELCOME10",
					customer: "Jane Doe",
					company: "Test Co",
				},
			}),
		);

		// 2. Duplicate Coupon performs zero new API calls
		await wrapper.setData({
			posa_coupons: [{ coupon_code: "WELCOME10", coupon: "CPN-001", applied: 0 }],
		});

		frappeCallSpy.mockClear();
		await wrapper.vm.add_coupon("WELCOME10");
		expect(frappeCallSpy).not.toHaveBeenCalled();
	});
});
