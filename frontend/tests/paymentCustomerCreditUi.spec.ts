import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentCustomerCreditDetails from "../src/posapp/components/pos/payments/PaymentCustomerCreditDetails.vue";

describe("Payment Customer Credit UI Contract", () => {
	it("renders available balance BEFORE redeem toggle is activated", () => {
		const wrapper = mount(PaymentCustomerCreditDetails, {
			props: {
				invoiceDoc: { is_return: false, currency: "EGP" },
				availableCustomerCredit: 500,
				redeemCustomerCredit: false,
				redeemedCustomerCredit: 0,
				customerCreditDict: [],
				creditSourceLabel: (row: any) => row.name,
				formatCurrency: (val: number) => `E£ ${val}`,
				currencySymbol: () => "E£",
			},
		});

		expect(wrapper.text()).toContain("Customer Credit Available");
		expect(wrapper.text()).toContain("E£ 500");
		expect(wrapper.text()).not.toContain("Credit Sources");
	});

	it("renders applied summary and source breakdown when redeem toggle is activated", () => {
		const wrapper = mount(PaymentCustomerCreditDetails, {
			props: {
				invoiceDoc: { is_return: false, currency: "EGP" },
				availableCustomerCredit: 500,
				redeemCustomerCredit: true,
				redeemedCustomerCredit: 200,
				customerCreditDict: [
					{ name: "INV-0001", total_credit: 300, credit_to_redeem: 200 },
				],
				creditSourceLabel: (row: any) => row.name,
				formatCurrency: (val: number) => `E£ ${val}`,
				currencySymbol: () => "E£",
			},
		});

		expect(wrapper.text()).toContain("Applied Now");
		expect(wrapper.text()).toContain("E£ 200");
		expect(wrapper.text()).toContain("INV-0001");
	});

	it("renders loading, error and empty states correctly", () => {
		const loadingWrapper = mount(PaymentCustomerCreditDetails, {
			props: {
				invoiceDoc: { is_return: false },
				loading: true,
				availableCustomerCredit: 0,
				formatCurrency: (val: number) => `$${val}`,
				currencySymbol: () => "$",
				creditSourceLabel: () => "",
			},
		});
		expect(loadingWrapper.text()).toContain("Loading customer credit balance...");

		const emptyWrapper = mount(PaymentCustomerCreditDetails, {
			props: {
				invoiceDoc: { is_return: false },
				loading: false,
				availableCustomerCredit: 0,
				formatCurrency: (val: number) => `$${val}`,
				currencySymbol: () => "$",
				creditSourceLabel: () => "",
			},
		});
		expect(emptyWrapper.text()).toContain("No customer credit balance available.");

		const errorWrapper = mount(PaymentCustomerCreditDetails, {
			props: {
				invoiceDoc: { is_return: false },
				loading: false,
				errorMessage: "Network error",
				availableCustomerCredit: 0,
				formatCurrency: (val: number) => `$${val}`,
				currencySymbol: () => "$",
				creditSourceLabel: () => "",
			},
		});
		expect(errorWrapper.text()).toContain("Network error");
		expect(errorWrapper.text()).toContain("Retry");
	});
});
