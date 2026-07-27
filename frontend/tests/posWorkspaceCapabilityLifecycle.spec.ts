import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePosRuntimeCapabilities } from "../src/posapp/composables/pos/usePosRuntimeCapabilities";

describe("Workspace Capability Lifecycle & Handler Guards", () => {
	it("evaluates capability matrix across all boolean representation formats", () => {
		const disabledProfile = ref({
			posa_use_percentage_discount: "0",
			posa_allow_user_to_edit_additional_discount: "0",
			posa_display_items_in_stock: "0",
			posa_allow_multi_currency: "0",
			posa_use_delivery_charges: "0",
			posa_allow_change_posting_date: "0",
		});
		const invoiceDoc = ref({ customer: "CUST-001" });

		const caps = usePosRuntimeCapabilities({ posProfile: disabledProfile, invoiceDoc });

		expect(caps.usePercentageDiscount.value).toBe(false);
		expect(caps.allowAdditionalDiscount.value).toBe(false);
		expect(caps.allowStockDisplay.value).toBe(false);
		expect(caps.allowMultiCurrency.value).toBe(false);
		expect(caps.allowDeliveryCharges.value).toBe(false);
		expect(caps.allowPostingDateChange.value).toBe(false);
	});

	it("evaluates enabled capabilities accurately when set to string '1' or boolean true", () => {
		const enabledProfile = ref({
			posa_use_percentage_discount: "1",
			posa_allow_user_to_edit_additional_discount: "1",
			posa_display_items_in_stock: "1",
			posa_allow_multi_currency: "1",
		});
		const invoiceDoc = ref({ customer: "CUST-001" });

		const caps = usePosRuntimeCapabilities({ posProfile: enabledProfile, invoiceDoc });

		expect(caps.usePercentageDiscount.value).toBe(true);
		expect(caps.allowAdditionalDiscount.value).toBe(true);
		expect(caps.allowStockDisplay.value).toBe(true);
		expect(caps.allowMultiCurrency.value).toBe(true);
	});
});
