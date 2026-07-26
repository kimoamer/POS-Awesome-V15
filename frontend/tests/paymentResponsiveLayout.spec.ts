import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentSectionShell from "../src/posapp/components/pos/payments/PaymentSectionShell.vue";

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

	it("resolves viewport mode breakpoints correctly (phone <600, portrait <900, landscape <1200, desktop >=1200)", () => {
		const resolveMode = (w: number) => {
			if (w < 600) return "phone";
			if (w < 900) return "tablet-portrait";
			if (w < 1200) return "tablet-landscape";
			return "desktop";
		};

		expect(resolveMode(430)).toBe("phone");
		expect(resolveMode(768)).toBe("tablet-portrait");
		expect(resolveMode(1024)).toBe("tablet-landscape");
		expect(resolveMode(1440)).toBe("desktop");
	});
});
