import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentSectionShell from "../src/posapp/components/pos/payments/PaymentSectionShell.vue";
// @ts-ignore
import PaymentActionButtons from "../src/posapp/components/pos/payments/PaymentActionButtons.vue";

describe("Payment Responsive Layout & Visual System Contract", () => {
	it("renders tonal icon box container in PaymentSectionShell", () => {
		const wrapper = mount(PaymentSectionShell, {
			props: {
				title: "Payment Methods",
				icon: "mdi-wallet-outline",
			},
		});

		const iconBox = wrapper.find(".payment-section-shell__icon-box");
		expect(iconBox.exists()).toBe(true);
		expect(wrapper.text()).toContain("Payment Methods");
	});

	it("renders phone mode action footer with More button on phone viewportMode", () => {
		const wrapper = mount(PaymentActionButtons, {
			props: {
				viewportMode: "phone",
				loading: false,
				validatePayment: false,
			},
		});

		expect(wrapper.classes()).toContain("payment-action-buttons--phone");
		const moreBtn = wrapper.find(".payment-more-btn");
		expect(moreBtn.exists()).toBe(true);
	});

	it("renders desktop action footer with 3 direct buttons on desktop viewportMode", () => {
		const wrapper = mount(PaymentActionButtons, {
			props: {
				viewportMode: "desktop",
				loading: false,
				validatePayment: false,
			},
		});

		const buttons = wrapper.findAll(".payment-footer-btn");
		expect(buttons.length).toBe(3);
		expect(wrapper.text()).toContain("Submit & Print");
	});
});
