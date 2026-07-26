import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import InvoiceTotals from "../src/posapp/components/pos/payments/InvoiceTotals.vue";

describe("Payment Complete Experience Contract", () => {
	it("renders net invoice summary totals formatted with currency", () => {
		const wrapper = mount(InvoiceTotals, {
			props: {
				grandTotal: 1000,
				totalPaid: 1000,
				paidAmount: 1000,
				formatCurrency: (val: number) => `E£ ${val}.00`,
			},
		});

		expect(wrapper.text()).toContain("E£ 1000.00");
	});
});
