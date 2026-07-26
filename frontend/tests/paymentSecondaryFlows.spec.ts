import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import InvoiceTotals from "../src/posapp/components/pos/payments/InvoiceTotals.vue";
// @ts-ignore
import PaymentRedemption from "../src/posapp/components/pos/payments/PaymentRedemption.vue";

describe("Payment Secondary Flows & Invoice Summary Contract", () => {
	it("renders Net Total, Tax, Total, and Grand Total rows in InvoiceTotals", () => {
		const invoiceDoc = {
			net_total: 100,
			total_taxes_and_charges: 15,
			total: 115,
			grand_total: 115,
			currency: "EGP",
		};

		const wrapper = mount(InvoiceTotals, {
			props: {
				invoice_doc: invoiceDoc,
				displayCurrency: "EGP",
				formatCurrency: (val: number) => `E£ ${val.toFixed(2)}`,
			},
		});

		expect(wrapper.text()).toContain("Net Total");
		expect(wrapper.text()).toContain("Tax and Charges");
		expect(wrapper.text()).toContain("Grand Total");
		expect(wrapper.text()).toContain("E£ 115.00");
	});

	it("renders compact empty state when customer has 0 loyalty points in PaymentRedemption", () => {
		const wrapper = mount(PaymentRedemption, {
			props: {
				invoiceDoc: { is_return: false, currency: "EGP" },
				customerInfo: { loyalty_points: 0 },
				formatCurrency: (val: number) => `$${val}`,
				formatFloat: (val: number) => `${val}`,
				currencySymbol: () => "$",
			},
		});

		expect(wrapper.text()).toContain("No loyalty points available");
	});
});
