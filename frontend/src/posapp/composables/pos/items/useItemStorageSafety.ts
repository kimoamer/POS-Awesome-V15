import { ref } from "vue";
import { checkDbHealth } from "../../../../offline/index";
import { posDebug } from "../../../utils/debug";

declare const __: (_text: string) => string;
declare const frappe: any;

/**
 * useItemStorageSafety Composable
 *
 * Manages storage health checks (IndexedDB/LocalStorage).
 * Ensuring storage is available before attempting heavy operations prevents crashes.
 */
export function useItemStorageSafety() {
	// State
	const storageAvailable = ref(true);
	const itemWorker = ref<Worker | null>(null);

	/**
	 * Checks if the database is healthy and actionable.
	 * @returns {Promise<boolean>}
	 */
	async function ensureStorageHealth() {
		// If we already know storage is broken, don't keep checking unless we want to implement retry logic.
		// For now, we assume if it failed once, it's safer to degrade gracefully.
		if (!storageAvailable.value) return false;

		const isHealthy = await checkDbHealth();
		if (!isHealthy) {
			console.warn("Storage health check failed");
			markStorageUnavailable({
				error: "Storage health check failed",
				details: "Database could not be accessed or recovered.",
			});
			return false;
		}
		return true;
	}

	/**
	 * Marks storage as unavailable and stops related workers.
	 * @param {Object} args - Error details
	 */
	function markStorageUnavailable(args: Record<string, unknown> = {}) {
		if (!storageAvailable.value) return; // Already marked

		console.error("Marking storage as unavailable", args);
		storageAvailable.value = false;

		if (window.frappe) {
			frappe.show_alert({
				message: __(
					"Local storage is unavailable. Switching to online-only mode.",
				),
				indicator: "orange",
			});
		}
	}

	/**
	 * Kept as a compatibility hook for the selector initialization contract.
	 * Offline persistence owns the sole IndexedDB worker for the whole app;
	 * mounting a selector must not create a competing database connection.
	 */
	function startItemWorker() {
		if (!storageAvailable.value) {
			console.warn("Skipping worker start - storage unavailable");
			return;
		}

		posDebug(
			"item-storage",
			"persistence worker is owned by offline runtime",
		);
	}

	return {
		// State
		storageAvailable,
		itemWorker,

		// Methods
		ensureStorageHealth,
		markStorageUnavailable,
		startItemWorker,
	};
}
