import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentAdditionalInfo from "../src/posapp/components/pos/payments/PaymentAdditionalInfo.vue";
// @ts-ignore
import PaymentPurchaseOrder from "../src/posapp/components/pos/payments/PaymentPurchaseOrder.vue";

describe("Payment Order & Fulfillment UI Contract", () => {
	it("renders delivery date and notes when pos profile settings allow", () => {
		const wrapper = mount(PaymentAdditionalInfo, {
			props: {
				invoiceDoc: { posa_delivery_date: "2026-08-01", shipping_address_name: "" },
				posProfile: {
					posa_allow_sales_order: 1,
					posa_display_additional_notes: 1,
					posa_display_authorization_code: 1,
				},
				invoiceType: "Order",
				addresses: [],
			},
		});

		expect(wrapper.text()).toContain("Additional Notes");
		expect(wrapper.text()).toContain("Authorization Code");
	});

	it("renders purchase order fields when posa_allow_customer_purchase_order setting is true", () => {
		const wrapper = mount(PaymentPurchaseOrder, {
			props: {
				invoiceDoc: { po_no: "PO-999" },
				posProfile: { posa_allow_customer_purchase_order: 1 },
			},
		});

		expect(wrapper.text()).toContain("Purchase Order Number");
	});
});
