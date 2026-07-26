import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentDialogs from "../src/posapp/components/pos/payments/PaymentDialogs.vue";
// @ts-ignore
import MpesaPayments from "../src/posapp/components/pos/payments/Mpesa-Payments.vue";

describe("Payment Dialogs Responsive Bounds Contract", () => {
	it("renders custom days dialog with responsive calc width", () => {
		const wrapper = mount(PaymentDialogs, {
			props: {
				customDaysDialog: true,
				customDaysValue: 30,
				phoneDialog: false,
				invoiceDoc: { contact_mobile: "01000000000" },
			},
		});

		expect(wrapper.html()).toContain('width="min(360px, calc(100vw - 24px))"');
	});

	it("renders phone payment dialog with responsive width", () => {
		const wrapper = mount(PaymentDialogs, {
			props: {
				customDaysDialog: false,
				phoneDialog: true,
				invoiceDoc: { contact_mobile: "01000000000" },
			},
		});

		expect(wrapper.html()).toContain('width="min(400px, calc(100vw - 24px))"');
	});

	it("renders M-Pesa dialog with responsive calc width", () => {
		const wrapper = mount(MpesaPayments);
		expect(wrapper.html()).toContain('width="min(800px, calc(100vw - 24px))"');
	});
});
