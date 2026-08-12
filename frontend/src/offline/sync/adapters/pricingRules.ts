import {
	pricingRuleRepository,
	type OfflinePricingRuleRecord,
} from "../../repositories";
import { savePricingRulesSnapshot } from "../../cache";
import {
	buildResourceSyncResult,
	persistResourceSyncState,
	refreshSnapshotFromSync,
	type ResourceSyncResult,
	type SyncResponse,
	type SyncScopedProfile,
} from "./common";
import { buildOfflineProfileScope } from "../../scope";

type PricingRulesFetcher = (_args: {
	posProfile: SyncScopedProfile;
	watermark?: string | null;
	startAfter?: string | null;
	syncUntil?: string | null;
	limit?: number;
	schemaVersion?: string | null;
}) => Promise<SyncResponse>;

type PricingRulesSyncArgs = {
	posProfile: SyncScopedProfile;
	watermark?: string | null;
	schemaVersion?: string | null;
	fetcher: PricingRulesFetcher;
};

type PricingRulesSyncProfile = SyncScopedProfile & {
	currency?: string | null;
	selling_price_list?: string | null;
};

function deletedRuleNames(response: SyncResponse) {
	return (response?.deleted || [])
		.map((entry) => String(entry?.key || ""))
		.filter((key) => key.startsWith("pricing_rule::"))
		.map((key) => key.slice("pricing_rule::".length).split("::")[0])
		.filter((name): name is string => !!name);
}

function buildSnapshotContext(posProfile: PricingRulesSyncProfile) {
	return JSON.stringify({
		pos_profile: posProfile?.name || "",
		company: posProfile?.company || "",
		price_list: posProfile?.selling_price_list || "",
		currency: posProfile?.currency || "",
		customer: "",
		customer_group: "",
		territory: "",
		date: new Date().toISOString().slice(0, 10),
	});
}

async function refreshPricingSnapshotFromRepository(
	posProfile: PricingRulesSyncProfile,
) {
	const storageScope = buildOfflineProfileScope(posProfile);
	const hasContext = Boolean(
		posProfile?.company &&
			posProfile?.selling_price_list &&
			posProfile?.currency,
	);
	if (!hasContext) {
		refreshSnapshotFromSync({
			posProfile,
			cacheState: {
				pricingSnapshotCount: 0,
				pricingContext: null,
			},
		});
		return;
	}

	const snapshot = await pricingRuleRepository.getAll(storageScope);
	(
		savePricingRulesSnapshot as unknown as (
			_snapshot: OfflinePricingRuleRecord[],
			_context: string,
		) => void
	)(snapshot, buildSnapshotContext(posProfile));
}

export async function syncPricingRulesResource(
	args: PricingRulesSyncArgs,
): Promise<ResourceSyncResult> {
	const storageScope = buildOfflineProfileScope(args.posProfile);
	let effectiveWatermark = args.watermark || null;
	let effectiveSchemaVersion = args.schemaVersion || null;
	let attemptedSchemaRecovery = false;
	if (!effectiveWatermark) {
		await pricingRuleRepository.clear(storageScope);
	}

	let startAfter: string | null = null;
	let syncUntil: string | null = null;
	let finalResponse: SyncResponse = {};
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

		if (response?.full_resync_required) {
			await pricingRuleRepository.clear(storageScope);
			if (!attemptedSchemaRecovery) {
				attemptedSchemaRecovery = true;
				effectiveWatermark = null;
				effectiveSchemaVersion = null;
				startAfter = null;
				syncUntil = null;
				finalResponse = {};
				continue;
			}
			refreshSnapshotFromSync({
				posProfile: args.posProfile,
				cacheState: {
					pricingSnapshotCount: 0,
					pricingContext: null,
				},
			});
			await persistResourceSyncState({
				resourceId: "pricing_rules",
				status: "limited",
				posProfile: args.posProfile,
				response,
				watermark: effectiveWatermark,
			});
			return buildResourceSyncResult(
				"pricing_rules",
				"limited",
				response,
				effectiveWatermark,
			);
		}

		const rows = (response?.changes || [])
			.map((entry) => entry?.data)
			.filter(
				(row): row is OfflinePricingRuleRecord =>
					!!row?.key && !!row?.rule_name,
			);
		await pricingRuleRepository.replaceRuleTargets(rows, storageScope);
		await pricingRuleRepository.deleteByRuleNames(
			deletedRuleNames(response),
			storageScope,
		);

		if (!response?.has_more) {
			break;
		}
		const nextCursor = String(response?.next_cursor || "").trim();
		if (!nextCursor || nextCursor === startAfter) {
			throw new Error(
				"Pricing Rule sync pagination cursor did not advance",
			);
		}
		startAfter = nextCursor;
	}

	await persistResourceSyncState({
		resourceId: "pricing_rules",
		status: "fresh",
		posProfile: args.posProfile,
		response: finalResponse,
		watermark: effectiveWatermark,
	});
	await refreshPricingSnapshotFromRepository(args.posProfile);
	return buildResourceSyncResult(
		"pricing_rules",
		"fresh",
		finalResponse,
		effectiveWatermark,
	);
}
