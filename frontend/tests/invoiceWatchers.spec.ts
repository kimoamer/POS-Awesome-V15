import { describe, expect, it, vi } from "vitest";

vi.mock("../src/offline/index", () => ({
	clearPriceListCache: vi.fn(),
}));

vi.mock("../src/posapp/stores/customersStore.js", () => ({
	useCustomersStore: () => ({
		setSelectedCustomer: vi.fn(),
		setCustomerInfo: vi.fn(),
	}),
}));

import invoiceWatchers from "../src/posapp/components/pos/invoice/invoiceWatchers";

describe("invoiceWatchers", () => {
	it("does not back-calculate percentage discounts from derived amount", () => {
		const context = {
			additional_discount: 49.999999999,
			additional_discount_percentage: 5,
			Total: 1000,
			isReturnInvoice: false,
			pos_profile: {
				posa_use_percentage_discount: true,
			},
			discount_amount: 49.999999999,
		};

		(invoiceWatchers as any).additional_discount.call(context);

		expect(context.additional_discount_percentage).toBe(5);
	});

	it("keeps single-currency price-list changes local", () => {
		const apiCall = vi.fn();
		(globalThis as any).frappe = { call: apiCall };
		const context = {
			pos_profile: {
				name: "POS-1",
				currency: "PKR",
				selling_price_list: "Retail",
				posa_allow_multi_currency: "0",
			},
			selected_price_list: "Retail",
			selected_currency: "USD",
			price_list_currency: "USD",
			exchange_rate: 2,
			conversion_rate: 300,
			items: [],
			packed_items: [],
			eventBus: { emit: vi.fn() },
			get_effective_price_list: () => "Retail",
			apply_cached_price_list: vi.fn(),
		};

		(invoiceWatchers as any).selected_price_list.call(context, "Retail");

		expect(apiCall).not.toHaveBeenCalled();
		expect(context.selected_currency).toBe("PKR");
		expect(context.price_list_currency).toBe("PKR");
		expect(context.exchange_rate).toBe(1);
		expect(context.conversion_rate).toBe(1);
	});
});
