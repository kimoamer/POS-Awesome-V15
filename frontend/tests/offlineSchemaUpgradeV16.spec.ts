// @vitest-environment jsdom

import "fake-indexeddb/auto";

import Dexie from "dexie/dist/dexie.mjs";
import { afterEach, describe, expect, it, vi } from "vitest";

const DB_NAME = "posawesome_offline";

const LEGACY_V16_SCHEMA = {
	keyval: "&key",
	queue: "&key",
	write_queue:
		"++queue_id,entity_type,status,resource,next_attempt_at,created_at,last_attempt_at,retry_count,&idempotency_key,[entity_type+status],[status+next_attempt_at],[status+last_attempt_at],[status+created_at]",
	invoice_outbox:
		"++outbox_id,&client_request_id,status,resource,created_at,updated_at,acknowledged_at,next_retry_at,nextAttemptAt,retry_count,[status+next_retry_at],[resource+status],[status+nextAttemptAt],[status+acknowledged_at],[status+updated_at],[status+created_at]",
	cache: "&key",
	items: "&item_code,item_name,item_group,profile_scope,item_code_lc,item_name_lc,*barcodes,*barcodes_lc,*name_keywords,*name_keywords_lc,*serials,*batches",
	item_prices: "&[price_list+item_code],price_list,item_code",
	customers: "&name,customer_name,mobile_no,email_id,tax_id",
	pos_profiles: "&name",
	opening_shifts: "&name,user,pos_profile",
	local_stock: "&key",
	coupons: "&key",
	item_groups: "&key",
	translations: "&key",
	pricing_rules: "&key",
	settings: "&key",
	sync_state: "&key,resourceId,status,nextRetryAt,lastAttemptAt,updated_at",
	item_price_records:
		"&name,price_list,item_code,uom,currency,customer,modified,[price_list+item_code],[price_list+item_code+uom]",
	pricing_rule_records:
		"&key,rule_name,target_type,target_value,modified,[target_type+target_value]",
	currency_rate_records:
		"&name,profile_name,company,from_currency,to_currency,date,modified,[profile_name+company+from_currency+to_currency]",
};

describe("offline schema v16 migration", () => {
	afterEach(async () => {
		vi.unstubAllGlobals();
		vi.resetModules();
		await Dexie.delete(DB_NAME);
	});

	it("rebuilds derived compound-key stores without losing pending financial writes", async () => {
		await Dexie.delete(DB_NAME);
		const legacyDb = new Dexie(DB_NAME);
		legacyDb.version(16).stores(LEGACY_V16_SCHEMA);
		await legacyDb.open();

		await legacyDb.table("items").put({
			item_code: "ITEM-1",
			item_name: "Legacy item",
			profile_scope: "legacy",
		});
		await legacyDb.table("customers").put({
			name: "CUST-1",
			customer_name: "Legacy customer",
		});
		await legacyDb.table("item_price_records").put({
			name: "PRICE-1",
			price_list: "Standard Selling",
			item_code: "ITEM-1",
		});
		await legacyDb.table("pricing_rule_records").put({
			key: "RULE-1",
			rule_name: "RULE-1",
		});
		await legacyDb.table("currency_rate_records").put({
			name: "RATE-1",
			from_currency: "USD",
			to_currency: "EGP",
		});

		const now = new Date().toISOString();
		await legacyDb.table("write_queue").bulkAdd([
			{
				entity_type: "payment",
				resource: "payment",
				payload: { amount: 100 },
				created_at: now,
				last_attempt_at: null,
				next_attempt_at: null,
				retry_count: 0,
				status: "pending",
				idempotency_key: "legacy-payment",
				last_error: null,
			},
			{
				entity_type: "invoice",
				resource: "invoice",
				payload: {
					invoice: { posa_client_request_id: "legacy-invoice" },
					data: {},
				},
				created_at: now,
				last_attempt_at: null,
				next_attempt_at: null,
				retry_count: 0,
				status: "pending",
				idempotency_key: "invoice:legacy-invoice",
				last_error: null,
			},
		]);
		legacyDb.close();

		vi.stubGlobal("Worker", undefined);
		const { db, startupInitPromise } = await import("../src/offline/db");
		await startupInitPromise;
		await db.open();

		expect(db.verno).toBe(23);
		for (const tableName of [
			"items",
			"customers",
			"item_price_records",
			"pricing_rule_records",
			"currency_rate_records",
		]) {
			expect(await db.table(tableName).count(), tableName).toBe(0);
		}

		const payment = await db
			.table("write_queue")
			.where("[owner_scope+idempotency_key]")
			.equals(["legacy::unclaimed", "legacy-payment"])
			.first();
		expect(payment).toEqual(
			expect.objectContaining({
				status: "pending",
				payload: { amount: 100 },
			}),
		);
		expect(
			await db
				.table("invoice_outbox")
				.where("[owner_scope+client_request_id]")
				.equals(["legacy::unclaimed", "legacy-invoice"])
				.first(),
		).toEqual(
			expect.objectContaining({
				status: "pending",
				client_request_id: "legacy-invoice",
			}),
		);

		await db.table("items").bulkPut([
			{ profile_scope: "PROFILE-A", item_code: "ITEM-1" },
			{ profile_scope: "PROFILE-B", item_code: "ITEM-1" },
		]);
		await db.table("customers").bulkPut([
			{ customer_scope: "PROFILE-A", name: "CUST-1" },
			{ customer_scope: "PROFILE-B", name: "CUST-1" },
		]);
		expect(await db.table("items").count()).toBe(2);
		expect(await db.table("customers").count()).toBe(2);

		db.close();
	});
});
