import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Gift Card Feature Gates", () => {
	it("disables allowGiftCards capability when POS Profile posa_use_gift_cards is 0", () => {
		const posProfile = ref({ posa_use_gift_cards: "0" });
		const invoiceDoc = ref({ is_return: false });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowGiftCards.value).toBe(false);
	});

	it("enables allowGiftCards capability when POS Profile posa_use_gift_cards is 1 on a normal sale", () => {
		const posProfile = ref({ posa_use_gift_cards: "1" });
		const invoiceDoc = ref({ is_return: false });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowGiftCards.value).toBe(true);
	});

	it("disables allowGiftCards capability on return invoices", () => {
		const posProfile = ref({ posa_use_gift_cards: "1" });
		const invoiceDoc = ref({ is_return: true });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowGiftCards.value).toBe(false);
	});
});
