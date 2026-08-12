import { refreshBootstrapSnapshotFromCacheState } from "./cache";
import { memory, persist } from "./db";
import {
	buildOfflineProfileScope,
	buildOfflineTenantScope,
} from "./scope";
import { posDebug } from "../utils/debug";

type AnyRecord = Record<string, any>;
type StockScopeInput = string | AnyRecord | null | undefined;

const STOCK_CACHE_FORMAT = "scoped-v1";
let activeStockScope = buildOfflineTenantScope();

type ScopedStockEnvelope<T> = {
	format: typeof STOCK_CACHE_FORMAT;
	scopes: Record<string, T>;
};

function resolveStockScope(input?: StockScopeInput) {
	if (typeof input === "string" && input.trim()) {
		const value = input.trim();
		return value.includes("::")
			? value
			: buildOfflineProfileScope({ name: value });
	}
	if (input && typeof input === "object") {
		return buildOfflineProfileScope(input);
	}
	return activeStockScope || buildOfflineTenantScope();
}

function createEnvelope<T>(): ScopedStockEnvelope<T> {
	return { format: STOCK_CACHE_FORMAT, scopes: {} };
}

function getStockEnvelope(): ScopedStockEnvelope<AnyRecord> {
	const current = memory.local_stock_cache;
	if (
		current?.format === STOCK_CACHE_FORMAT &&
		current?.scopes &&
		typeof current.scopes === "object"
	) {
		return current;
	}
	// The pre-v20 cache had no profile/user ownership. It is derived stock data,
	// so quarantine it instead of exposing it to the next cashier or profile.
	const envelope = createEnvelope<AnyRecord>();
	memory.local_stock_cache = envelope;
	return envelope;
}

function getReadyEnvelope(): ScopedStockEnvelope<boolean> {
	const current = memory.stock_cache_ready;
	if (
		current?.format === STOCK_CACHE_FORMAT &&
		current?.scopes &&
		typeof current.scopes === "object"
	) {
		return current;
	}
	const envelope = createEnvelope<boolean>();
	memory.stock_cache_ready = envelope;
	return envelope;
}

function getScopedStockCache(scopeInput?: StockScopeInput) {
	const scope = resolveStockScope(scopeInput);
	const envelope = getStockEnvelope();
	if (!envelope.scopes[scope]) {
		envelope.scopes[scope] = {};
	}
	return { scope, envelope, cache: envelope.scopes[scope] };
}

export function setActiveStockScope(scopeInput: StockScopeInput) {
	activeStockScope = resolveStockScope(scopeInput);
	return activeStockScope;
}

export async function fetchItemStockQuantities(
	items: AnyRecord[],
	pos_profile: AnyRecord,
	chunkSize = 100,
) {
	const allItems: AnyRecord[] = [];
	try {
		for (let i = 0; i < items.length; i += chunkSize) {
			const chunk = items.slice(i, i + chunkSize);
			const response = await new Promise<AnyRecord[]>(
				(resolve, reject) => {
					frappe.call({
						method: "posawesome.posawesome.api.items.get_items_details",
						args: {
							pos_profile: JSON.stringify(pos_profile),
							items_data: JSON.stringify(chunk),
						},
						freeze: false,
						callback: function (r) {
							if (r.message) {
								resolve(r.message);
							} else {
								reject(new Error("No response from server"));
							}
						},
						error: function (err) {
							reject(err);
						},
					});
				},
			);
			if (response) {
				allItems.push(...response);
			}
		}
		return allItems;
	} catch (error) {
		console.error("Failed to fetch item stock quantities:", error);
		return null;
	}
}

export async function initializeStockCache(
	items: AnyRecord[],
	pos_profile: AnyRecord,
) {
	try {
		const { scope, envelope, cache: existingCache } = getScopedStockCache(pos_profile);
		setActiveStockScope(scope);
		const missingItems = Array.isArray(items)
			? items.filter((it) => !existingCache[it.item_code])
			: [];

		if (missingItems.length === 0) {
			if (!isStockCacheReady(scope)) {
				setStockCacheReady(true, scope);
			}
			posDebug("stock-cache", "already initialized", {
				itemCount: Object.keys(existingCache).length,
				scope,
			});
			return true;
		}

		posDebug("stock-cache", "initializing", {
			missingItemCount: missingItems.length,
			scope,
		});

		const updatedItems = await fetchItemStockQuantities(
			missingItems,
			pos_profile,
		);

		if (updatedItems && updatedItems.length > 0) {
			updatedItems.forEach((item) => {
				if (item.actual_qty !== undefined) {
					existingCache[item.item_code] = {
						actual_qty: item.actual_qty,
						last_updated: new Date().toISOString(),
					};
				}
			});

			envelope.scopes[scope] = existingCache;
			memory.local_stock_cache = envelope;
			persist("local_stock_cache");
			setStockCacheReady(true, scope);
			posDebug("stock-cache", "initialized", {
				itemCount: Object.keys(existingCache).length,
				scope,
			});
			return true;
		}
		return false;
	} catch (error) {
		console.error("Failed to initialize stock cache:", error);
		return false;
	}
}

export function isStockCacheReady(scopeInput?: StockScopeInput) {
	const scope = resolveStockScope(scopeInput);
	return getReadyEnvelope().scopes[scope] === true;
}

