import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

// @ts-ignore
import PaymentSummary from "../src/posapp/components/pos/payments/PaymentSummary.vue";
// @ts-ignore
import InvoiceTotals from "../src/posapp/components/pos/payments/InvoiceTotals.vue";
// @ts-ignore
import PaymentMethods from "../src/posapp/components/pos/payments/PaymentMethods.vue";

describe("Payment Runtime Stability & Formatter Contract", () => {
	it("renders PaymentSummary safely when currency or invoiceDoc is undefined without throwing", () => {
		expect(() => {
			const wrapper = mount(PaymentSummary, {
				props: {
					invoice_doc: { grand_total: 100 },
					total_payments_display: "100.00",
					diff_payment_display: "0.00",
					currencySymbol: () => "",
					formatCurrency: (v: any) => String(v),
				},
			});
			expect(wrapper.exists()).toBe(true);
		}).not.toThrow();
	});

	it("renders InvoiceTotals safely with undefined currency without throwing undefined '-' error", () => {
		expect(() => {
			const wrapper = mount(InvoiceTotals, {
				props: {
					invoice_doc: {
						net_total: 100,
						total_taxes_and_charges: 10,
						total: 110,
						grand_total: 110,
						currency: undefined,
					},
					itemDiscountTotal: 0,
					currencySymbol: () => "",
					formatCurrency: (v: any) => String(v),
				},
			});
			expect(wrapper.text()).toContain("Net Total");
		}).not.toThrow();
	});

	it("renders PaymentMethods safely with raw numeric amount input", () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: [{ mode_of_payment: "Cash", amount: 50 }],
				currency: "EGP",
				isReturn: false,
				currencySymbol: (c: string) => (c === "EGP" ? "LE" : "$"),
				formatCurrency: (v: any) => String(v),
				isNumber: () => true,
				getVisibleDenominations: () => [],
				isCashLikePayment: () => true,
				isMpesaC2bPayment: () => false,
				isGiftCardPayment: () => false,
			},
		});

		expect(wrapper.find("input").element.value).toBe("50");
	});
});
