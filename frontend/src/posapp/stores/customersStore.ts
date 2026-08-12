import { defineStore } from "pinia";
import { ref, computed } from "vue";

declare const __: any;
import type {
	CustomerInfo,
	CustomerSummary,
	POSProfile,
	StoredCustomer,
} from "../types/models";
import {
	buildCustomerSearchParts,
	customerMatchesSearchParts,
	normalizeCustomerSearchTerm,
} from "./customers/customerSearch";
import { resetCustomerLoadingCoordinator } from "../modules/customers/customerLoadingCoordinator";
import { buildOfflineProfileScope } from "../../offline/scope";
import { useSyncCoordinator } from "../../offline/sync/useSyncCoordinator";
import { posDebug } from "../utils/debug";
// @ts-ignore
import {
	db,
	checkDbHealth,
	setCustomerStorage,
	saveStoredValueSnapshot,
	memoryInitPromise,
	setCustomersLastSync,
	getCustomerStorageCount,
	clearCustomerStorage,
	isOffline,
	refreshBootstrapSnapshotFromCacheState,
} from "../../offline/index";

const PAGE_SIZE = 200;
const CUSTOMER_SCOPE_STORAGE_KEY = "posa_customers_profile_scope";

function getCustomerProfileScope(profile: POSProfile | null): string {
	return profile?.name ? buildOfflineProfileScope(profile) : "";
}

function getStoredCustomerScope(): string {
	if (typeof localStorage === "undefined") {
		return "";
	}
	const stored = localStorage.getItem(CUSTOMER_SCOPE_STORAGE_KEY);
	return typeof stored === "string" ? stored : "";
}

function setStoredCustomerScope(scope: string): void {
	if (typeof localStorage === "undefined") {
		return;
	}
	if (scope) {
		localStorage.setItem(CUSTOMER_SCOPE_STORAGE_KEY, scope);
		return;
	}
	localStorage.removeItem(CUSTOMER_SCOPE_STORAGE_KEY);
}

function getStringField(
	source: Record<string, unknown>,
	field: string,
): string | undefined {
	const value = source[field];
	return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeProfile(profile: unknown): POSProfile | null {
	if (!profile) {
		return null;
	}

	let resolved: unknown = profile;

	if (
		typeof profile === "object" &&
		profile !== null &&
		"pos_profile" in profile &&
		(profile as { pos_profile?: unknown }).pos_profile
	) {
		resolved = (profile as { pos_profile?: unknown }).pos_profile;
	}

	if (typeof resolved === "string") {
		const trimmed = resolved.trim();
		if (!trimmed) {
			return null;
		}

		if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
			try {
				return JSON.parse(trimmed) as POSProfile;
			} catch (err) {
				console.error("Failed to parse POS profile JSON", err);
				return null;
			}
		}

		return { name: trimmed } as POSProfile;
	}

	return resolved as POSProfile;
}

