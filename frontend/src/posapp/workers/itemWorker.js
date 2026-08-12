/* eslint-env worker */
/* global Dexie */

let db;
const BASE_SCHEMA = {
	keyval: "&key",
	queue: "&key",
	write_queue:
		"++queue_id,entity_type,status,resource,next_attempt_at,created_at,last_attempt_at,retry_count,&idempotency_key,[entity_type+status],[status+next_attempt_at]",
	invoice_outbox:
		"++outbox_id,&client_request_id,status,resource,created_at,next_retry_at,nextAttemptAt,retry_count,[status+next_retry_at],[resource+status],[status+nextAttemptAt]",
	cache: "&key",
	items: "&item_code,item_name,item_group,*barcodes,*name_keywords,*serials,*batches",
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
};

const SCHEMA_V14 = {
	...BASE_SCHEMA,
	item_price_records:
		"&name,price_list,item_code,uom,currency,customer,modified,[price_list+item_code],[price_list+item_code+uom]",
	pricing_rule_records: "&key,rule_name,target_type,target_value,modified,[target_type+target_value]",
	currency_rate_records:
		"&name,profile_name,company,from_currency,to_currency,date,modified,[profile_name+company+from_currency+to_currency]",
};

const SCHEMA_V15 = {
	...SCHEMA_V14,
	write_queue:
		"++queue_id,entity_type,status,resource,next_attempt_at,created_at,last_attempt_at,retry_count,&idempotency_key,[entity_type+status],[status+next_attempt_at],[status+last_attempt_at],[status+created_at]",
	invoice_outbox:
		"++outbox_id,&client_request_id,status,resource,created_at,updated_at,acknowledged_at,next_retry_at,nextAttemptAt,retry_count,[status+next_retry_at],[resource+status],[status+nextAttemptAt],[status+acknowledged_at],[status+updated_at],[status+created_at]",
};

const SCHEMA_V16 = {
	...SCHEMA_V15,
	items: "&item_code,item_name,item_group,profile_scope,item_code_lc,item_name_lc,*barcodes,*barcodes_lc,*name_keywords,*name_keywords_lc,*serials,*batches",
};

const SCHEMA_V17 = {
	...SCHEMA_V16,
	items: null,
};

const SCHEMA_V18 = {
	...SCHEMA_V17,
	items: "&[profile_scope+item_code],profile_scope,item_code,item_name,item_group,[profile_scope+item_code_lc],[profile_scope+item_group],item_code_lc,item_name_lc,*barcodes,*barcodes_lc,*name_keywords,*name_keywords_lc,*serials,*batches",
};

const SCHEMA_V19 = {
	...SCHEMA_V18,
	customers: null,
	write_queue:
		"++queue_id,owner_scope,entity_type,status,resource,next_attempt_at,created_at,last_attempt_at,retry_count,&[owner_scope+idempotency_key],[owner_scope+entity_type],[owner_scope+entity_type+status],[owner_scope+status+next_attempt_at],[status+last_attempt_at],[status+created_at]",
	invoice_outbox:
		"++outbox_id,owner_scope,client_request_id,status,resource,created_at,updated_at,acknowledged_at,next_retry_at,nextAttemptAt,retry_count,&[owner_scope+client_request_id],[owner_scope+status],[owner_scope+status+next_retry_at],[resource+status],[status+acknowledged_at],[status+updated_at],[status+created_at]",
};

const SCHEMA_V20 = {
	...SCHEMA_V19,
	customers:
		"&[customer_scope+name],customer_scope,name,customer_name,mobile_no,email_id,tax_id,[customer_scope+customer_name]",
	item_price_records: null,
	pricing_rule_records: null,
};

const SCHEMA_V21 = {
	...SCHEMA_V20,
	item_price_records:
		"&[profile_scope+name],profile_scope,name,price_list,item_code,uom,currency,customer,modified,[profile_scope+price_list+item_code],[profile_scope+price_list+item_code+uom]",
	pricing_rule_records:
		"&[profile_scope+key],profile_scope,key,rule_name,target_type,target_value,modified,[profile_scope+rule_name],[profile_scope+target_type+target_value]",
	currency_rate_records: null,
};

