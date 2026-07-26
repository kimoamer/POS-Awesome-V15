import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Feature Lifecycle Capabilities", () => {
	it("evaluates boolean matrix for POS Profile settings correctly", () => {
		const disabledValues = [0, "0", false, "false", null, undefined];
		const enabledValues = [1, "1", true, "true"];

		disabledValues.forEach((val) => {
			const posProfile = ref({ posa_allow_credit_sale: val });
			const invoiceDoc = ref({ customer: "CUST-001" });
			const caps = usePaymentUiCapabilities({
				posProfile,
				invoiceDoc,
			});
			expect(caps.allowCreditSale.value).toBe(false);
		});

		enabledValues.forEach((val) => {
			const posProfile = ref({ posa_allow_credit_sale: val });
			const invoiceDoc = ref({ customer: "CUST-001" });
			const caps = usePaymentUiCapabilities({
				posProfile,
				invoiceDoc,
			});
			expect(caps.allowCreditSale.value).toBe(true);
		});
	});

	it("gates Loyalty purely on customer loyalty points eligibility", () => {
		const posProfile = ref({});
		const invoiceDoc = ref({ is_return: false });

		const noPointsCaps = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
			customerInfo: ref({ loyalty_points: 0 }),
		});
		expect(noPointsCaps.allowLoyaltyRedemption.value).toBe(false);

		const withPointsCaps = usePaymentUiCapabilities({
			posProfile,
			invoiceDoc,
			customerInfo: ref({ loyalty_points: 150 }),
		});
		expect(withPointsCaps.allowLoyaltyRedemption.value).toBe(true);
	});

	it("creates an accurate capability snapshot for profile-switch diffing", () => {
		const posProfile = ref({
			posa_allow_credit_sale: "1",
			posa_use_gift_cards: "1",
			use_customer_credit: "0",
		});
		const invoiceDoc = ref({ customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		const snapshot = caps.snapshotCapabilities();
		expect(snapshot.allowCreditSale).toBe(true);
		expect(snapshot.allowGiftCards).toBe(true);
		expect(snapshot.allowCustomerCredit).toBe(false);
	});
});
