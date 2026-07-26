import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentSelectionFields from "../src/posapp/components/pos/payments/PaymentSelectionFields.vue";

describe("Sales & Receipt Selection Fields Contract", () => {
	it("renders 1-column layout class for tablet-portrait viewport mode", () => {
		const wrapper = mount(PaymentSelectionFields, {
			props: {
				viewportMode: "tablet-portrait",
				salesPersons: ["John Doe", "Jane Smith"],
				salesPerson: "John Doe",
				printFormats: ["Standard POS"],
				printFormat: "Standard POS",
			},
		});

		expect(wrapper.html()).toContain("selection-fields--tablet-portrait");
	});

	it("renders error state and emits retry event when sales persons load fails", async () => {
		const wrapper = mount(PaymentSelectionFields, {
			props: {
				viewportMode: "desktop",
				salesPersonsError: "Unable to load Sales Persons",
				showPrintFormat: true,
			},
		});

		expect(wrapper.text()).toContain("Unable to load Sales Persons");
		const retryBtn = wrapper.find("button");
		expect(retryBtn.exists()).toBe(true);
		await retryBtn.trigger("click");
		expect(wrapper.emitted("retry-sales-persons")).toBeTruthy();
	});
});
