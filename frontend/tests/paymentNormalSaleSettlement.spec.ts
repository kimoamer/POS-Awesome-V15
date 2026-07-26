import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Normal Sale Settlement Capabilities", () => {
	it("ensures normal sales show payment methods even when use_cashback is 0", () => {
		const posProfile = ref({ use_cashback: "0" });
		const invoiceDoc = ref({ is_return: false, grand_total: 500 });
		const isCashback = ref(false);
		const isCreditSale = ref(false);

		const caps = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
			isCashback,
			isCreditSale,
		});

		expect(caps.showPaymentMethods.value).toBe(true);
		expect(caps.showImmediateSettlement.value).toBe(true);
	});

	it("ensures normal sales show payment methods when use_cashback is 1", () => {
		const posProfile = ref({ use_cashback: "1" });
		const invoiceDoc = ref({ is_return: false, grand_total: 500 });
		const isCashback = ref(true);
		const isCreditSale = ref(false);

		const caps = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
			isCashback,
			isCreditSale,
		});

		expect(caps.showPaymentMethods.value).toBe(true);
	});

	it("hides immediate payment methods when isCreditSale is true on a normal sale", () => {
		const posProfile = ref({ use_cashback: "1", posa_allow_credit_sale: "1" });
		const invoiceDoc = ref({ is_return: false, grand_total: 500 });
		const isCashback = ref(true);
		const isCreditSale = ref(true);

		const caps = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
			isCashback,
			isCreditSale,
		});

		expect(caps.showPaymentMethods.value).toBe(false);
	});
});
