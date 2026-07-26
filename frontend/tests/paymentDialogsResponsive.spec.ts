import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentDialogs from "../src/posapp/components/pos/payments/PaymentDialogs.vue";

describe("Payment Responsive Dialogs Contract", () => {
	it("renders dialog shell and close button per viewport mode", () => {
		const wrapper = mount(PaymentDialogs, {
			props: {
				modelValue: true,
				title: "Test Dialog",
				viewportMode: "phone",
			},
			slots: {
				default: '<div class="dialog-body">Body Content</div>',
			},
		});

		expect(wrapper.text()).toContain("Test Dialog");
		expect(wrapper.find(".payment-dialog--phone").exists()).toBe(true);
		expect(wrapper.find(".payment-dialog__close").exists()).toBe(true);
	});
});
