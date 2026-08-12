import {
	clearCustomerStorage,
	getCustomerStorageCount,
	setCustomersLastSync,
} from "../../cache";
import {
	deleteCustomerStorageByNames,
	setCustomerStorage,
} from "../../customers";
import { getSyncResourceState } from "../syncState";
import { buildOfflineProfileScope } from "../../scope";
import {
	buildResourceSyncResult,
	buildScopeSignature,
	persistResourceSyncState,
	refreshSnapshotFromSync,
	resolveWatermark,
	type ResourceSyncResult,
	type SyncResponse,
	type SyncScopedProfile,
} from "./common";

type CustomersFetcher = (_args: {
	posProfile: SyncScopedProfile;
	watermark?: string | null;
	startAfter?: string | null;
	syncUntil?: string | null;
	limit?: number | null;
	schemaVersion?: string | null;
}) => Promise<SyncResponse>;

type CustomersSyncArgs = {
	posProfile: SyncScopedProfile;
	watermark?: string | null;
	schemaVersion?: string | null;
	fetcher: CustomersFetcher;
};

const CUSTOMER_SYNC_PAGE_SIZE = 1000;

function extractChangedCustomers(response: SyncResponse) {
	return (response?.changes || [])
		.map((entry) => entry?.data)
		.filter((row): row is Record<string, any> => !!row?.name);
}

function extractDeletedCustomerNames(response: SyncResponse) {
	return (response?.deleted || [])
		.map((entry) => {
			const key = String(entry?.key || "");
			return key.startsWith("customer::")
				? key.slice("customer::".length)
				: "";
		})
		.filter(Boolean);
}

async function hasCustomerScopeChanged(posProfile: SyncScopedProfile) {
	const nextScopeSignature = buildScopeSignature(posProfile);
	const currentState = await getSyncResourceState("customers");
	return !!(
		currentState?.scopeSignature &&
		currentState.scopeSignature !== nextScopeSignature
	);
}

function getLastCustomerCursor(response: SyncResponse) {
	const changes = Array.isArray(response?.changes) ? response.changes : [];
	for (let index = changes.length - 1; index >= 0; index -= 1) {
		const name = String(changes[index]?.data?.name || "").trim();
		if (name) {
			return name;
		}
		const key = String(changes[index]?.key || "").trim();
		if (key.startsWith("customer::")) {
			return key.slice("customer::".length);
		}
	}
	return null;
}

function laterWatermark(
	current: string | null,
	candidate: string | null | undefined,
) {
	if (!candidate) {
		return current;
	}
	if (!current) {
		return candidate;
	}
	return candidate > current ? candidate : current;
}

async function fetchAndStoreCustomerPages({
	posProfile,
	watermark,
	schemaVersion,
	fetcher,
	storageScope,
}: {
	posProfile: SyncScopedProfile;
	watermark?: string | null;
	schemaVersion?: string | null;
	fetcher: CustomersFetcher;
	storageScope: string;
}) {
	let startAfter: string | null = null;
	let latestWatermark: string | null = watermark || null;
	let schemaVersionSeen: string | null = schemaVersion || null;
	let lastResponse: SyncResponse = {};
	let syncUntil: string | null = null;
	const deletedNamesSeen = new Set<string>();

	while (true) {
		const response = await fetcher({
			posProfile,
			watermark,
			startAfter,
			syncUntil,
			limit: CUSTOMER_SYNC_PAGE_SIZE,
			schemaVersion,
		});
		lastResponse = response || {};
		syncUntil = response?.sync_until || syncUntil;

		if (response?.full_resync_required || !response?.has_more) {
			if (response?.full_resync_required) {
				return response;
			}
		}

		const changedCustomers = extractChangedCustomers(response);
		if (changedCustomers.length) {
			await setCustomerStorage(changedCustomers, storageScope);
		}

		const deletedCustomerNames = extractDeletedCustomerNames(
			response,
		).filter((name) => {
			if (deletedNamesSeen.has(name)) {
				return false;
			}
			deletedNamesSeen.add(name);
			return true;
		});
		if (deletedCustomerNames.length) {
			await deleteCustomerStorageByNames(
				deletedCustomerNames,
				storageScope,
			);
		}

		latestWatermark = laterWatermark(
			latestWatermark,
			response?.next_watermark,
		);
		schemaVersionSeen =
			response?.schema_version || schemaVersionSeen || null;

		if (!response?.has_more) {
			break;
		}

		const nextStartAfter =
			response?.next_cursor || getLastCustomerCursor(response);
		if (!nextStartAfter || nextStartAfter === startAfter) {
			throw new Error("Customer sync pagination cursor did not advance");
		}
		startAfter = nextStartAfter;
	}

	return {
		...lastResponse,
		changes: [],
		deleted: [],
		has_more: false,
		next_watermark: latestWatermark,
		schema_version: schemaVersionSeen,
		sync_until: syncUntil,
	};
}

export async function syncCustomersResource(
	args: CustomersSyncArgs,
): Promise<ResourceSyncResult> {
	const scopeChanged = await hasCustomerScopeChanged(args.posProfile);
	let effectiveWatermark = scopeChanged ? null : args.watermark;
	const storageScope = buildOfflineProfileScope(args.posProfile);

	if (scopeChanged) {
		await clearCustomerStorage(storageScope);
	}

	let response = await fetchAndStoreCustomerPages({
		posProfile: args.posProfile,
		watermark: effectiveWatermark,
		schemaVersion: args.schemaVersion,
		fetcher: args.fetcher,
		storageScope,
	});

	if (response?.full_resync_required) {
		effectiveWatermark = null;
		if (!scopeChanged) {
			await clearCustomerStorage(storageScope);
		}
		response = await fetchAndStoreCustomerPages({
			posProfile: args.posProfile,
			watermark: effectiveWatermark,
			schemaVersion: null,
			fetcher: args.fetcher,
			storageScope,
		});
	}

	if (response?.full_resync_required) {
		await persistResourceSyncState({
			resourceId: "customers",
			status: "limited",
			posProfile: args.posProfile,
			response,
			watermark: effectiveWatermark,
		});
		return buildResourceSyncResult(
			"customers",
			"limited",
			response,
			effectiveWatermark,
		);
	}

	const customersCount = await getCustomerStorageCount(storageScope);
	refreshSnapshotFromSync({
		posProfile: args.posProfile,
		cacheState: {
			customersCount,
		},
	});

	const nextWatermark = resolveWatermark(response, effectiveWatermark);
	if (nextWatermark) {
		setCustomersLastSync(nextWatermark);
	}

	await persistResourceSyncState({
		resourceId: "customers",
		status: "fresh",
		posProfile: args.posProfile,
		response,
		watermark: effectiveWatermark,
	});
	return buildResourceSyncResult(
		"customers",
		"fresh",
		response,
		effectiveWatermark,
	);
}
