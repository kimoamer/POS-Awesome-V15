import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentDialogs from "../src/posapp/components/pos/payments/PaymentDialogs.vue";
// @ts-ignore
import MpesaPayments from "../src/posapp/components/pos/payments/Mpesa-Payments.vue";

describe("Responsive Payment Dialogs Contract", () => {
	it("renders PaymentDialogs with phone fullscreen class on phone viewport mode", () => {
		const wrapper = mount(PaymentDialogs, {
			props: {
				viewportMode: "phone",
				customDaysDialog: true,
				customDaysValue: 15,
				phoneDialog: false,
				invoiceDoc: { contact_mobile: "1234567" },
			},
		});

		expect(wrapper.html()).toContain("payment-dialog--phone");
		expect(wrapper.text()).toContain("Custom Due Days");
	});

	it("renders MpesaPayments component and applies viewportMode class", () => {
		const wrapper = mount(MpesaPayments, {
			props: {
				viewportMode: "phone",
			},
			global: {
				provide: {
					eventBus: { on: () => {}, off: () => {}, emit: () => {} },
				},
			},
		});

		expect(wrapper.html()).toContain("mpesa-dialog--phone");
	});
});
