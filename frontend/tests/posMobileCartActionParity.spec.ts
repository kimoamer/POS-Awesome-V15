import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InvoiceActionButtons from "../src/posapp/components/pos/invoice/InvoiceActionButtons.vue";

describe("Pass 6.9 — Mobile Cart Action Parity", () => {
	it("renders dynamic actions in More menu responding to POS Profile configuration", () => {
		const pinia = createPinia();
		setActivePinia(pinia);

		const wrapper = mount(InvoiceActionButtons, {
			props: {
				compactExternalPay: true,
				hasItems: true,
				pos_profile: {
					posa_allow_sales_order: 1,
					posa_allow_returns: 1,
					posa_allow_customer_display: 1,
				},
			},
			global: {
				plugins: [pinia],
			},
		});

		expect(wrapper.find(".invoice-action-btn--more").exists()).toBe(true);
	});
});
