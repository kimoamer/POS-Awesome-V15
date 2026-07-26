import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentMethods from "../src/posapp/components/pos/payments/PaymentMethods.vue";

describe("PaymentMethods Presentation & Emits Contract", () => {
	const samplePayments = [
		{ name: "P1", mode_of_payment: "Cash", amount: 100, default: 1, type: "Cash" },
		{ name: "P2", mode_of_payment: "Credit Card", amount: 0, default: 0, type: "Bank" },
	];

	it("renders allocation feedback strip with Paid and Remaining amounts", () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayments,
				totalPaid: 100,
				differenceAmount: 50,
				currencySymbol: () => "$",
			},
		});

		const strip = wrapper.find(".payment-allocation-strip");
		expect(strip.exists()).toBe(true);
		expect(wrapper.text()).toContain("Paid");
		expect(wrapper.text()).toContain("Remaining");
	});

	it("emits set-full-amount with payment and isReturn when Set Remaining button clicked", async () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayments,
				isReturn: false,
				currencySymbol: () => "$",
			},
		});

		const primaryBtn = wrapper.find(".payment-method-action-btn");
		await primaryBtn.trigger("click");

		const emitted = wrapper.emitted("set-full-amount");
		expect(emitted).toBeTruthy();
		expect(emitted![0]).toEqual([samplePayments[0], false]);
	});

	it("emits update-amount with 0 when clear button clicked", async () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayments,
				currencySymbol: () => "$",
			},
		});

		const clearBtn = wrapper.find(".payment-clear-btn");
		expect(clearBtn.exists()).toBe(true);
		await clearBtn.trigger("click");

		const emitted = wrapper.emitted("update-amount");
		expect(emitted).toBeTruthy();
		expect(emitted![0]).toEqual([samplePayments[0], 0]);
	});

	it("disables controls and buttons when loading is true", () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayments,
				loading: true,
				currencySymbol: () => "$",
			},
		});

		const actionBtn = wrapper.find(".payment-method-action-btn");
		expect((actionBtn.element as HTMLButtonElement).disabled).toBe(true);
	});
});
