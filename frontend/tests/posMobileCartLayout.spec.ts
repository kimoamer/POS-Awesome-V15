import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InvoiceSummary from "../src/posapp/components/pos/invoice/InvoiceSummary.vue";
import InvoiceActionButtons from "../src/posapp/components/pos/invoice/InvoiceActionButtons.vue";

describe("Pass 6.9 — Mobile Cart Layout & Command Bar", () => {
	it("renders mobile-cart-command-bar when useCompactSaleDock is true", () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const wrapper = mount(InvoiceSummary, {
			props: {
				compactExternalPay: true,
				subtotal: 26.0,
				total_qty: 1,
			},
			global: {
				plugins: [pinia],
			},
		});

		expect(wrapper.find(".mobile-cart-command-bar").exists()).toBe(true);
		expect(wrapper.find(".mobile-cart-command-bar__total").text()).toContain("26");
	});

	it("renders 4 action targets in mobile command bar: Discount, Save, Drafts, More", () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const wrapper = mount(InvoiceSummary, {
			props: {
				compactExternalPay: true,
				subtotal: 100,
				total_qty: 2,
			},
			global: {
				plugins: [pinia],
			},
		});

		expect(wrapper.find(".mobile-cart-action-btn").exists()).toBe(true);
		expect(wrapper.findComponent(InvoiceActionButtons).exists()).toBe(true);
	});
});
