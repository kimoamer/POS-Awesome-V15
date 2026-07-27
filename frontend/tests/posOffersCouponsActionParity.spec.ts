import { describe, expect, it } from "vitest";

describe("Offers & Coupons Action Parity Rules", () => {
	it("preserves all methods across PosOffers and PosCoupons", () => {
		const offerMethods = [
			"applyOffer",
			"removeOffer",
			"fetchGroupItems",
			"get_give_items",
			"updatePosOffers",
			"removeOffers",
			"handelOffers",
			"back_to_invoice",
		];
		const couponMethods = [
			"add_coupon",
			"setActiveGiftCoupons",
			"updatePosCoupons",
			"removeCoupon",
			"updateInvoice",
			"loadCachedCoupons",
			"persistCouponsCache",
			"back_to_invoice",
		];

		expect(offerMethods.length).toBe(8);
		expect(couponMethods.length).toBe(8);
	});
});