const SCHEMA_V22 = {
	...SCHEMA_V21,
	currency_rate_records:
		"&[profile_scope+name],profile_scope,name,profile_name,company,from_currency,to_currency,date,modified,[profile_scope+company+from_currency+to_currency]",
};

const SCHEMA_V23 = {
	...SCHEMA_V22,
	customers:
		"&[customer_scope+name],customer_scope,name,customer_name,mobile_no,email_id,tax_id,customer_name_lc,mobile_no_normalized,email_id_lc,tax_id_lc,[customer_scope+customer_name_lc],[customer_scope+mobile_no_normalized],[customer_scope+email_id_lc],[customer_scope+tax_id_lc]",
	customer_search_tokens:
		"&[customer_scope+token+customer_name],customer_scope,token,customer_name,[customer_scope+token],[customer_scope+customer_name]",
};

const SCHEMA_SIGNATURE = JSON.stringify(SCHEMA_V23);

const normalizeSearchValue = (value) =>
	String(value || "")
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();

const uniqueStrings = (values) =>
	Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));

const buildCustomerIndexTokens = (customer) => {
	const values = [
		customer?.name,
		customer?.customer_name,
		customer?.mobile_no,
		customer?.email_id,
		customer?.tax_id,
	];
	const tokens = new Set();
	for (const value of values) {
		const normalized = String(value || "")
			.trim()
			.toLowerCase();
		if (!normalized) continue;
		tokens.add(normalized.slice(0, 140));
		for (const part of normalized.split(/[^\p{L}\p{N}@.+_-]+/u)) {
			if (part) tokens.add(part.slice(0, 140));
		}
		const digits = normalized.replace(/\D/g, "");
		if (digits.length >= 4) tokens.add(digits.slice(0, 40));
	}
	return Array.from(tokens).slice(0, 32);
};

const deriveItemSearchFields = (it) => {
	const barcodes = uniqueStrings([
		...(Array.isArray(it.item_barcode)
			? it.item_barcode.map((b) => b && b.barcode)
			: it.item_barcode
				? [String(it.item_barcode)]
				: []),
		...(Array.isArray(it.barcodes)
			? it.barcodes.map((entry) => (entry && typeof entry === "object" ? entry.barcode : entry))
			: []),
	]);
	const nameKeywords = uniqueStrings(it.item_name ? normalizeSearchValue(it.item_name).split(/\s+/) : []);
	const itemCodeLc = normalizeSearchValue(it.item_code);
	const itemNameLc = normalizeSearchValue(it.item_name);
	const barcodesLc = barcodes.map(normalizeSearchValue).filter(Boolean);
	const nameKeywordsLc = nameKeywords.map(normalizeSearchValue).filter(Boolean);

	return {
		barcodes,
		name_keywords: nameKeywords,
		item_code_lc: itemCodeLc,
		item_name_lc: itemNameLc,
		barcodes_lc: barcodesLc,
		name_keywords_lc: nameKeywordsLc,
		search_text: [itemCodeLc, itemNameLc, ...barcodesLc, ...nameKeywordsLc].filter(Boolean).join(" "),
	};
};

const workerAssetVersion = (() => {
	try {
		return new URL(self.location.href).searchParams.get("v") || "dev";
	} catch {
		return "dev";
	}
})();
const dexieAssetUrl = `/assets/posawesome/dist/js/libs/dexie.min.js?v=${encodeURIComponent(
	workerAssetVersion,
)}`;

function workerErrorMessage(error) {
	if (!error) return "Unknown IndexedDB worker error";
	const name = typeof error.name === "string" ? error.name.trim() : "";
	const message =
		typeof error.message === "string" && error.message.trim() ? error.message.trim() : String(error);
	return name && !message.startsWith(name) ? `${name}: ${message}` : message;
}

