import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Return Settlement Modes", () => {
	it("allows both Cashback and Store as Credit when both settings are enabled on a return invoice", () => {
		const posProfile = ref({
			use_cashback: "1",
			use_customer_credit: "1",
		});
		const invoiceDoc = ref({ is_return: true, customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowCashback.value).toBe(true);
		expect(caps.allowStoreAsCredit.value).toBe(true);
	});

	it("disables Store as Credit on return when customer credit is disabled in POS Profile", () => {
		const posProfile = ref({
			use_cashback: "1",
			use_customer_credit: "0",
		});
		const invoiceDoc = ref({ is_return: true, customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowCashback.value).toBe(true);
		expect(caps.allowStoreAsCredit.value).toBe(false);
	});

	it("disables Cashback on return when use_cashback is disabled in POS Profile", () => {
		const posProfile = ref({
			use_cashback: "0",
			use_customer_credit: "1",
		});
		const invoiceDoc = ref({ is_return: true, customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowCashback.value).toBe(false);
		expect(caps.allowStoreAsCredit.value).toBe(true);
	});
});
