import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentScreenHeader from "../src/posapp/components/pos/payments/PaymentScreenHeader.vue";
// @ts-ignore
import PaymentSectionShell from "../src/posapp/components/pos/payments/PaymentSectionShell.vue";

describe("Payment Shell Layout & Components", () => {
	it("renders PaymentScreenHeader with return title when invoice is a return", () => {
		const wrapper = mount(PaymentScreenHeader, {
			props: {
				dialogMode: true,
				invoiceDoc: { is_return: 1, customer_name: "John Doe" },
				customerInfo: {},
				invoiceType: "Invoice",
			},
		});

		expect(wrapper.text()).toContain("Complete Refund");
		expect(wrapper.text()).toContain("John Doe");
		expect(wrapper.find(".payment-screen-header__badge").exists()).toBe(true);
	});

	it("emits back event when close/back button is clicked in header", async () => {
		const wrapper = mount(PaymentScreenHeader, {
			props: {
				dialogMode: false,
				invoiceDoc: { is_return: 0, customer_name: "Jane Doe" },
			},
		});

		await wrapper.find(".payment-screen-header__back-btn").trigger("click");
		expect(wrapper.emitted("back")).toBeTruthy();
	});

	it("renders PaymentSectionShell with title and icon", () => {
		const wrapper = mount(PaymentSectionShell, {
			props: {
				title: "Payment Methods",
				icon: "mdi-wallet-outline",
			},
			slots: {
				default: "<div class='test-body'>Body Content</div>",
			},
		});

		expect(wrapper.text()).toContain("Payment Methods");
		expect(wrapper.find(".test-body").text()).toBe("Body Content");
	});

	it("supports collapsible behavior in PaymentSectionShell", async () => {
		const wrapper = mount(PaymentSectionShell, {
			props: {
				title: "Collapsible Section",
				collapsible: true,
				expanded: true,
			},
			slots: {
				default: "<div class='test-content'>Slot Content</div>",
			},
		});

		expect(wrapper.find(".test-content").isVisible()).toBe(true);
		await wrapper.find(".payment-section-shell__header").trigger("click");
		expect(wrapper.find(".test-content").isVisible()).toBe(false);
	});
});
