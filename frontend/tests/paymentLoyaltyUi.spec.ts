import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentRedemption from "../src/posapp/components/pos/payments/PaymentRedemption.vue";

describe("Payment Loyalty Points UI Contract", () => {
	it("renders redeem input fields when customer has points", () => {
		const wrapper = mount(PaymentRedemption, {
			props: {
				invoiceDoc: { is_return: false, currency: "EGP" },
				customerInfo: { loyalty_points: 1250 },
				availablePointsAmount: 125,
				loyaltyAmount: 50,
				formatCurrency: (val: number) => `E£ ${val}`,
				formatFloat: (val: number) => `${val}`,
				currencySymbol: () => "E£",
			},
		});

		expect(wrapper.text()).toContain("Redeem Loyalty Points");
		expect(wrapper.text()).toContain("1250 pts");
	});

	it("shows empty state when customer points are zero", () => {
		const wrapper = mount(PaymentRedemption, {
			props: {
				invoiceDoc: { is_return: false, currency: "EGP" },
				customerInfo: { loyalty_points: 0 },
				formatCurrency: (val: number) => `E£ ${val}`,
				formatFloat: (val: number) => `${val}`,
				currencySymbol: () => "E£",
			},
		});

		expect(wrapper.text()).toContain("No loyalty points available for this customer.");
	});
});
