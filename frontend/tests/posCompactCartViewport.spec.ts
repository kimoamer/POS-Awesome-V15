import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Pos from "../src/posapp/components/pos/shell/Pos.vue";
import Invoice from "../src/posapp/components/pos/Invoice.vue";
import InvoiceActionButtons from "../src/posapp/components/pos/invoice/InvoiceActionButtons.vue";

describe("Compact Cart Viewport Recovery & Structure", () => {
	it("renders single Pay button entry on compact Cart via global navigation footer", async () => {
		const pinia = createPinia();
		setActivePinia(pinia);
		const eventBus = { on: () => {}, off: () => {}, emit: () => {} };

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
