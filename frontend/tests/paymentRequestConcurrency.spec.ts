import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { useRedemptionLogic } from "../src/posapp/composables/pos/payments/useRedemptionLogic";

describe("Payment Request Concurrency & Preview Isolation Contract", () => {
	it("guarantees preview never allocates credit or alters redeemed_customer_credit", async () => {
		const invoiceDoc = ref({ customer: "CUST-001", grand_total: 500 });
		const posProfile = ref({ company: "Test Company" });

		const { prefetch_available_credit, redeemed_customer_credit, customer_credit_dict } = useRedemptionLogic({
			invoiceDoc,
			posProfile,
			customerInfo: ref(""),
			currencyPrecision: ref(2),
			formatFloat: (val: any) => Number(val),
		});

		await prefetch_available_credit();

		expect(redeemed_customer_credit.value).toBe(0);
		customer_credit_dict.value.forEach((row: any) => {
			expect(row.credit_to_redeem).toBe(0);
		});
	});

	it("discards stale Customer A results after switching context to Customer B", async () => {
		const invoiceDoc = ref({ customer: "CUST-A", grand_total: 500 });
		const posProfile = ref({ company: "Test Company" });

		const { prefetch_available_credit, customer_credit_dict } = useRedemptionLogic({
			invoiceDoc,
			posProfile,
			customerInfo: ref(""),
			currencyPrecision: ref(2),
			formatFloat: (val: any) => Number(val),
		});

		// Trigger prefetch for CUST-A
		const fetchPromise = prefetch_available_credit();
		// Customer changes to B immediately
		invoiceDoc.value = { customer: "CUST-B", grand_total: 500 };

		await fetchPromise;

		// Stale results for CUST-A should not mutate state under CUST-B
		expect(customer_credit_dict.value).toEqual([]);
	});
});
