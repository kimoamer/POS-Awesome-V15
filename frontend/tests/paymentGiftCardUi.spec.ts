import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentGiftCardSection from "../src/posapp/components/pos/payments/PaymentGiftCardSection.vue";

describe("Payment Gift Card UI Contract", () => {
	it("renders cashier actions for card redemption", () => {
		const wrapper = mount(PaymentGiftCardSection, {
			props: {
				enabled: true,
				expanded: true,
				appliedAmount: 0,
				cardCode: "GC-100",
				redeemAmount: 50,
				balance: 100,
				status: "Active",
				formatCurrency: (val: number) => `$${val}`,
			},
		});

		expect(wrapper.text()).toContain("Gift Card Code");
		expect(wrapper.text()).toContain("Check Balance");
		expect(wrapper.text()).toContain("Apply Gift Card");
	});
});
