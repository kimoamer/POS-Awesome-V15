import { describe, expect, it } from "vitest";

import invoiceSource from "../src/posapp/components/pos/Invoice.vue?raw";
import customerSource from "../src/posapp/components/pos/customer/Customer.vue?raw";
import itemCardSource from "../src/posapp/components/pos/invoice/InvoiceItemCard.vue?raw";
import toolbarSource from "../src/posapp/components/pos/invoice/InvoiceItemsActionToolbar.vue?raw";

describe("Mobile cart customer and search controls", () => {
	it("lets the customer toolbar grow when loading progress is visible", () => {
		expect(customerSource).toContain("customer-input-wrapper--loading");
		expect(customerSource).toContain(
			"min-height: var(--customer-control-height)",
		);
		expect(customerSource).toContain("height: auto;");
		expect(customerSource).toContain("--customer-action-size: 48px");
	});

	it("keeps compact cart regions spaced for phone and tablet layouts", () => {
		expect(invoiceSource).toContain(
			".invoice-workspace--compact .invoice-customer-region",
		);
		expect(invoiceSource).toContain("align-items: flex-start;");
		expect(invoiceSource).toContain("min-height: auto !important;");
		expect(invoiceSource).toContain("padding: 6px 10px 8px !important;");
	});

	it("uses a mobile search mode instead of squeezing controls beside the search field", () => {
		expect(toolbarSource).toContain("invoice-items-toolbar--mobile");
		expect(toolbarSource).toContain('__("Search or scan barcode...")');
		expect(toolbarSource).toContain("showDirectViewToggle");
		expect(toolbarSource).toContain("width < 680");
		expect(toolbarSource).toContain(
			'actions.push("view-list", "view-table")',
		);
	});

	it("keeps phone item cards visually framed with a separated rate row", () => {
		expect(itemCardSource).toContain(
			"border: 1px solid var(--pos-border-light",
		);
		expect(itemCardSource).toContain("box-shadow: 0 8px 24px");
		expect(itemCardSource).toContain(
			".invoice-item-card--phone .invoice-item-card__rate",
		);
		expect(itemCardSource).toContain(
			"border-top: 1px solid var(--pos-border-light",
		);
	});
});
