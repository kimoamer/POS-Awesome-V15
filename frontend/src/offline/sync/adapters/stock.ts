import {
	clearLocalStockCache,
	removeLocalStockEntries,
	setStockCacheReady,
	updateLocalStockCache,
} from "../../stock";
import { getSyncResourceState } from "../syncState";
import { buildOfflineProfileScope } from "../../scope";
import {
	buildResourceSyncResult,
	buildScopeSignature,
	persistResourceSyncState,
	refreshSnapshotFromSync,
	type ResourceSyncResult,
	type SyncResponse,
	type SyncScopedProfile,
} from "./common";

type StockFetcher = (args: {
	posProfile: SyncScopedProfile;
	watermark?: string | null;
	startAfter?: string | null;
	syncUntil?: string | null;
	limit?: number;
	schemaVersion?: string | null;
}) => Promise<SyncResponse>;

type StockSyncArgs = {
	posProfile: SyncScopedProfile;
	watermark?: string | null;
	schemaVersion?: string | null;
	fetcher: StockFetcher;
};

const STOCK_SYNC_PAGE_SIZE = 1000;

function getLastStockCursor(response: SyncResponse) {
	const changes = Array.isArray(response?.changes) ? response.changes : [];
	for (let index = changes.length - 1; index >= 0; index -= 1) {
		const itemCode = String(changes[index]?.data?.item_code || "").trim();
		if (itemCode) return itemCode;
		const key = String(changes[index]?.key || "").trim();
		if (key.startsWith("stock::")) return key.slice("stock::".length);
	}
	return null;
}

function laterWatermark(
	current: string | null,
	candidate: string | null | undefined,
) {
	if (!candidate) return current;
	if (!current) return candidate;
	return candidate > current ? candidate : current;
}

function extractChangedStockRows(response: SyncResponse) {
	return (response?.changes || [])
		.map((entry) => entry?.data)
		.filter((row): row is Record<string, any> => !!row?.item_code);
}

function extractDeletedStockCodes(response: SyncResponse) {
	return (response?.deleted || [])
		.map((entry) => {
			const key = String(entry?.key || "");
			return key.startsWith("stock::") ? key.slice("stock::".length) : "";
		})
		.filter(Boolean);
}

async function hasStockScopeChanged(posProfile: SyncScopedProfile) {
	const nextScopeSignature = buildScopeSignature(posProfile);
	const currentState = await getSyncResourceState("stock");
	return !!(
		currentState?.scopeSignature &&
		currentState.scopeSignature !== nextScopeSignature
	);
}

export async function syncStockResource(
	args: StockSyncArgs,
): Promise<ResourceSyncResult> {
	const scopeChanged = await hasStockScopeChanged(args.posProfile);
	let effectiveWatermark = scopeChanged ? null : args.watermark || null;
	let effectiveSchemaVersion = args.schemaVersion || null;
	let attemptedSchemaRecovery = false;
	let startAfter: string | null = null;
	let latestWatermark = effectiveWatermark;
	let schemaVersionSeen = args.schemaVersion || null;
	let lastResponse: SyncResponse = {};
	let syncUntil: string | null = null;
	const stockScope = buildOfflineProfileScope(args.posProfile);

	if (scopeChanged) {
		clearLocalStockCache(stockScope);
	}

	while (true) {
		const response = await args.fetcher({
			posProfile: args.posProfile,
			watermark: effectiveWatermark,
			startAfter,
			syncUntil,
			limit: STOCK_SYNC_PAGE_SIZE,
			schemaVersion: effectiveSchemaVersion,
		});
		lastResponse = response || {};
		syncUntil = response?.sync_until || syncUntil;

		if (response?.full_resync_required) {
			if (!attemptedSchemaRecovery) {
				attemptedSchemaRecovery = true;
				effectiveWatermark = null;
				effectiveSchemaVersion = null;
				startAfter = null;
				syncUntil = null;
				latestWatermark = null;
				schemaVersionSeen = null;
				lastResponse = {};
				clearLocalStockCache(stockScope);
				continue;
			}
			break;
		}

		const changedRows = extractChangedStockRows(response);
		if (changedRows.length) updateLocalStockCache(changedRows, stockScope);

		const deletedItemCodes = extractDeletedStockCodes(response);
		if (deletedItemCodes.length) {
			removeLocalStockEntries(deletedItemCodes, stockScope);
		}

		latestWatermark = laterWatermark(
			latestWatermark,
			response?.next_watermark,
		);
		schemaVersionSeen = response?.schema_version || schemaVersionSeen;

		if (!response?.has_more) break;
		const nextStartAfter =
			response?.next_cursor || getLastStockCursor(response);
		if (!nextStartAfter || nextStartAfter === startAfter) {
			throw new Error("Stock sync pagination cursor did not advance");
		}
		startAfter = nextStartAfter;
	}

	const response: SyncResponse = {
		...lastResponse,
		changes: [],
		deleted: [],
		has_more: false,
		next_cursor: null,
		next_watermark: latestWatermark,
		schema_version: schemaVersionSeen,
		sync_until: syncUntil,
	};

	if (lastResponse?.full_resync_required) {
		await persistResourceSyncState({
			resourceId: "stock",
			status: "limited",
			posProfile: args.posProfile,
			response,
			watermark: effectiveWatermark,
		});
		return buildResourceSyncResult(
			"stock",
			"limited",
			response,
			effectiveWatermark,
		);
	}

	setStockCacheReady(true, stockScope);
	refreshSnapshotFromSync({
		posProfile: args.posProfile,
		cacheState: {
			stockCacheReady: true,
		},
	});

	await persistResourceSyncState({
		resourceId: "stock",
		status: "fresh",
		posProfile: args.posProfile,
		response,
		watermark: effectiveWatermark,
	});
	return buildResourceSyncResult(
		"stock",
		"fresh",
		response,
		effectiveWatermark,
	);
}
