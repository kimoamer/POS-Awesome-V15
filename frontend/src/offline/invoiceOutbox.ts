import {
	checkDbHealth,
	db,
	memory,
	persist,
	startupInitPromise,
} from "./db";
import { buildOfflineTenantScope } from "./scope";

type AnyRecord = Record<string, any>;

export type InvoiceOutboxMode = "off" | "dual_write" | "coordinator";
export type InvoiceOutboxStatus =
	| "pending"
	| "syncing"
	| "retrying"
	| "acknowledged"
	| "dead_letter";

export interface InvoiceOutboxEntry {
	outbox_id?: number;
	client_request_id: string;
	owner_scope: string;
	resource?: "invoice_outbox";
	status: InvoiceOutboxStatus;
	invoice: AnyRecord;
	data: AnyRecord;
	created_at: string;
	updated_at: string;
	next_retry_at: string | null;
	nextAttemptAt?: string | null;
	retry_count: number;
	last_error: string | null;
	invoice_name: string | null;
	acknowledged_at: string | null;
	lease_token?: string | null;
}

const TABLE = "invoice_outbox";
const MAX_RETRY_COUNT = 5;
const INITIAL_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60 * 1_000;
const SYNC_LEASE_MS = 5 * 60 * 1_000;
const OUTBOX_BATCH_SIZE = 50;
const NON_RETRYABLE_STATUSES = new Set<InvoiceOutboxStatus>([
	"acknowledged",
	"dead_letter",
]);
const HIDDEN_STATUSES = new Set<InvoiceOutboxStatus>(["acknowledged"]);
let hydratedOwnerScope: string | null = null;
let migratedOwnerScope: string | null = null;

function nowIso() {
	return new Date().toISOString();
}

function requestBackgroundOutboxSync() {
	if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
	void navigator.serviceWorker.ready
		.then((registration) => {
			const syncManager = (registration as ServiceWorkerRegistration & {
				sync?: { register: (tag: string) => Promise<void> };
			}).sync;
			return syncManager?.register?.("posawesome-outbox-sync");
		})
		.catch(() => undefined);
}

function cloneSerializable<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

function toErrorMessage(error: unknown) {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	try {
		return JSON.stringify(error);
	} catch {
		return String(error || "Unknown error");
	}
}

async function ensureOutboxReady() {
	await startupInitPromise;
	await checkDbHealth();
	if (!db.isOpen()) {
		await db.open();
	}
	const ownerScope = buildOfflineTenantScope();
	if (
		getInvoiceOutboxMode() === "coordinator" &&
		migratedOwnerScope !== ownerScope
	) {
		await migrateCurrentOwnerInvoiceQueue(ownerScope);
		migratedOwnerScope = ownerScope;
	}
	if (hydratedOwnerScope !== ownerScope) {
		await refreshInvoiceOutboxMemory(ownerScope);
		hydratedOwnerScope = ownerScope;
	}
}

async function migrateCurrentOwnerInvoiceQueue(ownerScope: string) {
	const queue = db.table("write_queue");
	const outbox = db.table(TABLE);
	await db.transaction("rw", queue, outbox, async () => {
		const rows = (await queue
			.where("[owner_scope+entity_type]")
			.equals([ownerScope, "invoice"])
			.toArray()) as AnyRecord[];
		for (const row of rows) {
			const payload = cloneSerializable(row?.payload || {});
			const clientRequestId = String(
				payload?.invoice?.posa_client_request_id ||
					payload?.data?.idempotency_key ||
					payload?.data?.client_request_id ||
					String(row?.idempotency_key || "").replace(/^invoice:/, "") ||
					`legacy-invoice-${row.queue_id}`,
			).trim();
			payload.invoice = payload.invoice || {};
			payload.data = payload.data || {};
			payload.invoice.posa_client_request_id = clientRequestId;
			payload.data.idempotency_key =
				payload.data.idempotency_key || clientRequestId;
			payload.data.client_request_id =
				payload.data.client_request_id || clientRequestId;
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
					invoice: payload.invoice,
					data: payload.data,
					created_at: row?.created_at || nowIso(),
					updated_at: row?.last_attempt_at || row?.created_at || nowIso(),
					next_retry_at: deadLetter ? null : row?.next_attempt_at || null,
					nextAttemptAt: deadLetter ? null : row?.next_attempt_at || null,
					retry_count: Number(row?.retry_count || 0),
					last_error: row?.last_error || null,
					invoice_name: null,
					acknowledged_at: null,
					lease_token: null,
				});
			}
			if (row?.queue_id) await queue.delete(row.queue_id);
		}
	});
}

