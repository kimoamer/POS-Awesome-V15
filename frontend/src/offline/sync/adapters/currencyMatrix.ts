import {
	saveCurrencyOptionsCache,
	saveExchangeRateCache,
} from "../../cache";
import {
	currencyRateRepository,
	type OfflineCurrencyRateRecord,
} from "../../repositories";
import {
	buildResourceSyncResult,
	persistResourceSyncState,
	refreshSnapshotFromSync,
	type ResourceSyncResult,
	type SyncResponse,
	type SyncScopedProfile,
} from "./common";
import { buildOfflineProfileScope } from "../../scope";

type CurrencyPair = {
	from_currency: string;
	to_currency: string;
};

type CurrencyMatrixFetcher = (_args: {
	posProfile: SyncScopedProfile;
	currencyPairs?: CurrencyPair[];
	watermark?: string | null;
	startAfter?: string | null;
	syncUntil?: string | null;
	limit?: number;
	schemaVersion?: string | null;
}) => Promise<SyncResponse>;

type CurrencyMatrixSyncArgs = {
	posProfile: SyncScopedProfile;
	currencyPairs?: CurrencyPair[];
	watermark?: string | null;
	schemaVersion?: string | null;
	fetcher: CurrencyMatrixFetcher;
};

export async function syncCurrencyMatrixResource(
	args: CurrencyMatrixSyncArgs,
): Promise<ResourceSyncResult> {
	const storageScope = buildOfflineProfileScope(args.posProfile);
	let effectiveWatermark = args.watermark || null;
	let effectiveSchemaVersion = args.schemaVersion || null;
	let attemptedSchemaRecovery = false;
	if (!effectiveWatermark) {
		await currencyRateRepository.clear(storageScope);
	}

	let currencyOptionsCount: number | undefined;
	let exchangeRateCount = 0;
	let startAfter: string | null = null;
	let syncUntil: string | null = null;
	let finalResponse: SyncResponse = {};

	while (true) {
		const response = await args.fetcher({
			posProfile: args.posProfile,
			currencyPairs: args.currencyPairs || [],
			watermark: effectiveWatermark,
			startAfter,
			syncUntil,
			limit: 1000,
			schemaVersion: effectiveSchemaVersion,
		});
		finalResponse = response;
		syncUntil = response?.sync_until || syncUntil;

		if (response?.full_resync_required) {
			if (!attemptedSchemaRecovery) {
				attemptedSchemaRecovery = true;
				effectiveWatermark = null;
				effectiveSchemaVersion = null;
				startAfter = null;
				syncUntil = null;
				finalResponse = {};
				currencyOptionsCount = undefined;
				exchangeRateCount = 0;
				await currencyRateRepository.clear(storageScope);
				continue;
			}
			refreshSnapshotFromSync({
				posProfile: args.posProfile,
				cacheState: {
					currencyOptionsCount: 0,
					exchangeRateCount: 0,
				},
			});
			await persistResourceSyncState({
				resourceId: "currency_matrix",
				status: "limited",
				posProfile: args.posProfile,
				response,
				watermark: effectiveWatermark,
			});
			return buildResourceSyncResult(
				"currency_matrix",
				"limited",
				response,
				effectiveWatermark,
			);
		}

		for (const change of response?.changes || []) {
			if (
				change?.key === "currency_options" &&
				Array.isArray(change.data)
			) {
				saveCurrencyOptionsCache(args.posProfile.name, change.data);
				currencyOptionsCount = change.data.length;
				continue;
			}

			if (!String(change?.key || "").startsWith("exchange_rate::")) {
				if (String(change?.key || "").startsWith("currency_rate::")) {
					const row = change?.data || {};
					await currencyRateRepository.upsertMany([
						{
							...row,
							profile_name: args.posProfile.name,
							company: args.posProfile.company || "",
						} as OfflineCurrencyRateRecord,
					], storageScope);
				}
				continue;
			}

			const rate = change?.data || {};
			saveExchangeRateCache({
				profileName: args.posProfile.name,
				company: args.posProfile.company || undefined,
				fromCurrency: rate.from_currency,
				toCurrency: rate.to_currency,
				date: rate.date,
				exchange_rate: rate.exchange_rate,
			});
			exchangeRateCount += 1;
		}
		const deletedRateNames = (response?.deleted || [])
			.map((entry) => String(entry?.key || ""))
			.filter((key) => key.startsWith("currency_rate::"))
			.map((key) => key.slice("currency_rate::".length))
			.filter(Boolean);
		await currencyRateRepository.deleteByNames(
			deletedRateNames,
			storageScope,
		);

		if (!response?.has_more) {
			break;
		}
		const nextCursor = String(response?.next_cursor || "").trim();
		if (!nextCursor || nextCursor === startAfter) {
			throw new Error("Currency matrix sync pagination cursor did not advance");
		}
		startAfter = nextCursor;
	}

	if (
		typeof currencyOptionsCount !== "undefined" ||
		exchangeRateCount > 0
	) {
		refreshSnapshotFromSync({
			posProfile: args.posProfile,
			cacheState: {
				...(typeof currencyOptionsCount !== "undefined"
					? { currencyOptionsCount }
					: {}),
				...(exchangeRateCount > 0 ? { exchangeRateCount } : {}),
			},
		});
	}

	await persistResourceSyncState({
		resourceId: "currency_matrix",
		status: "fresh",
		posProfile: args.posProfile,
		response: finalResponse,
		watermark: effectiveWatermark,
	});
	return buildResourceSyncResult(
		"currency_matrix",
		"fresh",
		finalResponse,
		effectiveWatermark,
	);
}