let dbOpenFailure = null;
const dbReady = (async () => {
	let DexieLib;
	try {
		importScripts(dexieAssetUrl);
		DexieLib = { default: Dexie };
	} catch {
		// Fallback to dynamic import when importScripts fails
		DexieLib = await import(dexieAssetUrl);
	}
	db = new DexieLib.default("posawesome_offline");
	db.version(7)
		.stores({
			keyval: "&key",
			queue: "&key",
			cache: "&key",
			items: "&item_code,item_name,item_group,*barcodes,*name_keywords,*serials,*batches",
			item_prices: "&[price_list+item_code],price_list,item_code",
			customers: "&name,customer_name,mobile_no,email_id,tax_id",
		})
		.upgrade((tx) =>
			tx
				.table("items")
				.toCollection()
				.modify((item) => {
					item.barcodes = Array.isArray(item.item_barcode)
						? item.item_barcode.map((b) => b.barcode).filter(Boolean)
						: item.item_barcode
							? [String(item.item_barcode)]
							: [];
					item.name_keywords = item.item_name
						? item.item_name.toLowerCase().split(/\s+/).filter(Boolean)
						: [];
					item.serials = Array.isArray(item.serial_no_data)
						? item.serial_no_data.map((s) => s.serial_no).filter(Boolean)
						: [];
					item.batches = Array.isArray(item.batch_no_data)
						? item.batch_no_data.map((b) => b.batch_no).filter(Boolean)
						: [];
				}),
		);
	db.version(8)
		.stores({
			keyval: "&key",
			queue: "&key",
			cache: "&key",
			items: "&item_code,item_name,item_group,*barcodes,*name_keywords,*serials,*batches",
			item_prices: "&[price_list+item_code],price_list,item_code",
			customers: "&name,customer_name,mobile_no,email_id,tax_id",
			local_stock: "&key",
			coupons: "&key",
			item_groups: "&key",
			translations: "&key",
			pricing_rules: "&key",
		})
		.upgrade(async (tx) => {
			const migrateKey = async (key, targetTable) => {
				try {
					const entry = await tx.table("keyval").get(key);
					if (entry) {
						await tx.table(targetTable).put(entry);
					}
				} catch (err) {
					console.warn(`Worker migration failed for ${key} -> ${targetTable}`, err);
				}
			};

			await Promise.all([
				migrateKey("local_stock_cache", "local_stock"),
				migrateKey("coupons_cache", "coupons"),
				migrateKey("item_groups_cache", "item_groups"),
				migrateKey("translation_cache", "translations"),
				migrateKey("pricing_rules_snapshot", "pricing_rules"),
				migrateKey("pricing_rules_context", "pricing_rules"),
				migrateKey("pricing_rules_last_sync", "pricing_rules"),
				migrateKey("pricing_rules_stale_at", "pricing_rules"),
			]);
		});
	db.version(9)
		.stores(BASE_SCHEMA)
		.upgrade(async (tx) => {
			const migrateKey = async (key, targetTable) => {
				try {
					const entry = await tx.table("keyval").get(key);
					if (entry) {
						await tx.table(targetTable).put(entry);
					}
				} catch (err) {
					console.warn(`Worker migration failed for ${key} -> ${targetTable}`, err);
				}
			};

			const settingsKeys = [
				"cache_version",
				"cache_ready",
				"stock_cache_ready",
				"manual_offline",
				"invoice_outbox_mode",
				"bootstrap_snapshot",
				"bootstrap_snapshot_status",
				"bootstrap_limited_mode",
				"schema_signature",
			];

			const syncStateKeys = [
				"items_last_sync",
				"customers_last_sync",
				"payment_methods_last_sync",
				"pos_last_sync_totals",
			];

			await Promise.all([
				migrateKey("local_stock_cache", "local_stock"),
				migrateKey("coupons_cache", "coupons"),
				migrateKey("item_groups_cache", "item_groups"),
				migrateKey("translation_cache", "translations"),
				migrateKey("pricing_rules_snapshot", "pricing_rules"),
				migrateKey("pricing_rules_context", "pricing_rules"),
				migrateKey("pricing_rules_last_sync", "pricing_rules"),
				migrateKey("pricing_rules_stale_at", "pricing_rules"),
				...settingsKeys.map((key) => migrateKey(key, "settings")),
				...syncStateKeys.map((key) => migrateKey(key, "sync_state")),
			]);

			try {
				await tx.table("settings").put({ key: "schema_signature", value: SCHEMA_SIGNATURE });
			} catch (err) {
				console.warn("Worker failed to persist schema signature", err);
			}
		});
	db.version(10).stores(BASE_SCHEMA);
	db.version(11).stores(BASE_SCHEMA);
	db.version(12).stores(BASE_SCHEMA);
	db.version(13).stores(BASE_SCHEMA);
	db.version(14).stores(SCHEMA_V14);
	db.version(15).stores(SCHEMA_V15);
	db.version(16).stores(SCHEMA_V16);
	db.version(17)
		.stores(SCHEMA_V17)
		.upgrade(async (tx) => {
			await tx.table("sync_state").clear();
			await tx.table("local_stock").clear();
			await tx.table("cache").delete("item_details_cache");
			await tx.table("settings").bulkPut([
				{ key: "cache_ready", value: false },
				{ key: "stock_cache_ready", value: false },
			]);
		});
	db.version(18).stores(SCHEMA_V18);
	db.version(19)
		.stores(SCHEMA_V19)
		.upgrade(async (tx) => {
			await tx
				.table("write_queue")
				.toCollection()
				.modify((entry) => {
					entry.owner_scope = String(entry.owner_scope || "").trim() || "legacy::unclaimed";
				});
			await tx
				.table("invoice_outbox")
				.toCollection()
				.modify((entry) => {
					entry.owner_scope = String(entry.owner_scope || "").trim() || "legacy::unclaimed";
				});
			await tx.table("sync_state").clear();
		});
	db.version(20).stores(SCHEMA_V20);
	db.version(21).stores(SCHEMA_V21);
	db.version(22)
		.stores(SCHEMA_V22)
		.upgrade(async (tx) => {
			const writeQueue = tx.table("write_queue");
			const outbox = tx.table("invoice_outbox");
			const invoiceRows = await writeQueue.where("entity_type").equals("invoice").toArray();
			for (const row of invoiceRows) {
				const payload = row?.payload || {};
				const invoice = { ...(payload?.invoice || {}) };
				const data = { ...(payload?.data || {}) };
				const fallbackKey = String(row?.idempotency_key || "")
					.replace(/^invoice:/, "")
					.trim();
				const clientRequestId = String(
					invoice?.posa_client_request_id ||
						data?.idempotency_key ||
						data?.client_request_id ||
						fallbackKey ||
						`legacy-invoice-${row.queue_id}`,
				).trim();
				const ownerScope = String(row?.owner_scope || "").trim() || "legacy::unclaimed";
				invoice.posa_client_request_id = clientRequestId;
				data.idempotency_key = data.idempotency_key || clientRequestId;
				data.client_request_id = data.client_request_id || clientRequestId;
				const existing = await outbox
					.where("[owner_scope+client_request_id]")
					.equals([ownerScope, clientRequestId])
					.first();
				if (!existing) {
					const deadLetter = row?.status === "dead_letter";
					await outbox.add({
						client_request_id: clientRequestId,
						owner_scope: ownerScope,
						resource: "invoice_outbox",
						status: deadLetter ? "dead_letter" : "pending",
						invoice,
						data,
						created_at: row?.created_at || new Date().toISOString(),
						updated_at: row?.last_attempt_at || row?.created_at || new Date().toISOString(),
						next_retry_at: deadLetter ? null : row?.next_attempt_at || null,
						nextAttemptAt: deadLetter ? null : row?.next_attempt_at || null,
						retry_count: Number(row?.retry_count || 0),
						last_error: row?.last_error || null,
						invoice_name: null,
						acknowledged_at: null,
						lease_token: null,
					});
				}
				await writeQueue.delete(row.queue_id);
			}
			await tx.table("settings").put({
				key: "invoice_outbox_mode",
				value: "coordinator",
			});
		});
	db.version(23)
		.stores(SCHEMA_V23)
		.upgrade(async (tx) => {
			const customers = tx.table("customers");
			const searchTokens = tx.table("customer_search_tokens");
			const keys = await customers.toCollection().primaryKeys();
			const chunkSize = 500;
			for (let index = 0; index < keys.length; index += chunkSize) {
				const rows = (await customers.bulkGet(keys.slice(index, index + chunkSize))).filter(Boolean);
				const normalizedRows = rows.map((customer) => ({
					...customer,
					customer_name_lc: String(customer.customer_name || customer.name || "")
						.trim()
						.toLowerCase(),
					mobile_no_normalized: String(customer.mobile_no || "").replace(/\D/g, ""),
					email_id_lc: String(customer.email_id || "")
						.trim()
						.toLowerCase(),
					tax_id_lc: String(customer.tax_id || "")
						.trim()
						.toLowerCase(),
				}));
				await customers.bulkPut(normalizedRows);
				const tokenRows = normalizedRows.flatMap((customer) =>
					buildCustomerIndexTokens(customer).map((token) => ({
						customer_scope: customer.customer_scope,
						token,
						customer_name: customer.name,
					})),
				);
				if (tokenRows.length) await searchTokens.bulkPut(tokenRows);
			}
		});
	try {
		await db.open();
	} catch (err) {
		dbOpenFailure = err;
		self.postMessage({
			type: "persist_worker_unavailable",
			error: workerErrorMessage(err),
		});
		return null;
	}
	return db;
})();

