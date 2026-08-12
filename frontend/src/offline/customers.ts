import { checkDbHealth, db, isOffline, memory, persist } from "./db";
import {
	buildCustomerIndexTokens,
	buildCustomerSearchText,
	normalizeCustomerIndexValue,
} from "../posapp/stores/customers/customerSearch";
import { buildOfflineTenantScope } from "./scope";
import {
	claimRetryableQueueEntries,
	clearWriteQueueEntries,
	deleteWriteQueueEntryByIndex,
	enqueueWriteQueueEntry,
	getQueuedPayloadCount,
	getQueuedPayloadSnapshots,
	markWriteQueueEntryFailed,
	markWriteQueueEntrySynced,
	refreshQueueMemory,
	updateQueuedPayloads,
	type OfflineEntityType,
} from "./writeQueue";

type AnyRecord = Record<string, any>;

const CUSTOMER_ENTITY: OfflineEntityType = "customer";
const CUSTOMER_MEMORY_CACHE_LIMIT = 250;

export async function saveOfflineCustomer(entry: AnyRecord) {
	let cleanEntry;
	try {
		cleanEntry = JSON.parse(JSON.stringify(entry));
	} catch (error) {
		console.error("Failed to serialize offline customer", error);
		throw error;
	}

	return enqueueWriteQueueEntry(CUSTOMER_ENTITY, cleanEntry);
}

export async function updateOfflineInvoicesCustomer(
	oldName: string,
	newName: string,
) {
	let updated = false;

	await updateQueuedPayloads("invoice", (payload) => {
		if (payload?.invoice?.customer === oldName) {
			payload.invoice.customer = newName;
			if (payload.invoice.customer_name) {
				payload.invoice.customer_name = newName;
			}
			updated = true;
		}
		return payload;
	});

	if (updated) {
		await refreshQueueMemory("invoice");
	}
}

export function getOfflineCustomers() {
	return getQueuedPayloadSnapshots(CUSTOMER_ENTITY);
}

export async function clearOfflineCustomers() {
	await clearWriteQueueEntries(CUSTOMER_ENTITY);
}

export async function deleteOfflineCustomer(index: number) {
	await deleteWriteQueueEntryByIndex(CUSTOMER_ENTITY, index);
}

export function getPendingOfflineCustomerCount() {
	return getQueuedPayloadCount(CUSTOMER_ENTITY);
}

export async function syncOfflineCustomers() {
	const customers = getOfflineCustomers();
	if (!customers.length) {
		return { pending: 0, synced: 0 };
	}
	if (isOffline()) {
		return { pending: customers.length, synced: 0 };
	}

	const claimedEntries = await claimRetryableQueueEntries(CUSTOMER_ENTITY);
	if (!claimedEntries.length) {
		return { pending: getPendingOfflineCustomerCount(), synced: 0 };
	}

	let synced = 0;

	for (const entry of claimedEntries) {
		const queuedCustomer = entry.payload;
		try {
			const result = await frappe.call({
				method: "posawesome.posawesome.api.customers.create_customer",
				args: queuedCustomer.args,
			});
			synced += 1;
			await markWriteQueueEntrySynced(
				CUSTOMER_ENTITY,
				Number(entry.queue_id),
				entry.last_attempt_at,
			);

			if (
				result &&
				result.message &&
				result.message.name &&
				result.message.name !== queuedCustomer.args.customer_name
			) {
				await updateOfflineInvoicesCustomer(
					queuedCustomer.args.customer_name,
					result.message.name,
				);
			}
		} catch (error) {
			console.error("Failed to create customer", error);
			await markWriteQueueEntryFailed(
				CUSTOMER_ENTITY,
				Number(entry.queue_id),
				error,
				entry.last_attempt_at,
			);
		}
	}

	return { pending: getPendingOfflineCustomerCount(), synced };
}