export const useCustomersStore = defineStore("customers", () => {
	const customers = ref<CustomerSummary[]>([]);
	const selectedCustomer = ref<string | null>(null);
	const customerInfo = ref<CustomerInfo>({});
	const searchTerm = ref("");
	const page = ref(0);
	const hasMore = ref(true);
	const nextCustomerStart = ref<string | null>(null);
	const nextCustomerOffset = ref(0);
	const loadingCustomers = ref(false);
	const customersLoaded = ref(false);
	const isCustomerBackgroundLoading = ref(false);
	const pendingCustomerSearch = ref<string | null>(null);
	const loadProgress = ref(0);
	const totalCustomerCount = ref(0);
	const loadedCustomerCount = ref(0);
	const posProfile = ref<POSProfile | null>(null);
	const customerProfileScope = ref("");
	const refreshToken = ref(0);
	const isUpdateCustomerDialogOpen = ref(false);
	const customerToUpdate = ref<StoredCustomer | null>(null);
	let customerFetchPromise: Promise<void> | null = null;
	let activeSearchRequest = 0;
	const customerLoadLogState = {
		local: false,
		server: false,
		final: false,
	};

	function resetCustomerLoadLogState() {
		customerLoadLogState.local = false;
		customerLoadLogState.server = false;
		customerLoadLogState.final = false;
	}

	function logLocalCustomerCount(count: number) {
		if (customerLoadLogState.local) return;
		posDebug("customers", "Local customer count", count);
		customerLoadLogState.local = true;
	}

	function logFinalLoadedCustomerCount() {
		if (customerLoadLogState.final) return;
		const count = Number(
			loadedCustomerCount.value || customers.value.length || 0,
		);
		posDebug("customers", "Customers loaded", count);
		customerLoadLogState.final = true;
	}

	const filteredCustomers = computed(() => customers.value);

	const isLoadComplete = computed(
		() => customersLoaded.value && loadProgress.value >= 100,
	);

	async function ensureDatabase() {
		await memoryInitPromise;
		await checkDbHealth();
		if (!db.isOpen()) {
			await db.open();
		}
	}

	async function fetchCustomersFromServer(term = "") {
		if (!posProfile.value?.name || isOffline()) {
			return [] as CustomerSummary[];
		}

		const frappeClient = (globalThis as any)?.frappe;
		if (typeof frappeClient?.call !== "function") {
			return [] as CustomerSummary[];
		}

		try {
			const response = await frappeClient.call({
				method: "posawesome.posawesome.api.customers.get_customer_names",
				args: {
					pos_profile: posProfile.value.name,
					limit: PAGE_SIZE,
					offset: 0,
					search_text: normalizeCustomerSearchTerm(term) || null,
				},
			});
			const rows = (Array.isArray(response?.message)
				? response.message
				: []
			).filter((customer: CustomerSummary) => !!customer?.name);
			if (rows.length) {
				await setCustomerStorage(rows, getActiveCustomerScope());
			}
			return rows as CustomerSummary[];
		} catch (error) {
			console.error("Failed to fetch customers from server", error);
			return [] as CustomerSummary[];
		}
	}

	function resetPagination() {
		page.value = 0;
		hasMore.value = true;
		customers.value = [];
	}

	function setPosProfile(profile: unknown) {
		posProfile.value = normalizeProfile(profile);
		customerProfileScope.value = getCustomerProfileScope(posProfile.value);
	}

	function getActiveCustomerScope() {
		return (
			customerProfileScope.value ||
			getCustomerProfileScope(posProfile.value)
		);
	}

	function setSelectedCustomer(name: string | null) {
		selectedCustomer.value = name || null;
	}

	function upsertCustomerSummaryFromInfo(info: CustomerInfo) {
		const customerName =
			getStringField(info, "name") || getStringField(info, "customer");
		if (!customerName) {
			return;
		}

		const existingIndex = customers.value.findIndex(
			(customer) => customer.name === customerName,
		);
		const existing =
			existingIndex >= 0 ? customers.value[existingIndex] : null;
		const summary: CustomerSummary = {
			...(existing || {}),
			...info,
			name: customerName,
			customer_name:
				getStringField(info, "customer_name") ||
				existing?.customer_name ||
				customerName,
		};
		const email = getStringField(info, "email_id");
		const mobile = getStringField(info, "mobile_no");
		const primaryAddress =
			getStringField(info, "primary_address") ||
			getStringField(info, "customer_address");
		const taxId = getStringField(info, "tax_id");
		if (email) summary.email_id = email;
		if (mobile) summary.mobile_no = mobile;
		if (primaryAddress) summary.primary_address = primaryAddress;
		if (taxId) summary.tax_id = taxId;

		if (existingIndex >= 0) {
			const updated = [...customers.value];
			updated.splice(existingIndex, 1, summary);
			customers.value = updated;
			return;
		}

		customers.value = [...customers.value, summary];
	}

	function setCustomerInfo(info: CustomerInfo) {
		customerInfo.value = info || {};
		upsertCustomerSummaryFromInfo(customerInfo.value);
		const customerName =
			getStringField(customerInfo.value, "name") ||
			getStringField(customerInfo.value, "customer");
		if (customerName) {
			void setCustomerStorage(
				[{ ...customerInfo.value, name: customerName }],
				getActiveCustomerScope(),
			);
		}
		if (
			customerName &&
			posProfile.value?.company &&
			typeof info?.stored_value_balance !== "undefined"
		) {
			const totalCredit = Number(info.stored_value_balance || 0);
			saveStoredValueSnapshot(
				customerName,
				posProfile.value.company,
				totalCredit > 0
					? [
							{
								type: "Snapshot",
								credit_origin: "offline-customer-cache",
								total_credit: totalCredit,
								source_type: "Stored Value Snapshot",
							},
						]
					: [],
			);
		}
	}

	function requestCustomerRefresh() {
		refreshToken.value += 1;
	}

	function syncBootstrapCustomerReadiness(count: number | boolean) {
		refreshBootstrapSnapshotFromCacheState({
			customersCount: count,
		});
	}

	async function ensureCustomerScopeIsolation() {
		const currentScope =
			customerProfileScope.value ||
			getCustomerProfileScope(posProfile.value);
		if (!currentScope) {
			return;
		}

		const storedScope = getStoredCustomerScope();
		if (storedScope === currentScope) {
			return;
		}

		await clearCustomerStorage(currentScope);
		setCustomersLastSync(null);
		setStoredCustomerScope(currentScope);
		resetPagination();
		customersLoaded.value = false;
		loadProgress.value = 0;
		totalCustomerCount.value = 0;
		loadedCustomerCount.value = 0;
		nextCustomerStart.value = null;
		nextCustomerOffset.value = 0;
		syncBootstrapCustomerReadiness(0);
	}

	async function performSearch({ append = false } = {}) {
		await ensureDatabase();
		const requestId = ++activeSearchRequest;
		const scope = getActiveCustomerScope();
		const normalizedTerm = normalizeCustomerSearchTerm(searchTerm.value);
		const offset = page.value * PAGE_SIZE;
		let results: CustomerSummary[] = [];

		if (normalizedTerm) {
			const searchParts = buildCustomerSearchParts(normalizedTerm);
			const candidateLimit = Math.max(2000, offset + PAGE_SIZE * 5);
			const matchesByPart: string[][] = [];
			for (const part of searchParts) {
				const tokenRows = await db
					.table("customer_search_tokens")
					.where("[customer_scope+token]")
					.between(
						[scope, part],
						[scope, `${part}\uffff`],
						true,
						true,
					)
					.limit(candidateLimit)
					.toArray();
				matchesByPart.push(
					Array.from(
						new Set(
							tokenRows.map((row: Record<string, unknown>) =>
								String(row.customer_name),
							),
						),
					),
				);
			}

			const orderedCandidates = matchesByPart[0] || [];
			const remainingSets = matchesByPart
				.slice(1)
				.map((names) => new Set(names));
			const matchedNames = orderedCandidates.filter((name) =>
				remainingSets.every((names) => names.has(name)),
			);
			const pageNames = matchedNames.slice(offset, offset + PAGE_SIZE);
			if (pageNames.length) {
				results = (
					await db
						.table("customers")
						.bulkGet(pageNames.map((name) => [scope, name]))
				).filter(Boolean) as CustomerSummary[];
			} else if (offset === 0) {
				// Preserve contains-search compatibility for unusual mid-token terms;
				// normal name/code/phone/email prefixes use the durable index above.
				results = await db
					.table("customers")
					.where("customer_scope")
					.equals(scope)
					.filter((customer: CustomerSummary) =>
						customerMatchesSearchParts(customer, searchParts),
					)
					.limit(PAGE_SIZE)
					.toArray();
			}
		} else {
			results = await db
				.table("customers")
				.where("customer_scope")
				.equals(scope)
				.offset(offset)
				.limit(PAGE_SIZE)
				.toArray();
		}

		// Keep the selector usable when a schema migration, storage eviction, or
		// interrupted background sync leaves the local customer read model empty.
		// A typed search also gets one permission-filtered server fallback so a
		// customer outside the currently cached page remains discoverable online.
		if (
			!append &&
			offset === 0 &&
			results.length === 0 &&
			(totalCustomerCount.value === 0 || !!normalizedTerm)
		) {
			results = await fetchCustomersFromServer(normalizedTerm);
			if (results.length) {
				totalCustomerCount.value = Math.max(
					totalCustomerCount.value,
					results.length,
				);
				loadedCustomerCount.value = Math.max(
					loadedCustomerCount.value,
					results.length,
				);
				loadProgress.value = 100;
				customersLoaded.value = true;
				syncBootstrapCustomerReadiness(totalCustomerCount.value);
			}
		}

		if (requestId !== activeSearchRequest) {
			return 0;
		}

		if (append) {
			customers.value = [...customers.value, ...results];
		} else {
			customers.value = results;
		}

		hasMore.value = results.length === PAGE_SIZE;
		if (hasMore.value) {
			page.value += 1;
		}

		return results.length;
	}

	async function searchCustomers(term = "", append = false) {
		if (!append) {
			searchTerm.value = normalizeCustomerSearchTerm(term);
			resetPagination();
		}
		return performSearch({ append });
	}

	async function queueSearch(term: string) {
		const normalized = normalizeCustomerSearchTerm(term);
		if (isCustomerBackgroundLoading.value) {
			pendingCustomerSearch.value = normalized;
			return null;
		}
		return searchCustomers(normalized, false);
	}

	async function loadMoreCustomers() {
		if (loadingCustomers.value) {
			return 0;
		}
		return performSearch({ append: true });
	}

	async function refreshCustomersFromStorage() {
		const localCount = await getCustomerStorageCount(
			getActiveCustomerScope(),
		);
		totalCustomerCount.value = localCount;
		loadedCustomerCount.value = localCount;
		nextCustomerStart.value = null;
		nextCustomerOffset.value = 0;
		loadProgress.value = localCount > 0 ? 100 : 0;
		customersLoaded.value = true;
		syncBootstrapCustomerReadiness(localCount);
		await searchCustomers(searchTerm.value);
		if (localCount > 0) {
			logFinalLoadedCustomerCount();
		}
		return localCount;
	}

	async function backgroundLoadCustomers(
		_startAfter: string | null = null,
		_syncSince: string | null = null,
	) {
		if (!posProfile.value || isOffline()) {
			return false;
		}
		if (isCustomerBackgroundLoading.value) {
			return false;
		}

		isCustomerBackgroundLoading.value = true;
		try {
			await useSyncCoordinator().runTrigger("timer");
			await refreshCustomersFromStorage();
			return true;
		} catch (err) {
			console.error("Failed to background load customers", err);
			return false;
		} finally {
			isCustomerBackgroundLoading.value = false;
			if (pendingCustomerSearch.value !== null) {
				const term = pendingCustomerSearch.value;
				pendingCustomerSearch.value = null;
				await searchCustomers(term);
			}
		}
	}

	async function verifyServerCustomerCount() {
		if (!posProfile.value || isOffline()) {
			return;
		}
		await backgroundLoadCustomers();
	}

	async function load_customer_names_internal() {
		if (!posProfile.value) {
			posDebug("customers", "Customer fetch skipped: POS Profile not ready");
			return;
		}
		await ensureCustomerScopeIsolation();
		await ensureDatabase();
		const localCount = await getCustomerStorageCount(
			getActiveCustomerScope(),
		);
		logLocalCustomerCount(localCount);
		syncBootstrapCustomerReadiness(localCount);

		if (localCount > 0) {
			await refreshCustomersFromStorage();
			void backgroundLoadCustomers();
			return;
		}

		loadProgress.value = 0;
		loadingCustomers.value = true;
		try {
			await backgroundLoadCustomers();
			await refreshCustomersFromStorage();
		} catch (err) {
			console.error("Failed to fetch customers:", err);
		} finally {
			loadingCustomers.value = false;
			customersLoaded.value = true;
			await searchCustomers(searchTerm.value);
		}
	}

	async function get_customer_names() {
		if (customerFetchPromise) {
			return customerFetchPromise;
		}

		resetCustomerLoadLogState();
		customerFetchPromise = load_customer_names_internal().finally(() => {
			customerFetchPromise = null;
		});
		return customerFetchPromise;
	}

	async function addOrUpdateCustomer(customer: StoredCustomer) {
		if (!customer || !customer.name) {
			return;
		}
		const existingIndex = customers.value.findIndex(
			(c) => c.name === customer.name,
		);
		if (existingIndex !== -1) {
			const updated = [...customers.value];
			updated.splice(existingIndex, 1, customer);
			customers.value = updated;
		} else {
			customers.value = [...customers.value, customer];
		}
		await setCustomerStorage([customer], getActiveCustomerScope());
		syncBootstrapCustomerReadiness(Math.max(customers.value.length, 1));
		setSelectedCustomer(customer.name);
		requestCustomerRefresh();
	}

	async function reloadCustomers() {
		if (isOffline()) {
			console.warn("Cannot reload customers while offline");
			return;
		}

		resetCustomerLoadingCoordinator();
		clearLocalState();
		await clearCustomerStorage(getActiveCustomerScope());
		setCustomersLastSync(null);
		syncBootstrapCustomerReadiness(0);

		await get_customer_names();

		if (posProfile.value && posProfile.value.customer) {
			setSelectedCustomer(posProfile.value.customer);
		}
		requestCustomerRefresh();
	}

	function openUpdateCustomerDialog(customer: StoredCustomer | null = null) {
		customerToUpdate.value = customer;
		isUpdateCustomerDialogOpen.value = true;
	}

	function closeUpdateCustomerDialog() {
		isUpdateCustomerDialogOpen.value = false;
		customerToUpdate.value = null;
	}

	function clearLocalState() {
		resetPagination();
		selectedCustomer.value = null;
		customerInfo.value = {};
		loadProgress.value = 0;
		totalCustomerCount.value = 0;
		loadedCustomerCount.value = 0;
		customersLoaded.value = false;
		nextCustomerStart.value = null;
		nextCustomerOffset.value = 0;
		resetCustomerLoadLogState();
	}

	return {
		customers,
		filteredCustomers,
		selectedCustomer,
		customerInfo,
		searchTerm,
		page,
		hasMore,
		nextCustomerStart,
		nextCustomerOffset,
		loadingCustomers,
		customersLoaded,
		isCustomerBackgroundLoading,
		pendingCustomerSearch,
		loadProgress,
		totalCustomerCount,
		loadedCustomerCount,
		posProfile,
		refreshToken,
		isLoadComplete,
		setPosProfile,
		setSelectedCustomer,
		setCustomerInfo,
		searchCustomers,
		queueSearch,
		loadMoreCustomers,
		verifyServerCustomerCount,
		get_customer_names,
		backgroundLoadCustomers,
		addOrUpdateCustomer,
		requestCustomerRefresh,
		reloadCustomers,
		clearLocalState,
		isUpdateCustomerDialogOpen,
		customerToUpdate,
		openUpdateCustomerDialog,
		closeUpdateCustomerDialog,
	};
});