export function setStockCacheReady(
	ready: boolean,
	scopeInput?: StockScopeInput,
) {
	const scope = resolveStockScope(scopeInput);
	activeStockScope = scope;
	const envelope = getReadyEnvelope();
	envelope.scopes[scope] = ready;
	memory.stock_cache_ready = envelope;
	persist("stock_cache_ready");
	refreshBootstrapSnapshotFromCacheState({
		stockCacheReady: ready,
	});
}

export function updateLocalStock(
	items: AnyRecord[],
	scopeInput?: StockScopeInput,
) {
	try {
		const { scope, envelope, cache: stockCache } =
			getScopedStockCache(scopeInput);

		items.forEach((item) => {
			const key = item.item_code;

			// Only update if the item already exists in cache
			// Don't create new entries without knowing the actual stock
			if (stockCache[key]) {
				// Reduce quantity by sold amount
				const soldQty = Math.abs(item.qty || 0);
				stockCache[key].actual_qty = Math.max(
					0,
					stockCache[key].actual_qty - soldQty,
				);
				stockCache[key].last_updated = new Date().toISOString();
			}
			// If item doesn't exist in cache, we don't create it
			// because we don't know the actual stock quantity
		});

		envelope.scopes[scope] = stockCache;
		memory.local_stock_cache = envelope;
		persist("local_stock_cache");
	} catch (e) {
		console.error("Failed to update local stock", e);
	}
}

export function getLocalStock(
	itemCode: string,
	scopeInput?: StockScopeInput,
) {
	try {
		const { cache: stockCache } = getScopedStockCache(scopeInput);
		return stockCache[itemCode]?.actual_qty ?? null;
	} catch {
		return null;
	}
}

export function updateLocalStockCache(
	items: AnyRecord[],
	scopeInput?: StockScopeInput,
) {
	try {
		const { scope, envelope, cache: stockCache } =
			getScopedStockCache(scopeInput);

		items.forEach((item) => {
			if (!item || !item.item_code) return;

			if (item.actual_qty !== undefined) {
				stockCache[item.item_code] = {
					actual_qty: item.actual_qty,
					last_updated: new Date().toISOString(),
				};
			}
		});

		envelope.scopes[scope] = stockCache;
		memory.local_stock_cache = envelope;
		persist("local_stock_cache");
	} catch (e) {
		console.error("Failed to refresh local stock cache", e);
	}
}

export function clearLocalStockCache(scopeInput?: StockScopeInput) {
	const scope = resolveStockScope(scopeInput);
	const envelope = getStockEnvelope();
	delete envelope.scopes[scope];
	memory.local_stock_cache = envelope;
	persist("local_stock_cache");
	setStockCacheReady(false, scope);
}

export function removeLocalStockEntries(
	itemCodes: string[],
	scopeInput?: StockScopeInput,
) {
	try {
		const normalizedCodes = Array.from(
			new Set(
				(Array.isArray(itemCodes) ? itemCodes : [])
					.map((code) => String(code || "").trim())
					.filter(Boolean),
			),
		);
		if (!normalizedCodes.length) {
			return;
		}
		const { scope, envelope, cache: stockCache } =
			getScopedStockCache(scopeInput);
		normalizedCodes.forEach((code) => {
			delete stockCache[code];
		});
		envelope.scopes[scope] = stockCache;
		memory.local_stock_cache = envelope;
		persist("local_stock_cache");
	} catch (e) {
		console.error("Failed to remove local stock entries", e);
	}
}

export function updateLocalStockWithActualQuantities(
	invoiceItems: AnyRecord[],
	serverItems: AnyRecord[],
	scopeInput?: StockScopeInput,
) {
	try {
		const { scope, envelope, cache: stockCache } =
			getScopedStockCache(scopeInput);

		invoiceItems.forEach((invoiceItem) => {
			const key = invoiceItem.item_code;

			// Find corresponding server item with actual quantity
			const serverItem = serverItems.find(
				(item) => item.item_code === invoiceItem.item_code,
			);

			if (serverItem && serverItem.actual_qty !== undefined) {
				// Initialize or update cache with actual server quantity
				if (!stockCache[key]) {
					stockCache[key] = {
						actual_qty: serverItem.actual_qty,
						last_updated: new Date().toISOString(),
					};
				} else {
					// Update with server quantity if it's more recent
					stockCache[key].actual_qty = serverItem.actual_qty;
					stockCache[key].last_updated = new Date().toISOString();
				}

				// Now reduce quantity by sold amount
				const soldQty = Math.abs(invoiceItem.qty || 0);
				stockCache[key].actual_qty = Math.max(
					0,
					stockCache[key].actual_qty - soldQty,
				);
			}
		});

		envelope.scopes[scope] = stockCache;
		memory.local_stock_cache = envelope;
		persist("local_stock_cache");
	} catch (e) {
		console.error("Failed to update local stock with actual quantities", e);
	}
}

export function getLocalStockCache(scopeInput?: StockScopeInput) {
	return getScopedStockCache(scopeInput).cache;
}

export function setLocalStockCache(
	cache: AnyRecord,
	scopeInput?: StockScopeInput,
) {
	const { scope, envelope } = getScopedStockCache(scopeInput);
	envelope.scopes[scope] = cache || {};
	memory.local_stock_cache = envelope;
	persist("local_stock_cache");
}
