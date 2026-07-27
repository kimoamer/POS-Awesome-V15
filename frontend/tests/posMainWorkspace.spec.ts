import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePosRuntimeCapabilities } from "../src/posapp/composables/pos/usePosRuntimeCapabilities";

describe("POS Main Workspace Integration", () => {
	it("evaluates main workspace capabilities for full vs minimal profiles", () => {
		const fullProfile = ref({
			posa_allow_product_search: "1",
			posa_display_items_in_stock: "1",
			posa_allow_user_to_edit_rate: "1",
			posa_allow_user_to_edit_discount: "1",
			posa_allow_discount_on_grand_total: "1",
			posa_allow_coupon_code: "1",
			use_customer_credit: "1",
		});
		const invoiceDoc = ref({ customer: "CUST-001", is_return: false });

		const caps = usePosRuntimeCapabilities({ posProfile: fullProfile, invoiceDoc });

		expect(caps.products.allowStockDisplay.value).toBe(true);
		expect(caps.products.allowRateChange.value).toBe(true);
		expect(caps.products.allowDiscount.value).toBe(true);
		expect(caps.cart.allowOrderDiscount.value).toBe(true);
		expect(caps.cart.allowCoupon.value).toBe(true);
		expect(caps.customer.allowCredit.value).toBe(true);
	});

	it("disables rate and discount editing for return invoices", () => {
		const fullProfile = ref({
			posa_allow_user_to_edit_rate: "1",
			posa_allow_user_to_edit_discount: "1",
		});
		const returnInvoice = ref({ customer: "CUST-001", is_return: true });

		const caps = usePosRuntimeCapabilities({ posProfile: fullProfile, invoiceDoc: returnInvoice });

		expect(caps.products.allowRateChange.value).toBe(false);
		expect(caps.products.allowDiscount.value).toBe(false);
	});
});
