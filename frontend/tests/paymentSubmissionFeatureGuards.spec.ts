import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Submission Feature Guards", () => {
	it("blocks Credit Sale submission when capability is disabled", () => {
		const posProfile = ref({ posa_allow_credit_sale: "0" });
		const invoiceDoc = ref({ customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowCreditSale.value).toBe(false);
	});

	it("blocks Write Off submission when capability is disabled", () => {
		const posProfile = ref({ posa_allow_write_off_change: "0" });
		const invoiceDoc = ref({ customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowWriteOff.value).toBe(false);
	});

	it("blocks Customer Credit redemption when capability is disabled", () => {
		const posProfile = ref({ use_customer_credit: "0" });
		const invoiceDoc = ref({ customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowCustomerCredit.value).toBe(false);
	});
});
