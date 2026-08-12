import { beforeEach, describe, expect, it } from "vitest";
import {
	can,
	resetCapabilityContextForTests,
	resolveCapability,
	setCapabilityContext,
	type CapabilityContext,
} from "../src/posapp/services/capabilities";

function context(
	patch: Partial<CapabilityContext> = {},
): CapabilityContext {
	return {
		posProfile: {
			name: "POS-1",
			posa_use_pos_awesome_payments: 1,
			posa_allow_make_new_payments: 1,
			posa_allow_purchase_order: 1,
			posa_enable_awesome_dashboard: 1,
			posa_allow_return: 1,
		},
		currentCashier: null,
		roles: ["Sales User"],
		doctypePermissions: {
			"POS Invoice": { create: true },
			"Sales Invoice": { create: true, read: true },
			"Payment Entry": { create: true },
			"Purchase Order": { create: true },
			Item: { read: true, print: true },
		},
		networkOnline: true,
		hasOpeningShift: true,
		ready: true,
		...patch,
	};
}

describe("central POS capability registry", () => {
	beforeEach(() => {
		resetCapabilityContextForTests();
		delete (globalThis as any).frappe;
	});

	it("combines POS Profile flags with authoritative DocType permissions", () => {
		const deniedPayment = context({
			doctypePermissions: {
				...context().doctypePermissions,
				"Payment Entry": { create: false },
			},
		});

		expect(resolveCapability("pos.sale", deniedPayment)).toBe(true);
		expect(resolveCapability("payments.manage", deniedPayment)).toBe(false);
		expect(resolveCapability("purchase_order.create", deniedPayment)).toBe(
			true,
		);
	});

	it("does not expose profile-disabled purchase and return workflows", () => {
		const profileDisabled = context({
			posProfile: {
				...context().posProfile,
				posa_allow_purchase_order: 0,
				posa_allow_return: 0,
			},
		});

		expect(resolveCapability("purchase_order.create", profileDisabled)).toBe(
			false,
		);
		expect(resolveCapability("return.create", profileDisabled)).toBe(false);
	});

	it("allows payments when any configured payment workflow is enabled", () => {
		const reconcileOnly = context({
			posProfile: {
				...context().posProfile,
				posa_allow_make_new_payments: 0,
				posa_allow_reconcile_payments: 1,
			},
		});

		expect(resolveCapability("payments.manage", reconcileOnly)).toBe(true);
	});

	it("requires supervisor authority for dashboard and settings", () => {
		const cashier = context();
		const supervisor = context({
			currentCashier: { is_supervisor: true },
		});

		expect(resolveCapability("dashboard.view", cashier)).toBe(false);
		expect(resolveCapability("settings.manage", cashier)).toBe(false);
		expect(resolveCapability("dashboard.view", supervisor)).toBe(true);
		expect(resolveCapability("settings.manage", supervisor)).toBe(true);
	});

	it("updates all consumers from one runtime context", () => {
		setCapabilityContext(context({
			posProfile: {
				...context().posProfile,
				posa_allow_purchase_order: 0,
			},
		}));

		expect(can("pos.sale")).toBe(true);
		expect(can("purchase_order.create")).toBe(false);
	});
});
