import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentCustomerCreditDetails from "../src/posapp/components/pos/payments/PaymentCustomerCreditDetails.vue";

describe("Payment Customer Credit UI Contract", () => {
	it("renders source rows and credit fields when customer credit is available and redeemed", () => {
		const wrapper = mount(PaymentCustomerCreditDetails, {
			props: {
				invoiceDoc: { is_return: false, currency: "EGP" },
				availableCustomerCredit: 500,
				redeemCustomerCredit: true,
				customerCreditDict: [
					{ name: "INV-0001", total_credit: 300, credit_to_redeem: 200 },
					{ name: "PAY-0002", total_credit: 200, credit_to_redeem: 100 },
				],
				creditSourceLabel: (row: any) => row.name,
				formatCurrency: (val: number) => `E£ ${val}`,
				currencySymbol: () => "E£",
			},
		});

		expect(wrapper.text()).toContain("INV-0001");
		expect(wrapper.text()).toContain("PAY-0002");
		expect(wrapper.html()).toContain("sleek-field");
	});
});
