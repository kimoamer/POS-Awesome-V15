import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InvoiceActionButtons from "../src/posapp/components/pos/invoice/InvoiceActionButtons.vue";
import InvoiceSummary from "../src/posapp/components/pos/invoice/InvoiceSummary.vue";

describe("Compact Cart Exact Layout Recovery", () => {
	it("renders dedicated compact-checkout section in InvoiceSummary when useCompactSaleDock is true", () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const wrapper = mount(InvoiceSummary, {
			props: {
				compactExternalPay: true,
				subtotal: 150,
				total_qty: 2,
			},
			global: {
				plugins: [pinia],
			},
		});

		expect(wrapper.find(".compact-checkout").exists()).toBe(true);
		expect(wrapper.find(".summary-hero").exists()).toBe(false);
	});

	it("renders 3 equal columns for secondary actions on compact Cart view", () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const buttonsWrapper = mount(InvoiceActionButtons, {
			props: {
				compactExternalPay: true,
				hasItems: true,
			},
			global: {
				plugins: [pinia],
			},
		});

		// Pay button inside InvoiceActionButtons is hidden when compactExternalPay is true
		expect(buttonsWrapper.find(".invoice-pay-btn").exists()).toBe(false);
		expect(buttonsWrapper.find(".invoice-action-bar--compact").exists()).toBe(true);
		expect(buttonsWrapper.find(".invoice-action-bar__secondary").exists()).toBe(true);
	});

	it("renders primary Pay button inside InvoiceActionButtons on desktop mode", () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const desktopWrapper = mount(InvoiceActionButtons, {
			props: {
				compactExternalPay: false,
				hasItems: true,
			},
			global: {
				plugins: [pinia],
			},
		});

		expect(desktopWrapper.find(".invoice-pay-btn").exists()).toBe(true);
	});
});
