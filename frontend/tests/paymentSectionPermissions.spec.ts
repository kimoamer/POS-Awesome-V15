import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Section Permissions & POS Profile Matrix", () => {
	it("renders Settlement Options when at least one child feature is enabled", () => {
		const posProfile = ref({
			posa_allow_credit_sale: 0,
			posa_allow_write_off_change: 0,
			use_cashback: 0,
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

		expect(capabilities.showCreditSale.value).toBe(false);
		expect(capabilities.showWriteOff.value).toBe(false);
		expect(capabilities.showCashback.value).toBe(false);
		expect(capabilities.showStoreAsCredit.value).toBe(true);
		expect(capabilities.showSettlementOptions.value).toBe(true);
	});

	it("renders Order & Fulfillment section when purchase order or delivery date is enabled", () => {
		const posProfile = ref({
			posa_allow_customer_purchase_order: 1,
		});

		const invoiceDoc = ref({
			is_return: 0,
		});

		const capabilities = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
		});

		expect(capabilities.showPurchaseOrder.value).toBe(true);
		expect(capabilities.showOrderDetails.value).toBe(true);
	});
});