async function ensureWorkerDbReady() {
	const readyDb = await dbReady;
	if (!readyDb) {
		throw new Error(workerErrorMessage(dbOpenFailure));
	}
	if (!readyDb.isOpen()) {
		await readyDb.open();
	}
	return readyDb;
}

const KEY_TABLE_MAP = {
	offline_invoices: "queue",
	offline_customers: "queue",
	offline_payments: "queue",
	offline_cash_movements: "queue",
	item_details_cache: "cache",
	stored_value_snapshot_cache: "cache",
	gift_card_snapshot_cache: "cache",
	delivery_charges_cache: "cache",
	currency_options_cache: "cache",
	exchange_rate_cache: "cache",
	price_list_meta_cache: "cache",
	customer_addresses_cache: "cache",
	payment_method_currency_cache: "cache",
	local_stock_cache: "local_stock",
	coupons_cache: "coupons",
	item_groups_cache: "item_groups",
	translation_cache: "translations",
	pricing_rules_snapshot: "pricing_rules",
	pricing_rules_context: "pricing_rules",
	pricing_rules_last_sync: "pricing_rules",
	pricing_rules_stale_at: "pricing_rules",
	cache_version: "settings",
	cache_ready: "settings",
	stock_cache_ready: "settings",
	manual_offline: "settings",
	invoice_outbox_mode: "settings",
	bootstrap_snapshot: "settings",
	bootstrap_snapshot_status: "settings",
	bootstrap_limited_mode: "settings",
	schema_signature: "settings",
	items_last_sync: "sync_state",
	customers_last_sync: "sync_state",
	payment_methods_last_sync: "sync_state",
	pos_last_sync_totals: "sync_state",
};

