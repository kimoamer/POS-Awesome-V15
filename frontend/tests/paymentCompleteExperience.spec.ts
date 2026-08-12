import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import InvoiceTotals from "../src/posapp/components/pos/payments/InvoiceTotals.vue";

describe("Payment Complete Experience Contract", () => {
	it("renders net invoice summary totals formatted with currency", () => {
		const wrapper = mount(InvoiceTotals, {
			props: {
				invoice_doc: {
					net_total: 1000,
					total_taxes_and_charges: 0,
					total: 1000,
					grand_total: 1000,
				},
				formatCurrency: (val: number) => `E£ ${val}.00`,
			},
		});

		expect(wrapper.text()).toContain("E£ 1000.00");
	});
});
