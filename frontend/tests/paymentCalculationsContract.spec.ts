import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentCalculations } from "../src/posapp/composables/pos/payments/usePaymentCalculations";
import {
	resolveReturnDefaultAmount,
	shouldApplyReturnRefundCap,
} from "../src/posapp/utils/paymentInitialization";

describe("Payment Calculations Contract", () => {
	it("calculates diff_payment and change_due correctly for normal sale", () => {
		const invoiceDoc = ref({
			grand_total: 100,
			rounded_total: 100,
			currency: "USD",
			is_return: 0,
			payments: [{ mode_of_payment: "Cash", amount: 120 }],
		});
		const posProfile = ref({ currency: "USD" });
		const currencyPrecision = ref(2);
		const loyaltyAmount = ref(0);
		const redeemedCustomerCredit = ref(0);
		const customerCreditDict = ref([]);
		const customerInfo = ref({});
		const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

		const calculations = usePaymentCalculations({
			invoiceDoc,
			posProfile,
			currencyPrecision,
			loyaltyAmount,
			redeemedCustomerCredit,
			customerCreditDict,
			customerInfo,
			formatCurrency,
		});

		expect(calculations.total_payments.value).toBe(120);
		expect(calculations.diff_payment.value).toBe(-20);
		expect(calculations.change_due.value).toBe(20);
	});

	it("handles return invoice calculations and caps diff_payment to <= 0", () => {
		const invoiceDoc = ref({
			grand_total: -100,
			rounded_total: -100,
			currency: "USD",
			is_return: 1,
			payments: [{ mode_of_payment: "Cash", amount: -100 }],
		});
		const posProfile = ref({ currency: "USD" });
		const currencyPrecision = ref(2);
		const loyaltyAmount = ref(0);
		const redeemedCustomerCredit = ref(0);
		const customerCreditDict = ref([]);
		const customerInfo = ref({});
		const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

		const calculations = usePaymentCalculations({
			invoiceDoc,
			posProfile,
			currencyPrecision,
			loyaltyAmount,
			redeemedCustomerCredit,
			customerCreditDict,
			customerInfo,
			formatCurrency,
		});

		expect(calculations.total_payments.value).toBe(-100);
		expect(calculations.diff_payment.value).toBe(0);
		expect(calculations.change_due.value).toBe(0);
	});

	it("respects return refund cap for returns against original invoice", () => {
		const doc = {
			is_return: 1,
			return_against: "ACC-SINV-2026-00001",
			posa_refundable_amount: 60,
		};

		expect(shouldApplyReturnRefundCap(doc)).toBe(true);
		expect(resolveReturnDefaultAmount(doc, 100)).toBe(-60);
	});
});