// Historical helper names mention "storage", but the durable customer read model
// is db.table("customers"). memory.customer_storage is only a bounded hot cache
// for recently selected or updated customers.
export function getCustomerStorage(scope = buildOfflineTenantScope()) {
	return (memory.customer_storage || []).filter(
		(row: AnyRecord) => row?._offline_scope === scope,
	);
}

function mergeCustomerStorageRows(rows: AnyRecord[], scope: string) {
	const merged = new Map<string, AnyRecord>();
	const existingRows = Array.isArray(memory.customer_storage)
		? memory.customer_storage
		: [];

	existingRows.forEach((row) => {
		if (!row?.name || row?._offline_scope !== scope) {
			return;
		}
		merged.set(row.name, row);
	});

	rows.forEach((row) => {
		if (!row?.name) {
			return;
		}
		merged.delete(row.name);
		merged.set(row.name, row);
	});

	const mergedRows = Array.from(merged.values());
	return mergedRows.slice(-CUSTOMER_MEMORY_CACHE_LIMIT);
}

export async function getStoredCustomer(
	customerName: string,
	scope = buildOfflineTenantScope(),
) {
	try {
		const customers = getCustomerStorage(scope);
		const cachedCustomer = customers.find((c) => c.name === customerName);
		if (cachedCustomer) {
			return cachedCustomer;
		}

		await checkDbHealth();
		if (!db.isOpen()) {
			await db.open();
		}

		const storedCustomer = await db
			.table("customers")
			.get([scope, customerName]);
		if (storedCustomer?.name) {
			const otherScopes = (memory.customer_storage || []).filter(
				(row: AnyRecord) => row?._offline_scope !== scope,
			);
			memory.customer_storage = [
				...otherScopes,
				...mergeCustomerStorageRows([storedCustomer], scope),
			];
			return storedCustomer;
		}
		return null;
	} catch (error) {
		console.error("Failed to get stored customer", error);
		return null;
	}
}

export async function setCustomerStorage(
	customers: AnyRecord[],
	scope = buildOfflineTenantScope(),
) {
	try {
		await checkDbHealth();
		if (!db.isOpen()) {
			await db.open();
		}

		const existingByName = new Map<string, AnyRecord>();
		const existingRows = getCustomerStorage(scope);
		existingRows.forEach((row) => {
			if (row?.name) {
				existingByName.set(row.name, row);
			}
		});

		const incomingNames = Array.from(
			new Set(
				customers
					.map((customer) => customer?.name || customer?.customer)
					.filter(Boolean),
			),
		);
		const customerTable = db.table("customers");
		const tokenTable = db.table("customer_search_tokens");
		if (
			incomingNames.length &&
			typeof (customerTable as any).bulkGet === "function"
		) {
			const durableRows = await (customerTable as any).bulkGet(
				incomingNames.map((name) => [scope, name]),
			);
			for (const row of durableRows || []) {
				if (row?.name && !existingByName.has(row.name)) {
					existingByName.set(row.name, row);
				}
			}
		}

		const clean = customers.flatMap((customer, index) => {
			const name = customer.name || customer.customer;
			if (!name) {
				const customerIdentifier =
					customer.id ??
					customer.customerId ??
					customer.customer_id ??
					`row:${index}`;
				console.warn("Skipping customer cache row without a name", {
					customerIdentifier,
				});
				return [];
			}
			const existing = name ? existingByName.get(name) : null;
			const normalized = {
				...existing,
				...customer,
				name,
				customer_name:
					customer.customer_name ||
					existing?.customer_name ||
					customer.name ||
					customer.customer,
				mobile_no: customer.mobile_no ?? existing?.mobile_no,
				email_id: customer.email_id ?? existing?.email_id,
				primary_address:
					customer.primary_address ?? existing?.primary_address,
				tax_id: customer.tax_id ?? existing?.tax_id,
				loyalty_program:
					customer.loyalty_program ?? existing?.loyalty_program,
				loyalty_points:
					customer.loyalty_points !== undefined
						? customer.loyalty_points
						: existing?.loyalty_points,
				conversion_factor:
					customer.conversion_factor !== undefined
						? customer.conversion_factor
						: existing?.conversion_factor,
				stored_value_balance:
					customer.stored_value_balance ??
					existing?.stored_value_balance ??
					0,
				stored_value_sources:
					customer.stored_value_sources ??
					existing?.stored_value_sources ??
					0,
			};
			return [
				{
					...normalized,
					customer_scope: scope,
					_offline_scope: scope,
					_search_text: buildCustomerSearchText(normalized),
					customer_name_lc: normalizeCustomerIndexValue(
						normalized.customer_name || name,
					),
					mobile_no_normalized: String(
						normalized.mobile_no || "",
					).replace(/\D/g, ""),
					email_id_lc: normalizeCustomerIndexValue(normalized.email_id),
					tax_id_lc: normalizeCustomerIndexValue(normalized.tax_id),
				},
			];
		});

		await db.transaction("rw", customerTable, tokenTable, async () => {
			for (const name of incomingNames) {
				await tokenTable
					.where("[customer_scope+customer_name]")
					.equals([scope, name])
					.delete();
			}
			await customerTable.bulkPut(clean);
			const tokenRows = clean.flatMap((customer) =>
				buildCustomerIndexTokens(customer).map((token) => ({
					customer_scope: scope,
					token,
					customer_name: customer.name,
				})),
			);
			if (tokenRows.length) {
				await tokenTable.bulkPut(tokenRows);
			}
		});
		const otherScopes = (memory.customer_storage || []).filter(
			(row: AnyRecord) => row?._offline_scope !== scope,
		);
		memory.customer_storage = [
			...otherScopes,
			...mergeCustomerStorageRows(clean, scope),
		];
	} catch (error) {
		console.error("Failed to save customers to storage", error);
	}
}

