import { describe, expect, it } from "vitest";

import { useInvoiceFooterActions } from "../src/posapp/composables/pos/invoice/useInvoiceFooterActions";
import { parseBooleanSetting } from "../src/posapp/composables/pos/items/useItemPermissions";

describe("useInvoiceFooterActions composable & summary footer logic", () => {
	const defaultProfile = {
		custom_allow_select_sales_order: 1,
		posa_allow_return: 1,
		posa_allow_print_draft_invoices: 1,
		posa_enable_customer_display: 1,
		posa_allow_user_to_edit_additional_discount: 1,
		posa_use_percentage_discount: 0,
	};

	const stringProfile = {
		custom_allow_select_sales_order: "1",
		posa_allow_return: "0",
		posa_allow_print_draft_invoices: "1",
		posa_enable_customer_display: "0",
		posa_allow_user_to_edit_additional_discount: "1",
		posa_use_percentage_discount: "1",
	};

	const restrictedProfile = {
		custom_allow_select_sales_order: 0,
		posa_allow_return: 0,
		posa_allow_print_draft_invoices: 0,
		posa_enable_customer_display: 0,
		posa_allow_user_to_edit_additional_discount: 0,
		posa_use_percentage_discount: 0,
	};

	it("returns direct actions (Save & Clear, Drafts) as always visible", () => {
		const { directActions } = useInvoiceFooterActions({ posProfile: defaultProfile });
		const keys = directActions.value.map((a) => a.key);
		expect(keys).toContain("save");
		expect(keys).toContain("drafts");
	});

	it("filters menu actions according to POS Profile permissions", () => {
		const { menuActions: defaultMenu } = useInvoiceFooterActions({ posProfile: defaultProfile });
		const defaultKeys = defaultMenu.value.map((a) => a.key);
		expect(defaultKeys).toContain("select-order");
		expect(defaultKeys).toContain("return");
		expect(defaultKeys).toContain("print");
		expect(defaultKeys).toContain("customer-display");
		expect(defaultKeys).toContain("cancel");

		const { menuActions: stringMenu } = useInvoiceFooterActions({ posProfile: stringProfile });
		const stringKeys = stringMenu.value.map((a) => a.key);
		expect(stringKeys).toContain("select-order");
		expect(stringKeys).not.toContain("return");
		expect(stringKeys).toContain("print");
		expect(stringKeys).not.toContain("customer-display");

		const { menuActions: restrictedMenu } = useInvoiceFooterActions({ posProfile: restrictedProfile });
		const restrictedKeys = restrictedMenu.value.map((a) => a.key);
		expect(restrictedKeys).not.toContain("select-order");
		expect(restrictedKeys).not.toContain("return");
		expect(restrictedKeys).not.toContain("print");
		expect(restrictedKeys).not.toContain("customer-display");
		expect(restrictedKeys).toContain("cancel"); // Cancel Sale always present in menu
	});

	it("evaluates additional discount permissions correctly", () => {
		const allowDefault = parseBooleanSetting(defaultProfile.posa_allow_user_to_edit_additional_discount);
		expect(allowDefault).toBe(true);

		const allowRestricted = parseBooleanSetting(restrictedProfile.posa_allow_user_to_edit_additional_discount);
		expect(allowRestricted).toBe(false);

		const offerApplied = "PROMO_DISCOUNT_10";
		const canEditWithOffer = allowDefault && !offerApplied;
		expect(canEditWithOffer).toBe(false);
	});
});
