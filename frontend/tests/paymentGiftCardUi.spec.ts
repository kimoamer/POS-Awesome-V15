import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentGiftCardSection from "../src/posapp/components/pos/payments/PaymentGiftCardSection.vue";
// @ts-ignore
import GiftCardDialog from "../src/posapp/components/pos/wallet/GiftCardDialog.vue";

describe("Payment Gift Card UI Contract", () => {
	it("renders cashier actions for card redemption in section", () => {
		const wrapper = mount(PaymentGiftCardSection, {
			props: {
				enabled: true,
				expanded: true,
				appliedAmount: 0,
				cardCode: "GC-100",
				redeemAmount: 50,
				balance: 100,
				status: "Active",
				formatCurrency: (val: number) => `$${val}`,
			},
		});

		expect(wrapper.text()).toContain("Gift Card Code");
		expect(wrapper.text()).toContain("Check Balance");
		expect(wrapper.text()).toContain("Apply Gift Card");
	});

	it("renders supervisor mode selection in GiftCardDialog", () => {
		const wrapper = mount(GiftCardDialog, {
			props: {
				modelValue: true,
				isSupervisor: true,
				mode: "issue",
				viewportMode: "desktop",
				cardCode: "GC-NEW",
				redeemAmount: 100,
				balance: 0,
				status: "New",
			},
		});

		expect(wrapper.text()).toContain("Issue New Card");
		expect(wrapper.text()).toContain("Top Up Card");
		expect(wrapper.text()).toContain("Redeem");
	});

	it("applies fullscreen class on phone viewport mode", () => {
		const wrapper = mount(GiftCardDialog, {
			props: {
				modelValue: true,
				isSupervisor: false,
				mode: "redeem",
				viewportMode: "phone",
				cardCode: "GC-PHONE",
			},
		});

		expect(wrapper.html()).toContain("gift-card-dialog--phone");
	});
});
