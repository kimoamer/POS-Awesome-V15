import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Feature Parity & Capabilities Matrix Contract", () => {
	it("normalizes boolean settings correctly for 0/1, true/false, and string flags", () => {
		const posProfile = ref({
			posa_use_gift_cards: "1",
			posa_allow_credit_sale: 1,
			posa_allow_write_off_change: "true",
			use_cashback: true,
			use_customer_credit: "0",
			posa_allow_sales_order: "1",
			posa_enable_return_validity: 0,
			posa_display_additional_notes: 1,
			posa_display_authorization_code: "1",
			posa_allow_customer_purchase_order: 1,
			posa_allow_select_print_format_in_payments: "1",
		});

		const invoiceDoc = ref({
			is_return: 0,
			customer: "CUST-001",
		});

		const customerInfo = ref({
			loyalty_points: 50,
		});

		const capabilities = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
			customerInfo,
		});

		expect(capabilities.showGiftCards.value).toBe(true);
		expect(capabilities.showCreditSale.value).toBe(true);
		expect(capabilities.showWriteOff.value).toBe(true);
		expect(capabilities.showCashback.value).toBe(true);
		expect(capabilities.showCustomerCreditRedemption.value).toBe(false);
		expect(capabilities.showLoyaltyRedemption.value).toBe(true);
		expect(capabilities.showRedemptionSection.value).toBe(true);
		expect(capabilities.showSettlementOptions.value).toBe(true);
		expect(capabilities.showOrderDetails.value).toBe(true);
		expect(capabilities.showSalesAndReceiptDetails.value).toBe(true);
	});

	it("prevents circular dependency on Customer Credit redemption section visibility", () => {
		const posProfile = ref({
			use_customer_credit: 1,
		});

		const invoiceDoc = ref({
			is_return: 0,
			customer: "CUST-001",
		});

		const capabilities = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
		});

		// Customer Credit redemption section MUST be visible even when redeem_customer_credit is false!
		expect(capabilities.showCustomerCreditRedemption.value).toBe(true);
		expect(capabilities.showRedemptionSection.value).toBe(true);
	});
});
