import { describe, expect, it } from "vitest";
import {
	applyPreferredPaymentAmount,
	initializePaymentLinesForDialog,
	rebalancePreferredPaymentLine,
} from "../src/posapp/utils/paymentInitialization";

describe("Payment Flow Contract", () => {
	const isCashLike = (p: any) =>
		Boolean(p?.mode_of_payment?.toLowerCase().includes("cash"));

	it("initializes preferred payment line with total grand total", () => {
		const doc = {
			grand_total: 150,
			rounded_total: 150,
			payments: [
				{ mode_of_payment: "Card", default: 0, amount: 0 },
				{ mode_of_payment: "Cash", default: 1, amount: 0 },
			],
		};

		const preferred = initializePaymentLinesForDialog(doc, 2, isCashLike);
		expect(preferred?.mode_of_payment).toBe("Cash");
		expect(preferred?.amount).toBe(150);
	});

	it("applies preferred payment amount exclusively to preferred line", () => {
		const doc = {
			grand_total: 200,
			payments: [
				{ mode_of_payment: "Cash", default: 1, amount: 100 },
				{ mode_of_payment: "Card", default: 0, amount: 100 },
			],
		};

		applyPreferredPaymentAmount(doc, 200, 2, isCashLike);
		expect(doc.payments[0].amount).toBe(200);
		expect(doc.payments[1].amount).toBe(0);
	});

	it("rebalances preferred payment line when loyalty or credit is applied", () => {
		const doc = {
			grand_total: 100,
			payments: [
				{ mode_of_payment: "Cash", default: 1, amount: 100 },
				{ mode_of_payment: "Card", default: 0, amount: 20 },
			],
		};

		rebalancePreferredPaymentLine(doc, {
			precision: 2,
			isCashLikePayment: isCashLike,
			loyaltyAmount: 30,
			redeemedCustomerCredit: 0,
			giftCardAmount: 0,
		});

		// 100 - 30 (loyalty) - 20 (card) = 50 for cash line
		expect(doc.payments[0].amount).toBe(50);
	});
});
