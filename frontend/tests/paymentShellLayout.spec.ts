import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

// @ts-ignore
import PaymentScreenHeader from "../src/posapp/components/pos/payments/PaymentScreenHeader.vue";
// @ts-ignore
import PaymentSectionShell from "../src/posapp/components/pos/payments/PaymentSectionShell.vue";
import { parseBooleanSetting } from "../src/posapp/utils/stock";

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

	it("disables back button in header when loading is true", async () => {
		const wrapper = mount(PaymentScreenHeader, {
			props: {
				dialogMode: false,
				loading: true,
				invoiceDoc: { is_return: 0, customer_name: "Jane Doe" },
			},
		});

		const backBtn = wrapper.find(".payment-screen-header__back-btn");
		expect(backBtn.attributes("disabled")).toBeDefined();
		await backBtn.trigger("click");
		expect(wrapper.emitted("back")).toBeFalsy();
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

	it("supports controlled collapsible behavior and emits update:expanded", async () => {
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
		expect(wrapper.emitted("update:expanded")).toEqual([[false]]);
		expect(wrapper.find(".test-content").isVisible()).toBe(false);
	});

	it("normalizes boolean profile settings for Gift Cards and POS options across numeric and string representations", () => {
		expect(parseBooleanSetting("0")).toBe(false);
		expect(parseBooleanSetting("1")).toBe(true);
		expect(parseBooleanSetting("false")).toBe(false);
		expect(parseBooleanSetting("true")).toBe(true);
		expect(parseBooleanSetting(0)).toBe(false);
		expect(parseBooleanSetting(1)).toBe(true);
	});
});
