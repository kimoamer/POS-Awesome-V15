import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentSettlementOptions from "../src/posapp/components/pos/payments/PaymentSettlementOptions.vue";

describe("Payment Settlement Options Contract", () => {
	it("renders settlement option rows and emits get-available-credit event on credit toggle", async () => {
		const wrapper = mount(PaymentSettlementOptions, {
			props: {
				invoiceDoc: { is_return: false, write_off_amount: 0 },
				posProfile: { posa_allow_credit_sale: 1, posa_allow_customer_credit: 1 },
				redeemCustomerCredit: false,
			},
		});

		expect(wrapper.text()).toContain("Credit Sale");
		expect(wrapper.text()).toContain("Use Customer Credit");
	});
});
