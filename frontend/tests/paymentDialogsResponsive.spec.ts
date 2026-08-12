import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentDialogs from "../src/posapp/components/pos/payments/PaymentDialogs.vue";

describe("Payment Responsive Dialogs Contract", () => {
	it("renders dialog shell and close button per viewport mode", () => {
		const wrapper = mount(PaymentDialogs, {
			props: {
				customDaysDialog: true,
				invoiceDoc: {},
				viewportMode: "phone",
			},
		});

		expect(wrapper.text()).toContain("Custom Due Days");
		expect(wrapper.find(".payment-dialog--phone").exists()).toBe(true);
		expect(wrapper.find(".payment-dialog__close").exists()).toBe(true);
	});
});
