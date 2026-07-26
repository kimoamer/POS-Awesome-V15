import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("Payment Profile Request Gates", () => {
	it("disables request loading capabilities for a minimal POS profile", () => {
		const posProfile = ref({
			posa_allow_sales_order: "0",
			use_customer_credit: "0",
			posa_allow_select_print_format_in_payments: "0",
		});
		const invoiceDoc = ref({ customer: "CUST-001" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowShippingAddress.value).toBe(false);
		expect(caps.allowCustomerCredit.value).toBe(false);
		expect(caps.allowPrintFormat.value).toBe(false);
	});

	it("enables request loading capabilities for a full POS profile", () => {
		const posProfile = ref({
			posa_allow_sales_order: "1",
			use_customer_credit: "1",
			posa_allow_select_print_format_in_payments: "1",
		});
		const invoiceDoc = ref({ customer: "CUST-001", posa_delivery_date: "2026-08-01" });
		const caps = usePaymentUiCapabilities({ posProfile, invoiceDoc });

		expect(caps.allowShippingAddress.value).toBe(true);
		expect(caps.allowCustomerCredit.value).toBe(true);
		expect(caps.allowPrintFormat.value).toBe(true);
	});
});
