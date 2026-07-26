import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentOptions from "../src/posapp/components/pos/payments/PaymentOptions.vue";

describe("Payment Settlement Options Contract", () => {
	it("renders Credit Sale switch when posa_allow_credit_sale setting is true", () => {
		const wrapper = mount(PaymentOptions, {
			props: {
				invoiceDoc: { is_return: false },
				posProfile: { posa_allow_credit_sale: 1 },
				formatCurrency: (val: number) => `$${val}`,
			},
		});

		expect(wrapper.text()).toContain("Credit Sale");
	});

	it("does not render Credit Sale when posa_allow_credit_sale setting is 0 or false", () => {
		const wrapper = mount(PaymentOptions, {
			props: {
				invoiceDoc: { is_return: false },
				posProfile: { posa_allow_credit_sale: 0 },
				formatCurrency: (val: number) => `$${val}`,
			},
		});

		expect(wrapper.text()).not.toContain("Credit Sale");
	});

	it("renders Write Off Difference row when enabled and difference is positive", () => {
		const wrapper = mount(PaymentOptions, {
			props: {
				invoiceDoc: { is_return: false },
				posProfile: { posa_allow_write_off_change: true },
				diffPayment: 2.5,
				formatCurrency: (val: number) => `$${val}`,
			},
		});

		expect(wrapper.text()).toContain("Write Off Difference");
	});

	it("renders Customer Balance option when posa_use_customer_credit setting is true", () => {
		const wrapper = mount(PaymentOptions, {
			props: {
				invoiceDoc: { is_return: false },
				posProfile: { posa_use_customer_credit: 1 },
				availableCustomerCredit: 450,
				formatCurrency: (val: number) => `$${val}`,
			},
		});

		expect(wrapper.text()).toContain("Use Customer Balance");
		expect(wrapper.text()).toContain("Available");
	});
});
