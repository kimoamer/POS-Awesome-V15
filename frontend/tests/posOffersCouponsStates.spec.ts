import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PosOffers from "../src/posapp/components/pos/offers/PosOffers.vue";
import PosCoupons from "../src/posapp/components/pos/offers/PosCoupons.vue";

describe("Offers & Coupons UI States Contract", () => {
	it("PosOffers handles loading, empty, and group item error/retry states", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const wrapper = mount(PosOffers, {
			global: { plugins: [pinia], provide: { eventBus } },
		});

		// 1. Loading state exposes aria-busy
		await wrapper.setData({ loading: true });
		expect(wrapper.attributes("aria-busy")).toBe("true");
		expect(wrapper.find(".pos-offers-loading").exists()).toBe(true);

		// 2. Empty state
		await wrapper.setData({ loading: false, pos_offers: [] });
		expect(wrapper.attributes("aria-busy")).toBe("false");
		expect(wrapper.find(".pos-offers-empty").exists()).toBe(true);

		// 3. Group item error & retry
		await wrapper.setData({
			pos_offers: [
				{
					name: "Buy 1 Get 1",
					apply_on: "Item Group",
					apply_type: "Item Group",
					apply_item_group: "Beverages",
					offer: "Give Product",
					offer_applied: false,
				},
			],
			groupItemError: { Beverages: "Network Error" },
		});

		expect(wrapper.find(".group-item-error").exists()).toBe(true);
		expect(wrapper.find(".group-item-error").text()).toContain("Network Error");

		// Retry button calls fetchGroupItems
		const fetchGroupItemsSpy = vi.spyOn(wrapper.vm, "fetchGroupItems");
		const retryBtn = wrapper.find(".group-item-error button");
		await retryBtn.trigger("click");
		expect(fetchGroupItemsSpy).toHaveBeenCalledWith("Beverages");
	});

	it("PosCoupons handles customer requirement, duplicate submission, and validation error states", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

		const wrapper = mount(PosCoupons, {
			global: { plugins: [pinia], provide: { eventBus } },
		});

		// 1. Coupon without customer performs zero API calls
		const frappeCallSpy = vi.fn();
		(globalThis as any).frappe = { call: frappeCallSpy, _: (s: string) => s };

		await wrapper.setData({ customer: "", new_coupon: "SAVE10" });
		await wrapper.vm.add_coupon("SAVE10");
		expect(frappeCallSpy).not.toHaveBeenCalled();

		// 2. Coupon loading / validating disables duplicate submission
		await wrapper.setData({ customer: "John Doe", new_coupon: "SAVE10", validating: true });
		await wrapper.vm.add_coupon("SAVE10");
		expect(frappeCallSpy).not.toHaveBeenCalled();

		// 3. Validation error state displays aria-live notice
		await wrapper.setData({ validationErrorMessage: "Invalid or expired coupon" });
		const errorNotice = wrapper.find(".pos-coupon-validation-message");
		expect(errorNotice.exists()).toBe(true);
		expect(errorNotice.text()).toContain("Invalid or expired coupon");
		expect(errorNotice.attributes("aria-live")).toBe("polite");
	});
});
