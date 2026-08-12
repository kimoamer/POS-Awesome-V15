/**
 * Offline sync protocol version.
 *
 * This value must match `SYNC_SCHEMA_VERSION` in
 * `posawesome/posawesome/api/offline_sync/common.py`. A contract test reads
 * both source files so a one-sided version bump fails in CI.
 */
export const OFFLINE_SYNC_SCHEMA_VERSION = "2026-08-08";
