import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

// @ts-ignore
import PaymentSummary from "../src/posapp/components/pos/payments/PaymentSummary.vue";
// @ts-ignore
import InvoiceTotals from "../src/posapp/components/pos/payments/InvoiceTotals.vue";

describe("Payment Money Display Formatting Contract", () => {
	it("renders single currency symbol in PaymentSummary without duplication", () => {
		const wrapper = mount(PaymentSummary, {
			props: {
				invoice_doc: { currency: "EGP" },
				total_payments_display: "150.00",
				diff_payment_display: "0.00",
				currencySymbol: (c: string) => (c === "EGP" ? "EGP" : "$"),
			},
		});

		const text = wrapper.text();
		// EGP should not be duplicated as EGP EGP 150.00
		const symbolOccurrences = (text.match(/EGP/g) || []).length;
		expect(symbolOccurrences).toBeLessThanOrEqual(2); // 1 for paid, 1 for diff
	});

	it("renders single currency symbol in InvoiceTotals without duplication", () => {
		const wrapper = mount(InvoiceTotals, {
			props: {
				invoice_doc: {
					currency: "USD",
					net_total: 100,
					total_taxes_and_charges: 15,
					total: 115,
					grand_total: 115,
				},
				itemDiscountTotal: 0,
				currencySymbol: () => "$",
				formatCurrency: (v: number) => `$ ${v.toFixed(2)}`,
			},
		});

		expect(wrapper.text()).toContain("$ 100.00");
		expect(wrapper.text()).not.toContain("$ $");
	});
});
