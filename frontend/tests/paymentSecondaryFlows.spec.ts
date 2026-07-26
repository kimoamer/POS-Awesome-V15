import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentSectionShell from "../src/posapp/components/pos/payments/PaymentSectionShell.vue";

describe("Payment Secondary Section Expansion Contract", () => {
	it("renders collapsible section shell and respects expanded prop", async () => {
		const wrapper = mount(PaymentSectionShell, {
			props: {
				title: "Settlement Options",
				icon: "mdi-tune-variant",
				collapsible: true,
				expanded: true,
			},
			slots: {
				default: '<div class="test-content">Content</div>',
			},
		});

		expect(wrapper.text()).toContain("Settlement Options");
		expect(wrapper.find(".test-content").exists()).toBe(true);
	});
});