// customer_storage is only an in-process hot cache. Durable customers live in
// the IndexedDB `customers` table, so the worker never persists this key.
const MEMORY_ONLY_KEYS = new Set(["customer_storage"]);
let persistBatchChain = Promise.resolve();

function tableForKey(key) {
	return KEY_TABLE_MAP[key] || "keyval";
}

async function safeBulkPut(tableName, rows) {
	if (!rows.length) {
		return;
	}

	const table = db.table(tableName);
	try {
		await db.transaction("rw", table, async () => {
			await table.bulkPut(rows);
		});
	} catch (error) {
		console.warn(`Worker bulkPut failed for ${tableName}; retrying row-by-row`, error);
		await db.transaction("rw", table, async () => {
			for (const row of rows) {
				await table.put(row);
			}
		});
	}
}

async function persistBatch(entries) {
	await ensureWorkerDbReady();
	const rowsByTable = new Map();
	for (const entry of entries || []) {
		if (!entry || MEMORY_ONLY_KEYS.has(entry.key)) {
			continue;
		}
		const tableName = tableForKey(entry.key);
		const rows = rowsByTable.get(tableName) || [];
		rows.push({ key: entry.key, value: entry.value });
		rowsByTable.set(tableName, rows);
	}

	await Promise.all(
		Array.from(rowsByTable.entries()).map(([tableName, rows]) => safeBulkPut(tableName, rows)),
	);
}

