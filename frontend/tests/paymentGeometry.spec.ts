import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentMethods from "../src/posapp/components/pos/payments/PaymentMethods.vue";
// @ts-ignore
import PaymentSectionShell from "../src/posapp/components/pos/payments/PaymentSectionShell.vue";

describe("Payment Geometry & Viewport Recovery Contract", () => {
	const samplePayment = [
		{ name: "P1", mode_of_payment: "Cash", amount: 100, default: 1, type: "Cash" },
	];

	it("renders icon-only Set Remaining action on desktop viewportMode", () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayment,
				viewportMode: "desktop",
				currencySymbol: () => "$",
			},
		});

		const remainingBtn = wrapper.find(".payment-use-remaining-btn");
		expect(remainingBtn.exists()).toBe(true);
		expect(remainingBtn.attributes("title")).toBe("Set Remaining");
	});

	it("renders icon-only Set Remaining action on phone viewportMode", () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayment,
				viewportMode: "phone",
				currencySymbol: () => "$",
			},
		});

		const remainingBtn = wrapper.find(".payment-use-remaining-btn");
		expect(remainingBtn.exists()).toBe(true);
		expect(remainingBtn.attributes("aria-label")).toBe("Set Remaining");
	});

	it("renders header-meta slot in PaymentSectionShell for collapsed Grand Total", () => {
		const wrapper = mount(PaymentSectionShell, {
			props: {
				title: "Invoice Summary",
				icon: "mdi-receipt-text-outline",
				collapsible: true,
				expanded: false,
			},
			slots: {
				"header-meta": "<span class='test-total'>$150.00</span>",
			},
		});

		expect(wrapper.find(".test-total").exists()).toBe(true);
		expect(wrapper.text()).toContain("$150.00");
	});
});
