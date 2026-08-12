// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { defineComponent, h } from "vue";

const offlineSpies = vi.hoisted(() => ({
	setOpeningStorage: vi.fn(),
	setBootstrapSnapshot: vi.fn(),
}));

vi.mock("../src/offline/index", () => ({
	getOpeningDialogStorage: vi.fn(() => null),
	setOpeningDialogStorage: vi.fn(),
	setOpeningStorage: offlineSpies.setOpeningStorage,
	getBootstrapSnapshot: vi.fn(() => null),
	setBootstrapSnapshot: offlineSpies.setBootstrapSnapshot,
	initPromise: Promise.resolve(),
	checkDbHealth: vi.fn(async () => true),
}));

vi.mock("../src/offline/bootstrapSnapshot", () => ({
	createBootstrapSnapshotFromRegisterData: vi.fn((registerData) => ({
		registerData,
	})),
}));

vi.mock("../src/posapp/services/authService", () => ({
	default: {
		logout: vi.fn(async () => ({})),
	},
}));

function createFrappeThenable<T>(value: T) {
	return {
		then(resolve: (result: T) => unknown) {
			resolve(value);
			return this;
		},
		catch() {
			return this;
		},
	};
}

describe("OpeningDialog submission", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(window as any).__ = (value: string) => value;
		(window as any).get_currency_symbol = (currency: string) => currency;
	});

	it("supports the Frappe 15 thenable that has no finally method", async () => {
		const opening = {
			name: "POS Opening Entry-0001",
			pos_profile: { name: "POS-1" },
		};
		const call = vi.fn((methodOrOptions: unknown) => {
			if (typeof methodOrOptions === "string") {
				return createFrappeThenable({ message: opening });
			}
			return undefined;
		});
		(globalThis as any).frappe = {
			call,
			set_route: vi.fn(),
		};

		const OpeningDialog = (
			await import("../src/posapp/components/pos/shift/OpeningDialog.vue")
		).default;
		const wrapper = shallowMount(OpeningDialog, {
			props: { dialog: true },
			global: {
				mocks: {
					$vuetify: { display: { smAndDown: false } },
				},
				stubs: {
					VTextField: defineComponent({
						props: { prefix: String },
						setup: () => () => h("div"),
					}),
				},
			},
		});
		await flushPromises();

		wrapper.vm.company = "Acme";
		await wrapper.vm.$nextTick();
		wrapper.vm.pos_profile = "POS-1";
		await wrapper.vm.$nextTick();
		wrapper.vm.payments_methods = [
			{ mode_of_payment: "Cash", amount: 100, currency: "EGP" },
		];
		await wrapper.vm.$nextTick();

		await expect(wrapper.vm.submit_dialog()).resolves.toBeUndefined();

		expect(call).toHaveBeenCalledWith(
			"posawesome.posawesome.api.shifts.create_opening_voucher",
			expect.objectContaining({
				company: "Acme",
				pos_profile: "POS-1",
			}),
		);
		expect(wrapper.vm.is_loading).toBe(false);
		expect(wrapper.emitted("register")?.[0]).toEqual([opening]);
		expect(wrapper.emitted("close")).toHaveLength(1);
	});
});
