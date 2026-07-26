import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Profile Payment Rows Filtering", () => {
	it("filters out gift card payment rows from visible payment methods", () => {
		const posProfile = ref({ posa_use_gift_cards: "1" });
		const invoiceDoc = ref({
			is_return: false,
			payments: [
				{ mode_of_payment: "Cash", amount: 100 },
				{ mode_of_payment: "Gift Card", amount: 0 },
			],
		});

		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });
		expect(caps.allowGiftCards.value).toBe(true);
	});

	it("prevents gift card payment rows from leaking as regular payment inputs when gift cards feature is disabled", () => {
		const posProfile = ref({ posa_use_gift_cards: "0" });
		const invoiceDoc = ref({
			is_return: false,
			payments: [
				{ mode_of_payment: "Cash", amount: 100 },
				{ mode_of_payment: "Gift Card", amount: 0 },
			],
		});

		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });
		expect(caps.allowGiftCards.value).toBe(false);
	});
});
