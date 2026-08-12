import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../src/offline/index", () => ({
	isOffline: vi.fn(() => false),
	savePricingRulesSnapshot: vi.fn(),
	getCachedPricingRulesSnapshot: vi.fn(() => null),
	clearPricingRulesSnapshot: vi.fn(),
}));

import {
	buildPricingRuleContext,
	usePricingRulesStore,
} from "../src/posapp/stores/pricingRulesStore";

describe("pricing rules store request coordination", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it("deduplicates concurrent requests for the same pricing context", async () => {
		let resolveRequest: ((_value: unknown) => void) | null = null;
		const call = vi.fn(
			() =>
				new Promise((resolve) => {
					resolveRequest = resolve as (_value: unknown) => void;
				}),
		);
		(globalThis as any).frappe = { call };
		const store = usePricingRulesStore();
		const context = {
			pos_profile: "Main POS",
			company: "Test Co",
			price_list: "Retail",
			currency: "USD",
		};

		const first = store.ensureActiveRules(context);
		const second = store.ensureActiveRules(context);

		expect(call).toHaveBeenCalledTimes(1);
		expect(call).toHaveBeenCalledWith(
			expect.objectContaining({
				args: expect.objectContaining({ pos_profile: "Main POS" }),
			}),
		);
		resolveRequest?.({ message: [{ name: "RULE-1" }] });
		await Promise.all([first, second]);
		expect(store.rules).toHaveLength(1);
	});

	it("does not let an older context response overwrite the latest snapshot", async () => {
		const resolvers: Array<(_value: unknown) => void> = [];
		const call = vi.fn(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve as (_value: unknown) => void);
				}),
		);
		(globalThis as any).frappe = { call };
		const store = usePricingRulesStore();

		const first = store.ensureActiveRules({
			pos_profile: "Main POS",
			company: "Test Co",
			price_list: "Retail",
			currency: "USD",
			customer: "CUST-OLD",
		});
		const second = store.ensureActiveRules({
			pos_profile: "Main POS",
			company: "Test Co",
			price_list: "Retail",
			currency: "USD",
			customer: "CUST-NEW",
		});

		resolvers[1]({ message: [{ name: "NEW-RULE" }] });
		await second;
		resolvers[0]({ message: [{ name: "OLD-RULE" }] });
		await first;

		expect(store.rules.map((rule) => rule.name)).toEqual(["NEW-RULE"]);
		expect(store.contextKey).toContain("CUST-NEW");
	});

	it("does not call the protected endpoint without a POS Profile", async () => {
		const call = vi.fn();
		(globalThis as any).frappe = { call };
		const store = usePricingRulesStore();

		await store.ensureActiveRules({
			company: "Test Co",
			price_list: "Retail",
			currency: "USD",
		});

		expect(call).not.toHaveBeenCalled();
	});

	it("builds the authorized pricing context from the active profile", () => {
		expect(
			buildPricingRuleContext({
				name: "Main POS",
				company: "Test Co",
				selling_price_list: "Retail",
				currency: "USD",
			}),
		).toEqual(
			expect.objectContaining({
				pos_profile: "Main POS",
				company: "Test Co",
				price_list: "Retail",
				currency: "USD",
			}),
		);
	});

	it("propagates endpoint failures so readiness is not reported as successful", async () => {
		const failure = new Error("pricing endpoint failed");
		const call = vi.fn().mockRejectedValue(failure);
		(globalThis as any).frappe = { call };
		const store = usePricingRulesStore();

		await expect(
			store.ensureActiveRules({
				pos_profile: "Main POS",
				company: "Test Co",
				price_list: "Retail",
				currency: "USD",
			}),
		).rejects.toBe(failure);
		expect(store.loading).toBe(false);
	});
});
