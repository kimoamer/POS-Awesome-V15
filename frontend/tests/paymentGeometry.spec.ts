import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
// @ts-ignore
import Payments from "../src/posapp/components/pos/Payments.vue";
// @ts-ignore
import PaymentMethods from "../src/posapp/components/pos/payments/PaymentMethods.vue";
// @ts-ignore
import PaymentSectionShell from "../src/posapp/components/pos/payments/PaymentSectionShell.vue";

describe("Payment Geometry & Viewport Recovery Contract", () => {
	const samplePayment = [
		{ name: "P1", mode_of_payment: "Cash", amount: 100, default: 1, type: "Cash" },
	];

	it("renders icon-only Set Remaining action on desktop viewportMode", () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayment,
				viewportMode: "desktop",
				currencySymbol: () => "$",
			},
		});

		const remainingBtn = wrapper.find(".payment-use-remaining-btn");
		expect(remainingBtn.exists()).toBe(true);
		expect(remainingBtn.attributes("title")).toBe("Set Remaining");
	});

	it("renders icon-only Set Remaining action on phone viewportMode", () => {
		const wrapper = mount(PaymentMethods, {
			props: {
				payments: samplePayment,
				viewportMode: "phone",
				currencySymbol: () => "$",
			},
		});

		const remainingBtn = wrapper.find(".payment-use-remaining-btn");
		expect(remainingBtn.exists()).toBe(true);
		expect(remainingBtn.attributes("aria-label")).toBe("Set Remaining");
	});

	it("renders header-meta slot in PaymentSectionShell even for zero Grand Total", () => {
		const wrapper = mount(PaymentSectionShell, {
			props: {
				title: "Invoice Summary",
				icon: "mdi-receipt-text-outline",
				collapsible: true,
				expanded: false,
			},
			slots: {
				"header-meta": "<span class='test-total'>E£ 0.00</span>",
			},
		});

		expect(wrapper.find(".test-total").exists()).toBe(true);
		expect(wrapper.text()).toContain("E£ 0.00");
	});

	it("displays zero Grand Total in Payments.vue collapsed Invoice Summary header", () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const wrapper = mount(Payments, {
			global: {
				plugins: [pinia],
				stubs: {
					PaymentScreenHeader: true,
					PaymentSummary: true,
					PaymentMethods: true,
					InvoiceTotals: true,
					PaymentActionButtons: true,
				},
			},
			props: {
				viewportMode: "phone",
			},
			data() {
				return {
					invoice_doc: {
						grand_total: 0,
						currency: "EGP",
						payments: [],
					},
					invoiceSummaryExpanded: false,
				};
			},
		});

		const headerTotal = wrapper.find(".payment-section-header-total");
		expect(headerTotal.exists()).toBe(true);
		expect(headerTotal.text()).toContain("0.00");
	});
});