async function bulkPutItems(items, syncedAt = Date.now()) {
	try {
		await ensureWorkerDbReady();
		const CHUNK_SIZE = 1000;
		await db.transaction("rw", db.table("items"), async () => {
			for (let i = 0; i < items.length; i += CHUNK_SIZE) {
				const chunk = items.slice(i, i + CHUNK_SIZE).map((item) => ({
					...item,
					profile_scope: String(item.profile_scope || "").trim() || "legacy::unscoped",
					synced_at: syncedAt,
				}));
				await db.table("items").bulkPut(chunk);
			}
		});
	} catch (e) {
		console.error("Worker bulkPut items failed", e);
	}
}

async function bulkPutPrices(priceList, items, syncedAt = Date.now()) {
	try {
		if (!priceList) {
			return;
		}
		await ensureWorkerDbReady();
		const records = items.map((it) => {
			const price = it.price_list_rate ?? it.rate ?? 0;
			return {
				price_list: priceList,
				item_code: it.item_code,
				rate: price,
				price_list_rate: price,
				timestamp: syncedAt,
			};
		});
		await db.table("item_prices").bulkPut(records);
	} catch (e) {
		console.error("Worker bulkPut prices failed", e);
	}
}

self.onmessage = async (event) => {
	// Logging every message can flood the console and increase memory usage
	// when the worker is used for frequent persistence operations. Remove
	// the noisy log to keep the console clean.
	const data = event.data || {};
	if (data.type === "parse_and_cache") {
		try {
			let parsed = JSON.parse(data.json);
			let itemsRaw = parsed.message || parsed;
			let items;
			const syncTimestamp = data.syncedAt || Date.now();
			try {
				if (typeof structuredClone === "function") {
					items = structuredClone(itemsRaw);
				} else {
					// Fallback for older browsers
					items = JSON.parse(JSON.stringify(itemsRaw));
				}
			} catch (e) {
				console.error("Failed to clone items", e);
				self.postMessage({ type: "error", error: e.message });
				return;
			}
			let trimmed = items.map((it) => ({
				profile_scope: data.scope || it.profile_scope || "legacy::unscoped",
				item_code: it.item_code,
				item_name: it.item_name,
				description: it.description,
				stock_uom: it.stock_uom,
				image: it.image,
				item_group: it.item_group,
				rate: it.rate,
				price_list_rate: it.price_list_rate,
				currency: it.currency,
				item_barcode: it.item_barcode,
				item_uoms: it.item_uoms,
				actual_qty: it.actual_qty,
				has_batch_no: it.has_batch_no,
				has_serial_no: it.has_serial_no,
				has_variants: !!it.has_variants,
				...deriveItemSearchFields(it),
				serials: Array.isArray(it.serial_no_data)
					? it.serial_no_data.map((s) => s.serial_no).filter(Boolean)
					: [],
				batches: Array.isArray(it.batch_no_data)
					? it.batch_no_data.map((b) => b.batch_no).filter(Boolean)
					: [],
			}));
			await bulkPutItems(trimmed, syncTimestamp);
			await bulkPutPrices(data.priceList, trimmed, syncTimestamp);
			// Clear references to release memory before posting back
			items = null;
			itemsRaw = null;
			data.json = null;
			parsed = null;
			let out = trimmed;
			self.postMessage({ type: "parsed", items: out });
			trimmed.length = 0;
			trimmed = null;
		} catch (err) {
			console.log(err);
			self.postMessage({ type: "error", error: err.message });
		}
	} else if (data.type === "persist_batch") {
		try {
			const operation = persistBatchChain.then(() => persistBatch(data.entries));
			persistBatchChain = operation.catch(() => undefined);
			await operation;
			self.postMessage({
				type: "persisted_batch",
				batchId: data.batchId,
			});
		} catch (error) {
			self.postMessage({
				type: "persist_batch_failed",
				batchId: data.batchId,
				error: workerErrorMessage(error),
			});
		}
	} else if (data.type === "bulk_put_items") {
		await bulkPutItems(data.items || [], data.syncedAt || Date.now());
		self.postMessage({ type: "items_saved" });
	}
};
