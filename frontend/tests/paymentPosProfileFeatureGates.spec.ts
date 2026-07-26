import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePaymentUiCapabilities } from "../src/posapp/composables/pos/payments/usePaymentUiCapabilities";

describe("POS Profile Feature Gates & Boolean Parsing Contract", () => {
	it("evaluates string '0', 0, false, 'false', null, undefined as disabled", () => {
		const disabledProfiles = [
			{ posa_use_gift_cards: "0", posa_allow_credit_sale: 0, use_customer_credit: false },
			{ posa_use_gift_cards: "false", posa_allow_credit_sale: null, use_customer_credit: undefined },
		];

		disabledProfiles.forEach((profile) => {
			const caps = usePaymentUiCapabilities({
				posProfile: ref(profile),
				invoiceDoc: ref({ is_return: false }),
			});
			expect(caps.showGiftCards.value).toBe(false);
			expect(caps.showCreditSale.value).toBe(false);
			expect(caps.showCustomerCreditRedemption.value).toBe(false);
			expect(caps.showStoreAsCredit.value).toBe(false);
		});
	});

	it("evaluates string '1', 1, true, 'true' as enabled", () => {
		const enabledProfiles = [
			{ posa_use_gift_cards: "1", posa_allow_credit_sale: 1, use_customer_credit: true },
			{ posa_use_gift_cards: "true", posa_allow_credit_sale: "1", use_customer_credit: "true" },
		];

		enabledProfiles.forEach((profile) => {
			const caps = usePaymentUiCapabilities({
				posProfile: ref(profile),
				invoiceDoc: ref({ is_return: false, customer: "CUST-001" }),
				isCashback: ref(true),
			});
			expect(caps.showGiftCards.value).toBe(true);
			expect(caps.showCreditSale.value).toBe(true);
			expect(caps.showCustomerCreditRedemption.value).toBe(true);
		});
	});

	it("requires Customer Credit setting AND Return invoice AND Customer for Store as Credit", () => {
		// Enabled profile but NOT a return invoice
		const nonReturnCaps = usePaymentUiCapabilities({
			posProfile: ref({ use_customer_credit: "1" }),
			invoiceDoc: ref({ is_return: false, customer: "CUST-001" }),
		});
		expect(nonReturnCaps.showStoreAsCredit.value).toBe(false);

		// Return invoice AND customer AND enabled setting
		const returnCaps = usePaymentUiCapabilities({
			posProfile: ref({ use_customer_credit: "1" }),
			invoiceDoc: ref({ is_return: true, customer: "CUST-001" }),
		});
		expect(returnCaps.showStoreAsCredit.value).toBe(true);

		// Return invoice BUT Customer Credit setting is 0
		const disabledReturnCaps = usePaymentUiCapabilities({
			posProfile: ref({ use_customer_credit: "0" }),
			invoiceDoc: ref({ is_return: true, customer: "CUST-001" }),
		});
		expect(disabledReturnCaps.showStoreAsCredit.value).toBe(false);
	});

	it("gates Shipping Address behind Sales Order setting", () => {
		// Delivery date set BUT sales order setting disabled
		const disabledSalesOrderCaps = usePaymentUiCapabilities({
			posProfile: ref({ posa_allow_sales_order: "0" }),
			invoiceDoc: ref({ posa_delivery_date: "2026-07-27" }),
		});
		expect(disabledSalesOrderCaps.showShippingAddress.value).toBe(false);

		// Delivery date set AND sales order setting enabled
		const enabledSalesOrderCaps = usePaymentUiCapabilities({
			posProfile: ref({ posa_allow_sales_order: "1" }),
			invoiceDoc: ref({ posa_delivery_date: "2026-07-27" }),
		});
		expect(enabledSalesOrderCaps.showShippingAddress.value).toBe(true);
	});
});
