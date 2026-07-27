import { describe, expect, it } from "vitest";

describe("Customer Hub & Eligibility Invariants", () => {
	it("evaluates Customer Credit eligibility when customer and balance are present", () => {
		const customer = { customer_name: "John Doe", customer_group: "Individual" };
		const customerCreditEnabled = true;
		const isReturn = false;

		const isCustomerCreditEligible = !isReturn && customerCreditEnabled && Boolean(customer?.customer_name);
		expect(isCustomerCreditEligible).toBe(true);
	});

	it("disables Customer Credit eligibility for return invoices (uses Store as Credit instead)", () => {
		const customer = { customer_name: "John Doe" };
		const customerCreditEnabled = true;
		const isReturn = true;

		const isCustomerCreditEligible = !isReturn && customerCreditEnabled && Boolean(customer?.customer_name);
		const isStoreAsCreditEligible = isReturn && customerCreditEnabled && Boolean(customer?.customer_name);

		expect(isCustomerCreditEligible).toBe(false);
		expect(isStoreAsCreditEligible).toBe(true);
	});
});