export async function deleteCustomerStorageByNames(
	names: string[],
	scope = buildOfflineTenantScope(),
) {
	try {
		const normalizedNames = Array.from(
			new Set(
				(Array.isArray(names) ? names : [])
					.map((name) => String(name || "").trim())
					.filter(Boolean),
			),
		);
		if (!normalizedNames.length) {
			return;
		}
		const customerTable = db.table("customers");
		const tokenTable = db.table("customer_search_tokens");
		await db.transaction("rw", customerTable, tokenTable, async () => {
			await customerTable.bulkDelete(
				normalizedNames.map((name) => [scope, name]),
			);
			for (const name of normalizedNames) {
				await tokenTable
					.where("[customer_scope+customer_name]")
					.equals([scope, name])
					.delete();
			}
		});
		const deletedNames = new Set(normalizedNames);
		const existingRows = Array.isArray(memory.customer_storage)
			? memory.customer_storage
			: [];
		memory.customer_storage = existingRows.filter(
			(row) =>
				row?._offline_scope !== scope ||
				!deletedNames.has(String(row?.name || "").trim()),
		);
	} catch (error) {
		console.error("Failed to delete customers from storage", error);
	}
}

function getStoredValueSnapshotKey(customer: string, company: string) {
	return `${String(company || "").trim()}::${String(customer || "").trim()}`;
}

export function saveStoredValueSnapshot(
	customer: string,
	company: string,
	sources: AnyRecord[],
) {
	try {
		const key = getStoredValueSnapshotKey(customer, company);
		if (!key.trim() || !Array.isArray(sources)) {
			return;
		}
		const cleanSources = JSON.parse(JSON.stringify(sources));
		const availableAmount = cleanSources.reduce(
			(sum: number, row: AnyRecord) =>
				sum + Number(row?.total_credit || 0),
			0,
		);
		const cache = memory.stored_value_snapshot_cache || {};
		cache[key] = {
			customer,
			company,
			sources: cleanSources,
			available_amount: availableAmount,
			source_count: cleanSources.length,
			timestamp: Date.now(),
		};
		memory.stored_value_snapshot_cache = cache;
		persist("stored_value_snapshot_cache");
	} catch (error) {
		console.error("Failed to cache stored value snapshot", error);
	}
}