async function refreshInvoiceOutboxMemory(
	ownerScope = buildOfflineTenantScope(),
) {
	const rows = (await db
		.table(TABLE)
		.where("owner_scope")
		.equals(ownerScope)
		.sortBy("created_at")) as InvoiceOutboxEntry[];
	memory.offline_invoices = rows
		.filter((row) => !HIDDEN_STATUSES.has(row.status))
		.map((row) => ({
			invoice: cloneSerializable(row.invoice),
			data: cloneSerializable(row.data),
			outbox_id: row.outbox_id,
			client_request_id: row.client_request_id,
			created_at: row.created_at,
			retry_count: row.retry_count,
			status: row.status,
			last_error: row.last_error,
		}));
}

export async function ensureInvoiceOutboxReady() {
	await ensureOutboxReady();
}

export function getInvoiceOutboxMode(): InvoiceOutboxMode {
	const mode = memory.invoice_outbox_mode;
	return mode === "dual_write" || mode === "coordinator" ? mode : "off";
}

export function setInvoiceOutboxMode(mode: InvoiceOutboxMode) {
	memory.invoice_outbox_mode = mode;
	migratedOwnerScope = null;
	hydratedOwnerScope = null;
	persist("invoice_outbox_mode", mode);
}

export function shouldWriteInvoiceOutbox() {
	return getInvoiceOutboxMode() !== "off";
}

function getClientRequestId(entry: AnyRecord) {
	return String(
		entry?.invoice?.posa_client_request_id ||
			entry?.data?.idempotency_key ||
			entry?.data?.client_request_id ||
			"",
	).trim();
}

export async function enqueueInvoiceOutboxEntry(entry: AnyRecord) {
	await ensureOutboxReady();
	const cleanEntry = cloneSerializable(entry);
	const clientRequestId = getClientRequestId(cleanEntry);
	if (!clientRequestId) {
		throw new Error("Invoice outbox entry requires a client_request_id");
	}

	const table = db.table(TABLE);
	const ownerScope = buildOfflineTenantScope();
	const result = await db.transaction("rw", table, async () => {
		const existing = (await table
			.where("[owner_scope+client_request_id]")
			.equals([ownerScope, clientRequestId])
			.first()) as InvoiceOutboxEntry | undefined;
		if (existing) {
			return existing;
		}

		const timestamp = nowIso();
		const outboxEntry: InvoiceOutboxEntry = {
			client_request_id: clientRequestId,
			owner_scope: ownerScope,
			resource: "invoice_outbox",
			status: "pending",
			invoice: cleanEntry.invoice,
			data: cleanEntry.data || {},
			created_at: timestamp,
			updated_at: timestamp,
			next_retry_at: null,
			nextAttemptAt: null,
			retry_count: 0,
			last_error: null,
			invoice_name: null,
			acknowledged_at: null,
		};
		const outboxId = await table.add(outboxEntry);
		return { ...outboxEntry, outbox_id: outboxId };
	});
	await refreshInvoiceOutboxMemory(ownerScope);
	requestBackgroundOutboxSync();
	return result;
}

