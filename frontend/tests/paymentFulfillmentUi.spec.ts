import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentAdditionalInfo from "../src/posapp/components/pos/payments/PaymentAdditionalInfo.vue";
// @ts-ignore
import PaymentPurchaseOrder from "../src/posapp/components/pos/payments/PaymentPurchaseOrder.vue";

describe("Payment Order & Fulfillment Contract", () => {
	it("renders delivery date and address fields in PaymentAdditionalInfo", () => {
		const wrapper = mount(PaymentAdditionalInfo, {
			props: {
				invoiceDoc: { posa_delivery_date: "2026-07-27" },
				posProfile: { posa_allow_sales_order: 1 },
				invoiceType: "Order",
				addresses: [{ name: "ADDR-1", address_title: "Home", display_title: "Home" }],
			},
		});

		expect(wrapper.text()).toContain("Delivery Date");
		expect(wrapper.text()).toContain("Shipping Address");
	});

	it("renders address loading and error retry states in PaymentAdditionalInfo", async () => {
		const loadingWrapper = mount(PaymentAdditionalInfo, {
			props: {
				invoiceDoc: { posa_delivery_date: "2026-07-27" },
				addressesLoading: true,
			},
		});
		expect(loadingWrapper.text()).toContain("Loading shipping addresses...");

		const errorWrapper = mount(PaymentAdditionalInfo, {
			props: {
				invoiceDoc: { posa_delivery_date: "2026-07-27" },
				addressesError: "Unable to load addresses",
			},
		});
		expect(errorWrapper.text()).toContain("Unable to load addresses");
		const retryBtn = errorWrapper.find("button");
		expect(retryBtn.exists()).toBe(true);
		await retryBtn.trigger("click");
		expect(errorWrapper.emitted("retry-addresses")).toBeTruthy();
	});

	it("renders purchase order number and PO date fields in PaymentPurchaseOrder", () => {
		const wrapper = mount(PaymentPurchaseOrder, {
			props: {
				invoiceDoc: { po_no: "PO-100", po_date: "2026-07-27" },
				posProfile: { posa_allow_customer_purchase_order: 1 },
			},
		});

		expect(wrapper.text()).toContain("Purchase Order Number");
		expect(wrapper.text()).toContain("Purchase Order Date");
	});
});
