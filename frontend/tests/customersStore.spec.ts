import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useCustomersStore } from "../src/posapp/stores/customersStore";
import type {
	CustomerInfo,
	CustomerSummary,
	StoredCustomer,
} from "../src/posapp/types/models";

const setCustomerStorageMock = vi.fn(async () => undefined);
const saveStoredValueSnapshotMock = vi.fn();
const offlineCustomerState = vi.hoisted(() => ({ count: 0 }));
const customerSyncMocks = vi.hoisted(() => ({
	runTrigger: vi.fn(async () => undefined),
}));

vi.mock("../src/offline/index", () => ({
	db: {
		isOpen: () => true,
		open: vi.fn(async () => undefined),
			table: vi.fn(() => ({
			where: vi.fn().mockReturnThis(),
			equals: vi.fn().mockReturnThis(),
			between: vi.fn().mockReturnThis(),
			filter: vi.fn().mockReturnThis(),
			offset: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			toArray: vi.fn(async () => []),
		})),
	},
	checkDbHealth: vi.fn(async () => undefined),
	setCustomerStorage: (...args: any[]) => setCustomerStorageMock(...args),
	saveStoredValueSnapshot: (...args: any[]) =>
		saveStoredValueSnapshotMock(...args),
	memoryInitPromise: Promise.resolve(),
	getCustomersLastSync: vi.fn(() => null),
	setCustomersLastSync: vi.fn(),
	getCustomerStorageCount: vi.fn(async () => offlineCustomerState.count),
	clearCustomerStorage: vi.fn(async () => undefined),
	isOffline: vi.fn(() => false),
	refreshBootstrapSnapshotFromCacheState: vi.fn(),
}));

vi.mock("../src/offline/sync/useSyncCoordinator", () => ({
	useSyncCoordinator: () => customerSyncMocks,
}));

describe("customersStore profile and customer dto handling", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		setCustomerStorageMock.mockClear();
		saveStoredValueSnapshotMock.mockClear();
		offlineCustomerState.count = 0;
		customerSyncMocks.runTrigger.mockReset();
		customerSyncMocks.runTrigger.mockResolvedValue(undefined);
		(globalThis as any).frappe = {
			call: vi.fn(),
		};
	});

	it("normalizes a wrapped pos_profile string into a profile name", () => {
		const store = useCustomersStore();

		store.setPosProfile({ pos_profile: "Main POS" });

		expect(store.posProfile?.name).toBe("Main POS");
	});

	it("accepts additive customer summary and info shapes through public store APIs", async () => {
		const store = useCustomersStore();
		store.setPosProfile({ name: "Main POS", company: "Test Co" });

		const customer: StoredCustomer = {
			name: "CUST-001",
			customer_name: "Customer One",
		};
		const info: CustomerInfo = {
			name: "CUST-001",
			stored_value_balance: 0,
			loyalty_points: 15,
		};

		await store.addOrUpdateCustomer(customer);
		store.setCustomerInfo(info);

		expect(store.customers).toEqual([
			expect.objectContaining({
				...customer,
				loyalty_points: 15,
				stored_value_balance: 0,
			}),
		]);
		expect(store.customerInfo).toEqual(info);
		expectTypeOf(store.customers).toEqualTypeOf<CustomerSummary[]>();
		expect(setCustomerStorageMock).toHaveBeenCalledWith(
			[customer],
			expect.stringContaining("::Main%20POS::"),
		);
	});

	it("adds fetched customer info to the visible selector list", () => {
		const store = useCustomersStore();
		const info: CustomerInfo = {
			name: "CUST-QUOTE",
			customer_name: "Quotation Customer",
			email_id: "quote@example.com",
		};

		store.setCustomerInfo(info);

		expect(store.customers).toContainEqual({
			name: "CUST-QUOTE",
			customer_name: "Quotation Customer",
			email_id: "quote@example.com",
		});
	});

	it("falls back to permission-filtered server search when local customers are empty", async () => {
		const store = useCustomersStore();
		store.setPosProfile({ name: "Main POS", company: "Test Co" });
		(globalThis as any).frappe.call.mockResolvedValue({
			message: [
				{
					name: "CUST-REMOTE",
					customer_name: "Remote Customer",
				},
			],
		});

		await store.searchCustomers("Remote");

		expect((globalThis as any).frappe.call).toHaveBeenCalledWith({
			method: "posawesome.posawesome.api.customers.get_customer_names",
			args: expect.objectContaining({
				pos_profile: "Main POS",
				search_text: "Remote",
			}),
		});
		expect(store.customers).toEqual([
			expect.objectContaining({ name: "CUST-REMOTE" }),
		]);
		expect(setCustomerStorageMock).toHaveBeenCalledWith(
			[expect.objectContaining({ name: "CUST-REMOTE" })],
			expect.stringContaining("::Main%20POS::"),
		);
	});

	it("routes customer hydration through the single offline sync coordinator", async () => {
		const store = useCustomersStore();
		store.setPosProfile({ name: "Main POS", company: "Test Co" });
		customerSyncMocks.runTrigger.mockImplementationOnce(async () => {
			offlineCustomerState.count = 450;
		});

		await store.get_customer_names();

		expect(customerSyncMocks.runTrigger).toHaveBeenCalledTimes(1);
		expect(customerSyncMocks.runTrigger).toHaveBeenCalledWith("timer");
		expect((globalThis as any).frappe.call).not.toHaveBeenCalled();
		expect(store.loadedCustomerCount).toBe(450);
		expect(store.loadProgress).toBe(100);
	});
});
