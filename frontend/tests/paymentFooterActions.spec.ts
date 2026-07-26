import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentActionButtons from "../src/posapp/components/pos/payments/PaymentActionButtons.vue";

describe("Payment Footer Action Buttons Contract", () => {
	it("renders all three payment action buttons (Cancel Payment, Submit, Submit & Print)", () => {
		const wrapper = mount(PaymentActionButtons, {
			props: {
				loading: false,
				validatePayment: false,
			},
		});

		const buttons = wrapper.findAll(".payment-footer-btn");
		expect(buttons.length).toBe(3);

		const text = wrapper.text();
		expect(text).toContain("Cancel Payment");
		expect(text).toContain("Submit");
		expect(text).toContain("Submit & Print");
	});

	it("emits submit, submit-and-print, and cancel events when clicked", async () => {
		const wrapper = mount(PaymentActionButtons, {
			props: {
				loading: false,
				validatePayment: false,
			},
		});

		const buttons = wrapper.findAll(".payment-footer-btn");
		await buttons[0].trigger("click");
		await buttons[1].trigger("click");
		await buttons[2].trigger("click");

		expect(wrapper.emitted("cancel")).toBeTruthy();
		expect(wrapper.emitted("submit")).toBeTruthy();
		expect(wrapper.emitted("submit-and-print")).toBeTruthy();
	});

	it("disables Cancel Payment button when loading is true", () => {
		const wrapper = mount(PaymentActionButtons, {
			props: {
				loading: true,
				validatePayment: false,
			},
		});

		const cancelButton = wrapper.find(".payment-cancel-btn");
		expect((cancelButton.element as HTMLButtonElement).disabled).toBe(true);
	});
});
