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

	it("disables both return settlement options when profile has both disabled", () => {
		const posProfile = ref({ use_cashback: "0", use_customer_credit: "0" });
		const invoiceDoc = ref({ is_return: true, customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowCashback.value).toBe(false);
		expect(caps.allowStoreAsCredit.value).toBe(false);
	});

	it("disables Gift Cards when posa_use_gift_cards is 0", () => {
		const posProfile = ref({ posa_use_gift_cards: "0" });
		const invoiceDoc = ref({ is_return: false, customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowGiftCards.value).toBe(false);
	});
});
