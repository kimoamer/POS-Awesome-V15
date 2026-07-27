import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePosRuntimeCapabilities } from "../src/posapp/composables/pos/usePosRuntimeCapabilities";

describe("POS Profile Full Lifecycle Runtime", () => {
	it("correctly evaluates full profile vs minimal profile across all feature sections", () => {
		const fullProfile = ref({
			posa_allow_product_search: "1",
			posa_allow_barcode_search: "1",
			posa_display_items_in_stock: "1",
			posa_allow_user_to_edit_warehouse: "1",
			posa_allow_user_to_edit_rate: "1",
			posa_allow_user_to_edit_discount: "1",
			posa_allow_discount_on_grand_total: "1",
			posa_allow_coupon_code: "1",
			posa_allow_credit_sale: "1",
			posa_allow_write_off_change: "1",
			use_cashback: "1",
			use_customer_credit: "1",
			posa_use_gift_cards: "1",
			posa_allow_sales_order: "1",
			posa_allow_select_print_format_in_payments: "1",
			payments: [
				{ mode_of_payment: "Cash", type: "Cash", default: 1 },
				{ mode_of_payment: "M-Pesa", is_mpesa_c2b: 1 },
				{ mode_of_payment: "Phone", request_for_payment: 1 },
			],
		});
		const invoiceDoc = ref({ customer: "CUST-001", is_return: false });
		const caps = usePosRuntimeCapabilities({ posProfile: fullProfile, invoiceDoc });

		expect(caps.products.allowItemGroups.value).toBe(true);
		expect(caps.products.allowRateChange.value).toBe(true);
		expect(caps.cart.allowOrderDiscount.value).toBe(true);
		expect(caps.cart.allowCoupon.value).toBe(true);
		expect(caps.customer.allowCredit.value).toBe(true);
		expect(caps.fulfillment.allowSalesOrder.value).toBe(true);
		expect(caps.payment.allowCreditSale.value).toBe(true);
		expect(caps.payment.allowWriteOff.value).toBe(true);
		expect(caps.payment.allowGiftCards.value).toBe(true);
		expect(caps.payment.allowMpesa.value).toBe(true);
		expect(caps.payment.allowPhoneRequest.value).toBe(true);
		expect(caps.payment.allowPrintFormat.value).toBe(true);
	});

	it("disables optional capabilities on a minimal profile", () => {
		const minimalProfile = ref({
			posa_allow_product_search: "0",
			posa_allow_user_to_edit_rate: "0",
			posa_allow_user_to_edit_discount: "0",
			posa_allow_discount_on_grand_total: "0",
			posa_allow_coupon_code: "0",
			posa_allow_credit_sale: "0",
			posa_allow_write_off_change: "0",
			use_cashback: "0",
			use_customer_credit: "0",
			posa_use_gift_cards: "0",
			posa_allow_sales_order: "0",
			posa_allow_select_print_format_in_payments: "0",
			payments: [{ mode_of_payment: "Cash", type: "Cash", default: 1 }],
		});
		const invoiceDoc = ref({ customer: "CUST-001", is_return: false });
		const caps = usePosRuntimeCapabilities({ posProfile: minimalProfile, invoiceDoc });

		expect(caps.products.allowRateChange.value).toBe(false);
		expect(caps.cart.allowOrderDiscount.value).toBe(false);
		expect(caps.cart.allowCoupon.value).toBe(false);
		expect(caps.customer.allowCredit.value).toBe(false);
		expect(caps.fulfillment.allowSalesOrder.value).toBe(false);
		expect(caps.payment.allowCreditSale.value).toBe(false);
		expect(caps.payment.allowWriteOff.value).toBe(false);
		expect(caps.payment.allowGiftCards.value).toBe(false);
		expect(caps.payment.allowMpesa.value).toBe(false);
		expect(caps.payment.allowPhoneRequest.value).toBe(false);
		expect(caps.payment.allowPrintFormat.value).toBe(false);
	});
});