export async function getInvoiceOutboxRows(
	options: { includeTerminal?: boolean } = {},
) {
	await ensureOutboxReady();
	const rows = (await db
		.table(TABLE)
		.where("owner_scope")
		.equals(buildOfflineTenantScope())
		.sortBy("created_at")) as InvoiceOutboxEntry[];
	return rows.filter(
		(row) => options.includeTerminal || !HIDDEN_STATUSES.has(row.status),
	);
}

export async function getPendingInvoiceOutboxCount() {
	return (await getInvoiceOutboxRows()).length;
}

export async function clearInvoiceOutboxEntries() {
	await ensureOutboxReady();
	const ownerScope = buildOfflineTenantScope();
	const table = db.table(TABLE);
	const rows = (await table
		.where("owner_scope")
		.equals(ownerScope)
		.toArray()) as InvoiceOutboxEntry[];
	const ids = rows
		.map((row) => row.outbox_id)
		.filter((id): id is number => Number.isFinite(Number(id)));
	if (ids.length) await table.bulkDelete(ids);
	await refreshInvoiceOutboxMemory(ownerScope);
}

export async function deleteInvoiceOutboxEntryByIndex(index: number) {
	await ensureOutboxReady();
	const rows = await getInvoiceOutboxRows();
	const target = rows[index];
	if (!target?.outbox_id) return;
	await deleteInvoiceOutboxEntry(target.outbox_id);
}

export async function deleteInvoiceOutboxEntry(outboxId: number) {
	await ensureOutboxReady();
	const table = db.table(TABLE);
	const target = (await table.get(outboxId)) as InvoiceOutboxEntry | undefined;
	if (target?.owner_scope !== buildOfflineTenantScope()) return false;
	await table.delete(outboxId);
	await refreshInvoiceOutboxMemory(buildOfflineTenantScope());
	return true;
}

export async function retryInvoiceOutboxEntry(outboxId: number) {
	await ensureOutboxReady();
	const ownerScope = buildOfflineTenantScope();
	const table = db.table(TABLE);
	const updated = await db.transaction("rw", table, async () => {
		const target = (await table.get(outboxId)) as InvoiceOutboxEntry | undefined;
		if (
			!target ||
			target.owner_scope !== ownerScope ||
			target.status === "acknowledged"
		) {
			return false;
		}
		await table.put({
			...target,
			status: "pending",
			retry_count: 0,
			next_retry_at: null,
			nextAttemptAt: null,
			last_error: null,
			lease_token: null,
			updated_at: nowIso(),
		});
		return true;
	});
	await refreshInvoiceOutboxMemory(ownerScope);
	if (updated) requestBackgroundOutboxSync();
	return updated;
}

function shouldAttempt(row: InvoiceOutboxEntry) {
	if (NON_RETRYABLE_STATUSES.has(row.status)) return false;
	if (row.status === "syncing") {
		const claimedAt = Date.parse(row.updated_at || "");
		if (Number.isFinite(claimedAt) && Date.now() - claimedAt < SYNC_LEASE_MS) {
			return false;
		}
	}
	if (!row.next_retry_at) return true;
	const nextRetryAt = Date.parse(row.next_retry_at);
	return !Number.isFinite(nextRetryAt) || nextRetryAt <= Date.now();
}

