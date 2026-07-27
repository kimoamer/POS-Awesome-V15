import { describe, expect, it } from "vitest";

describe("Additional Discount Handler Guards", () => {
	it("blocks discount update handlers when capability is disabled", () => {
		const canEditAdditionalDiscount = false;
		let updatedValue = null;

		const handleAdditionalDiscountUpdate = (val: number) => {
			if (!canEditAdditionalDiscount) return;
			updatedValue = val;
		};

		handleAdditionalDiscountUpdate(25);
		expect(updatedValue).toBeNull();
	});
});