export function getCachedStoredValueSnapshot(
	customer: string,
	company: string,
) {
	try {
		const key = getStoredValueSnapshotKey(customer, company);
		const cache = memory.stored_value_snapshot_cache || {};
		const cachedData = cache[key];
		if (cachedData) {
			const isValid =
				Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000;
			return isValid ? cachedData : null;
		}
		return null;
	} catch (error) {
		console.error("Failed to get cached stored value snapshot", error);
		return null;
	}
}

export function clearStoredValueSnapshotCache() {
	try {
		memory.stored_value_snapshot_cache = {};
		persist("stored_value_snapshot_cache");
	} catch (error) {
		console.error("Failed to clear stored value snapshot cache", error);
	}
}

export function saveGiftCardSnapshot(
	giftCardCode: string,
	snapshot: AnyRecord,
) {
	try {
		const code = String(giftCardCode || "")
			.trim()
			.toUpperCase();
		if (!code) {
			return;
		}
		const cache = memory.gift_card_snapshot_cache || {};
		cache[code] = {
			...JSON.parse(JSON.stringify(snapshot || {})),
			timestamp: Date.now(),
		};
		memory.gift_card_snapshot_cache = cache;
		persist("gift_card_snapshot_cache");
	} catch (error) {
		console.error("Failed to cache gift card snapshot", error);
	}
}

export function getCachedGiftCardSnapshot(giftCardCode: string) {
	try {
		const code = String(giftCardCode || "")
			.trim()
			.toUpperCase();
		const cache = memory.gift_card_snapshot_cache || {};
		const cachedData = cache[code];
		if (cachedData) {
			const isValid =
				Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000;
			return isValid ? cachedData : null;
		}
		return null;
	} catch (error) {
		console.error("Failed to get cached gift card snapshot", error);
		return null;
	}
}

export function clearGiftCardSnapshotCache() {
	try {
		memory.gift_card_snapshot_cache = {};
		persist("gift_card_snapshot_cache");
	} catch (error) {
		console.error("Failed to clear gift card snapshot cache", error);
	}
}

export function saveCustomerBalance(
	customer: string,
	balance: number,
	currency?: string,
) {
	try {
		const cache = memory.customer_balance_cache;
		cache[customer] = {
			balance,
			currency: currency || undefined,
			timestamp: Date.now(),
		};
		memory.customer_balance_cache = cache;
		persist("customer_balance_cache");
	} catch (error) {
		console.error("Failed to cache customer balance", error);
	}
}

export function getCachedCustomerBalance(customer: string) {
	try {
		const cache = memory.customer_balance_cache || {};
		const cachedData = cache[customer];
		if (cachedData) {
			const isValid =
				Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000;
			return isValid ? cachedData : null;
		}
		return null;
	} catch (error) {
		console.error("Failed to get cached customer balance", error);
		return null;
	}
}

export function clearCustomerBalanceCache() {
	try {
		memory.customer_balance_cache = {};
		persist("customer_balance_cache");
	} catch (error) {
		console.error("Failed to clear customer balance cache", error);
	}
}

export function clearExpiredCustomerBalances() {
	try {
		const cache = memory.customer_balance_cache || {};
		const now = Date.now();
		const validCache: AnyRecord = {};

		Object.keys(cache).forEach((customer) => {
			const cachedData = cache[customer];
			if (
				cachedData &&
				now - cachedData.timestamp < 24 * 60 * 60 * 1000
			) {
				validCache[customer] = cachedData;
			}
		});

		memory.customer_balance_cache = validCache;
		persist("customer_balance_cache");
	} catch (error) {
		console.error("Failed to clear expired customer balances", error);
	}
}
