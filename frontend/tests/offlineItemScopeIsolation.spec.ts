// @vitest-environment jsdom

import "fake-indexeddb/auto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, memory } from "../src/offline/db";
import {
	deleteStoredItemsByCodes,
	getAllStoredItems,
	saveItems,
} from "../src/offline/cache";
import {
	getSyncResourceState,
	setSyncResourceState,
} from "../src/offline/sync/syncState";
import {
	deleteCustomerStorageByNames,
	getStoredCustomer,
	setCustomerStorage,
} from "../src/offline/customers";
import {
	enqueueWriteQueueEntry,
	getQueueEntries,
} from "../src/offline/writeQueue";
import {
	enqueueInvoiceOutboxEntry,
	getInvoiceOutboxRows,
} from "../src/offline/invoiceOutbox";
import {
	getLocalStock,
	isStockCacheReady,
	setLocalStockCache,
	setStockCacheReady,
} from "../src/offline/stock";

describe("offline tenant and profile isolation", () => {
	beforeEach(async () => {
		(globalThis as any).frappe = {
			session: { user: "cashier-a@example.com" },
		};
		if (!db.isOpen()) await db.open();
		await db.table("items").clear();
		await db.table("sync_state").clear();
		await db.table("customers").clear();
		await db.table("customer_search_tokens").clear();
		await db.table("write_queue").clear();
		await db.table("invoice_outbox").clear();
		memory.local_stock_cache = {};
		memory.stock_cache_ready = false;
	});

	afterAll(async () => {
		db.close();
		delete (globalThis as any).frappe;
	});

	it("stores the same item code independently for two profile scopes", async () => {
		await saveItems(
			[{ item_code: "ITEM-001", item_name: "Warehouse A" }],
			"tenant::user::POS-A::WH-A",
		);
		await saveItems(
			[{ item_code: "ITEM-001", item_name: "Warehouse B" }],
			"tenant::user::POS-B::WH-B",
		);

		await expect(
			getAllStoredItems("tenant::user::POS-A::WH-A"),
		).resolves.toEqual([
			expect.objectContaining({
				item_code: "ITEM-001",
				item_name: "Warehouse A",
			}),
		]);
		await expect(
			getAllStoredItems("tenant::user::POS-B::WH-B"),
		).resolves.toEqual([
			expect.objectContaining({
				item_code: "ITEM-001",
				item_name: "Warehouse B",
			}),
		]);
	});

	it("deletes an item only from the requested profile scope", async () => {
		await saveItems(
			[{ item_code: "ITEM-001", item_name: "Warehouse A" }],
			"tenant::user::POS-A::WH-A",
		);
		await saveItems(
			[{ item_code: "ITEM-001", item_name: "Warehouse B" }],
			"tenant::user::POS-B::WH-B",
		);

		await deleteStoredItemsByCodes(
			["ITEM-001"],
			"tenant::user::POS-A::WH-A",
		);

		await expect(
			getAllStoredItems("tenant::user::POS-A::WH-A"),
		).resolves.toEqual([]);
		await expect(
			getAllStoredItems("tenant::user::POS-B::WH-B"),
		).resolves.toHaveLength(1);
	});

	it("does not expose sync cursors to a different session user", async () => {
		await setSyncResourceState({
			resourceId: "items",
			status: "fresh",
			lastSyncedAt: "2026-08-08T08:00:00Z",
			watermark: "wm-a",
			lastSuccessHash: null,
			lastError: null,
			consecutiveFailures: 0,
			lastAttemptAt: null,
			nextRetryAt: null,
			cooldownMs: null,
			lastTrigger: null,
			scopeSignature: "POS-A",
			schemaVersion: "2026-08-08",
		});

		(globalThis as any).frappe.session.user = "cashier-b@example.com";

		await expect(getSyncResourceState("items")).resolves.toBeNull();
	});

	it("stores customer records independently per profile scope", async () => {
		await setCustomerStorage(
			[{ name: "CUST-001", customer_name: "Profile A Customer" }],
			"tenant::user::POS-A",
		);
		await setCustomerStorage(
			[{ name: "CUST-001", customer_name: "Profile B Customer" }],
			"tenant::user::POS-B",
		);

		await expect(
			getStoredCustomer("CUST-001", "tenant::user::POS-A"),
		).resolves.toEqual(
			expect.objectContaining({ customer_name: "Profile A Customer" }),
		);
		await expect(
			getStoredCustomer("CUST-001", "tenant::user::POS-B"),
		).resolves.toEqual(
			expect.objectContaining({ customer_name: "Profile B Customer" }),
		);
	});

	it("indexes customer prefixes per scope and removes tokens atomically", async () => {
		await setCustomerStorage(
			[
				{
					name: "CUST-AHMED",
					customer_name: "Ahmed Mohamed",
					mobile_no: "+20 100 555 1212",
				},
			],
			"tenant::user::POS-A",
		);
		await setCustomerStorage(
			[{ name: "CUST-AHMED", customer_name: "Other Scope" }],
			"tenant::user::POS-B",
		);

		const indexed = await db
			.table("customer_search_tokens")
			.where("[customer_scope+token]")
			.between(
				["tenant::user::POS-A", "moh"],
				["tenant::user::POS-A", "moh\uffff"],
				true,
				true,
			)
			.toArray();
		expect(indexed).toEqual([
			expect.objectContaining({ customer_name: "CUST-AHMED" }),
		]);

		await deleteCustomerStorageByNames(
			["CUST-AHMED"],
			"tenant::user::POS-A",
		);
		expect(
			await db
				.table("customer_search_tokens")
				.where("customer_scope")
				.equals("tenant::user::POS-A")
				.count(),
		).toBe(0);
		expect(
			await db
				.table("customer_search_tokens")
				.where("customer_scope")
				.equals("tenant::user::POS-B")
				.count(),
		).toBeGreaterThan(0);
	});

	it("isolates stock quantities and readiness per profile scope", () => {
		setLocalStockCache(
			{ "ITEM-001": { actual_qty: 4 } },
			"tenant::user::POS-A::WH-A",
		);
		setStockCacheReady(true, "tenant::user::POS-A::WH-A");
		setLocalStockCache(
			{ "ITEM-001": { actual_qty: 19 } },
			"tenant::user::POS-B::WH-B",
		);

		expect(getLocalStock("ITEM-001", "tenant::user::POS-A::WH-A")).toBe(4);
		expect(getLocalStock("ITEM-001", "tenant::user::POS-B::WH-B")).toBe(19);
		expect(isStockCacheReady("tenant::user::POS-A::WH-A")).toBe(true);
		expect(isStockCacheReady("tenant::user::POS-B::WH-B")).toBe(false);
	});

	it("does not let another session user claim queued financial writes", async () => {
		await enqueueWriteQueueEntry("payment", {
			args: {
				payload: {
					client_request_id: "payment-owner-a",
					amount: 10,
				},
			},
		});
		await enqueueInvoiceOutboxEntry({
			invoice: {
				posa_client_request_id: "invoice-owner-a",
				items: [{ item_code: "ITEM-001", qty: 1 }],
			},
			data: {},
		});

		(globalThis as any).frappe.session.user = "cashier-b@example.com";

		await expect(getQueueEntries("payment")).resolves.toEqual([]);
		await expect(getInvoiceOutboxRows()).resolves.toEqual([]);
	});
});
