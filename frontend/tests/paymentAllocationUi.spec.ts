import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentMethods from "../src/posapp/components/pos/payments/PaymentMethods.vue";

describe("Payment Allocation & Quick Denominations Contract", () => {
	const samplePayments = [
		{ name: "P1", mode_of_payment: "Cash", amount: 50, default: 1, type: "Cash" },
	];

	it("renders denomination quick buttons and emits set-denomination when clicked", async () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayments,
				isCashLikePayment: () => true,
				getVisibleDenominations: () => [50, 100, 200],
				currencySymbol: () => "$",
			},
		});

		const denominationBtns = wrapper.findAll(".payment-denominations__btn");
		expect(denominationBtns.length).toBe(3);

		await denominationBtns[1].trigger("click");

		const emitted = wrapper.emitted("set-denomination");
		expect(emitted).toBeTruthy();
		expect(emitted![0]).toEqual([samplePayments[0], 100]);
	});

	it("renders M-Pesa action button and emits mpesa-dialog when clicked", async () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayments,
				isMpesaC2bPayment: () => true,
				currencySymbol: () => "$",
			},
		});

		const actionBtn = wrapper.find(".payment-method-action-btn--success");
		expect(actionBtn.exists()).toBe(true);
		expect(actionBtn.text()).toContain("Get Payments");

		await actionBtn.trigger("click");
		expect(wrapper.emitted("mpesa-dialog")).toBeTruthy();
	});

	it("renders Gift Card Redeem button and emits open-gift-card when clicked", async () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayments,
				isGiftCardPayment: () => true,
				currencySymbol: () => "$",
			},
		});

		const actionBtn = wrapper.find(".payment-method-action-btn");
		expect(actionBtn.text()).toContain("Redeem / Scan");

		await actionBtn.trigger("click");
		expect(wrapper.emitted("open-gift-card")).toBeTruthy();
	});
});
