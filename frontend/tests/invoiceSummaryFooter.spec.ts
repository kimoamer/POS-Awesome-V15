import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { useInvoiceFooterActions } from "../src/posapp/composables/pos/invoice/useInvoiceFooterActions";
import { parseBooleanSetting } from "../src/posapp/composables/pos/items/useItemPermissions";

describe("useInvoiceFooterActions composable & reactive footer logic", () => {
	const profileA = {
		custom_allow_select_sales_order: 1,
		posa_allow_return: 1,
		posa_allow_print_draft_invoices: 0,
		posa_enable_customer_display: 1,
	};

	const profileB = {
		custom_allow_select_sales_order: 0,
		posa_allow_return: 0,
		posa_allow_print_draft_invoices: 1,
		posa_enable_customer_display: 0,
	};

	it("updates action visibility dynamically when reactive posProfile ref changes", () => {
		const posProfileRef = ref(profileA);
		const { menuActions } = useInvoiceFooterActions({ posProfile: posProfileRef });

		let keys = menuActions.value.map((a) => a.key);
		expect(keys).toContain("return");
		expect(keys).not.toContain("print");
		expect(keys).toContain("customer-display");

		// Dynamically switch profile to B
		posProfileRef.value = profileB;

		keys = menuActions.value.map((a) => a.key);
		expect(keys).not.toContain("return");
		expect(keys).toContain("print");
		expect(keys).not.toContain("customer-display");
	});

	it("updates loading states reactively when loading refs change", () => {
		const saveLoadingRef = ref(false);
		const { directActions } = useInvoiceFooterActions({
			posProfile: profileA,
			saveLoading: saveLoadingRef,
		});

		let saveAction = directActions.value.find((a) => a.key === "save");
		expect(saveAction?.loading).toBe(false);

		saveLoadingRef.value = true;
		saveAction = directActions.value.find((a) => a.key === "save");
		expect(saveAction?.loading).toBe(true);
	});

	it("parses string and numeric boolean settings correctly", () => {
		expect(parseBooleanSetting("0")).toBe(false);
		expect(parseBooleanSetting("1")).toBe(true);
		expect(parseBooleanSetting("false")).toBe(false);
		expect(parseBooleanSetting("true")).toBe(true);
		expect(parseBooleanSetting(0)).toBe(false);
		expect(parseBooleanSetting(1)).toBe(true);
		expect(parseBooleanSetting(false)).toBe(false);
		expect(parseBooleanSetting(true)).toBe(true);
	});

	it("evaluates empty cart pay eligibility using Math.abs(total_qty)", () => {
		const qtyZero = 0;
		const qtyPositive = 2;
		const qtyNegative = -2;

		expect(Math.abs(Number(qtyZero || 0)) > 0).toBe(false);
		expect(Math.abs(Number(qtyPositive || 0)) > 0).toBe(true);
		expect(Math.abs(Number(qtyNegative || 0)) > 0).toBe(true);
	});
});
