import {
	itemPriceRepository,
	type OfflineItemPriceRecord,
} from "../../repositories";
import {
	buildResourceSyncResult,
	persistResourceSyncState,
	type ResourceSyncResult,
	type SyncResponse,
	type SyncScopedProfile,
} from "./common";
import { buildOfflineProfileScope } from "../../scope";

type ItemPricesFetcher = (_args: {
	posProfile: SyncScopedProfile;
	watermark?: string | null;
	startAfter?: string | null;
	syncUntil?: string | null;
	limit?: number;
	schemaVersion?: string | null;
}) => Promise<SyncResponse>;

type ItemPricesSyncArgs = {
	posProfile: SyncScopedProfile;
	watermark?: string | null;
	schemaVersion?: string | null;
	fetcher: ItemPricesFetcher;
};

function itemPriceNames(response: SyncResponse) {
	return (response?.deleted || [])
		.map((entry) => String(entry?.key || ""))
		.filter((key) => key.startsWith("item_price::"))
		.map((key) => key.slice("item_price::".length))
		.filter(Boolean);
}

export async function syncItemPricesResource(
	args: ItemPricesSyncArgs,
): Promise<ResourceSyncResult> {
	const storageScope = buildOfflineProfileScope(args.posProfile);
	let effectiveWatermark = args.watermark || null;
	let effectiveSchemaVersion = args.schemaVersion || null;
	let attemptedSchemaRecovery = false;
	if (!effectiveWatermark) {
		await itemPriceRepository.clear(storageScope);
	}

	let startAfter: string | null = null;
	let syncUntil: string | null = null;
	let finalResponse: SyncResponse = {};
	let scopeApplied = false;
	while (true) {
		const response = await args.fetcher({
			posProfile: args.posProfile,
			watermark: effectiveWatermark,
			startAfter,
			syncUntil,
			limit: 1000,
			schemaVersion: effectiveSchemaVersion,
		});
		finalResponse = response;
		syncUntil = response?.sync_until || syncUntil;
		if (
			!scopeApplied &&
			Array.isArray(response?.scope?.price_lists)
		) {
			await itemPriceRepository.deleteOutsidePriceLists(
				response.scope.price_lists,
				storageScope,
			);
			scopeApplied = true;
		}

		if (response?.full_resync_required) {
			await itemPriceRepository.clear(storageScope);
			if (!attemptedSchemaRecovery) {
				attemptedSchemaRecovery = true;
				effectiveWatermark = null;
				effectiveSchemaVersion = null;
				startAfter = null;
				syncUntil = null;
				finalResponse = {};
				scopeApplied = false;
				continue;
			}
			await persistResourceSyncState({
				resourceId: "item_prices",
				status: "limited",
				posProfile: args.posProfile,
				response,
				watermark: effectiveWatermark,
			});
			return buildResourceSyncResult(
				"item_prices",
				"limited",
				response,
				effectiveWatermark,
			);
		}

		const rows = (response?.changes || [])
			.map((entry) => entry?.data)
			.filter(
				(row): row is OfflineItemPriceRecord =>
					!!row?.name && !!row?.price_list && !!row?.item_code,
			);
		await itemPriceRepository.upsertMany(rows, storageScope);
		await itemPriceRepository.deleteByNames(
			itemPriceNames(response),
			storageScope,
		);

		if (!response?.has_more) {
			break;
		}
		const nextCursor = String(response?.next_cursor || "").trim();
		if (!nextCursor || nextCursor === startAfter) {
			throw new Error("Item Price sync pagination cursor did not advance");
		}
		startAfter = nextCursor;
	}

	await persistResourceSyncState({
		resourceId: "item_prices",
		status: "fresh",
		posProfile: args.posProfile,
		response: finalResponse,
		watermark: effectiveWatermark,
	});
	return buildResourceSyncResult(
		"item_prices",
		"fresh",
		finalResponse,
		effectiveWatermark,
	);
}