function createLeaseToken() {
	if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
	return `lease-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function computeBackoffMs(retryCount: number) {
	const multiplier = 2 ** Math.max(0, retryCount - 1);
	return Math.min(MAX_BACKOFF_MS, INITIAL_BACKOFF_MS * multiplier);
}

function markOutboxAcknowledged(
	row: InvoiceOutboxEntry,
	response: AnyRecord,
): InvoiceOutboxEntry {
	const timestamp = nowIso();
	return {
		...row,
		status: "acknowledged",
		resource: "invoice_outbox" as const,
		updated_at: timestamp,
		acknowledged_at: timestamp,
		last_error: null,
		next_retry_at: null,
		nextAttemptAt: null,
		invoice_name:
			response?.invoice?.name ||
			response?.name ||
			row.invoice_name ||
			null,
	};
}

function markOutboxFailed(row: InvoiceOutboxEntry, error: unknown): InvoiceOutboxEntry {
	const retryCount = Number(row.retry_count || 0) + 1;
	const status: InvoiceOutboxStatus =
		retryCount >= MAX_RETRY_COUNT ? "dead_letter" : "retrying";
	const nextRetryAt =
		status === "dead_letter"
			? null
			: new Date(Date.now() + computeBackoffMs(retryCount)).toISOString();
	return {
		...row,
		resource: "invoice_outbox" as const,
		status,
		retry_count: retryCount,
		updated_at: nowIso(),
		next_retry_at: nextRetryAt,
		nextAttemptAt: nextRetryAt,
		last_error: toErrorMessage(error),
	};
}

export async function syncInvoiceOutboxResource(
	callOfflineSyncMethod: (
		method: string,
		args?: Record<string, any>,
	) => Promise<any>,
) {
	await ensureOutboxReady();
	const rows = await getInvoiceOutboxRows();
	let acknowledged = 0;
	let failed = 0;
	const table = db.table(TABLE);
	const ownerScope = buildOfflineTenantScope();
	const attemptRows = rows
		.filter((row) => shouldAttempt(row))
		.slice(0, OUTBOX_BATCH_SIZE);
	const claimedRows: InvoiceOutboxEntry[] = [];
	await db.transaction("rw", table, async () => {
		for (const candidate of attemptRows) {
			if (!candidate.outbox_id) continue;
			const current = (await table.get(
				candidate.outbox_id,
			)) as InvoiceOutboxEntry | undefined;
			if (
				!current ||
				current.owner_scope !== ownerScope ||
				!shouldAttempt(current)
			) {
				continue;
			}
			const claimed: InvoiceOutboxEntry = {
				...current,
				resource: "invoice_outbox",
				status: "syncing",
				updated_at: nowIso(),
				lease_token: createLeaseToken(),
				nextAttemptAt: current.next_retry_at || null,
			};
			await table.put(claimed);
			claimedRows.push(claimed);
		}
	});
	const finalRows: InvoiceOutboxEntry[] = [];

	for (const claimed of claimedRows) {
		try {
			const response = await callOfflineSyncMethod(
				"posawesome.posawesome.api.offline_sync.invoices.submit_invoice_outbox_entry",
				{
					client_request_id: claimed.client_request_id,
					invoice: claimed.invoice,
					data: claimed.data,
				},
			);
			if (response?.acknowledged || response?.invoice || response?.name) {
				finalRows.push(markOutboxAcknowledged(claimed, response || {}));
				acknowledged += 1;
			} else {
				throw new Error("Invoice outbox response was not acknowledged");
			}
		} catch (error) {
			failed += 1;
			finalRows.push(markOutboxFailed(claimed, error));
		}
	}
	if (finalRows.length) {
		await db.transaction("rw", table, async () => {
			for (const finalRow of finalRows) {
				if (!finalRow.outbox_id) continue;
				const current = (await table.get(
					finalRow.outbox_id,
				)) as InvoiceOutboxEntry | undefined;
				if (
					current?.owner_scope !== ownerScope ||
					current?.status !== "syncing" ||
					current?.lease_token !== finalRow.lease_token
				) {
					continue;
				}
				await table.put({ ...finalRow, lease_token: null });
			}
		});
	}
	await refreshInvoiceOutboxMemory(ownerScope);

	const pending = await getPendingInvoiceOutboxCount();
	return {
		resourceId: "invoice_outbox",
		status: failed ? "error" : "fresh",
		lastError: failed
			? `${failed} invoice outbox entr${failed === 1 ? "y" : "ies"} failed`
			: null,
		watermark: nowIso(),
		lastSyncedAt: nowIso(),
		consecutiveFailures: failed ? 1 : 0,
		pendingCount: pending,
		acknowledged,
	};
}
