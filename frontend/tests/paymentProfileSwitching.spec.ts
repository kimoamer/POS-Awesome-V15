import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Profile Switching Lifecycle", () => {
	it("correctly re-evaluates all capabilities when posProfile value changes reactively", () => {
		const posProfile = ref({
			posa_allow_credit_sale: "1",
			use_customer_credit: "1",
			posa_use_gift_cards: "1",
		});
		const invoiceDoc = ref({ customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowCreditSale.value).toBe(true);
		expect(caps.allowCustomerCredit.value).toBe(true);
		expect(caps.allowGiftCards.value).toBe(true);

		// Switch to minimal profile
		posProfile.value = {
			posa_allow_credit_sale: "0",
			use_customer_credit: "0",
			posa_use_gift_cards: "0",
		};

		expect(caps.allowCreditSale.value).toBe(false);
		expect(caps.allowCustomerCredit.value).toBe(false);
		expect(caps.allowGiftCards.value).toBe(false);
	});
});
