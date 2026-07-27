import { describe, expect, it } from "vitest";
import {
	rebalancePreferredPaymentLine,
	resolveReturnDefaultAmount,
} from "../src/posapp/utils/paymentInitialization";

describe("Cart & Payment Calculation Integrity Invariants", () => {
	it("rebalances cash payment coverage accurately when secondary amounts are freed", () => {
		const doc = {
			grand_total: 1000,
			rounded_total: 1000,
			payments: [
				{ mode_of_payment: "Cash", amount: 700, default: 1 },
				{ mode_of_payment: "M-Pesa", amount: 0, default: 0 },
			],
		};

		// Secondary amounts freed (Customer Credit = 0, Loyalty = 0, Gift Card = 0)
		rebalancePreferredPaymentLine(
			doc,
			{
				loyaltyAmount: 0,
				redeemedCustomerCredit: 0,
				giftCardAmount: 0,
			},
			(p) => p.default === 1 || p.mode_of_payment === "Cash",
		);

		const cashRow = doc.payments.find((p) => p.mode_of_payment === "Cash");
		expect(cashRow?.amount).toBe(1000);
	});

	it("computes negative return default amounts accurately for return invoices", () => {
		const doc = {
			is_return: 1,
			grand_total: -500,
			rounded_total: -500,
		};

		const defaultRefund = resolveReturnDefaultAmount(doc);
		expect(defaultRefund).toBe(-500);
	});
});
