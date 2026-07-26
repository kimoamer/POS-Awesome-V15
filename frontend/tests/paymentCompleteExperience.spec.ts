import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
// @ts-ignore
import PaymentSelectionFields from "../src/posapp/components/pos/payments/PaymentSelectionFields.vue";

describe("Payment Complete Secondary Experience Contract", () => {
	it("normalizes sales persons and print formats safely", () => {
		const wrapper = mount(PaymentSelectionFields, {
			props: {
				salesPersons: ["Sales Team A", { name: "Sales Rep B", title: "Sales Rep B" }],
				salesPerson: "Sales Team A",
				printFormats: ["POS Receipt", { name: "Standard Tax", title: "Standard Tax" }],
				printFormat: "POS Receipt",
				showPrintFormat: true,
			},
		});

		expect(wrapper.text()).toContain("Sales Person");
		expect(wrapper.text()).toContain("Print Format");
	});

	it("displays loading state text when loading props are true", () => {
		const wrapper = mount(PaymentSelectionFields, {
			props: {
				salesPersons: [],
				salesPersonsLoading: true,
				printFormats: [],
				printFormatsLoading: true,
				showPrintFormat: true,
			},
		});

		expect(wrapper.html()).toContain("Loading Sales Persons...");
		expect(wrapper.html()).toContain("Loading Print Formats...");
	});
});
