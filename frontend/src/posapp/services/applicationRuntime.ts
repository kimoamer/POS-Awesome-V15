import { SyncCoordinator } from "../../offline/sync/SyncCoordinator";
import { createOfflineSyncRuntime } from "../../offline/sync/runtime";
import { setSyncCoordinator } from "../../offline/sync/useSyncCoordinator";
import type {
	SyncResourceDefinition,
	SyncResourceState,
	SyncTrigger,
} from "../../offline/sync/types";

type PosApplicationRuntimeOptions = {
	resources: SyncResourceDefinition[];
	runResource: (
		resource: SyncResourceDefinition,
		trigger: SyncTrigger,
	) => Promise<void | Partial<SyncResourceState>>;
	onSyncStateChange?: (states: SyncResourceState[]) => void;
	canSync: () => boolean;
	canRunTimerSync: () => boolean;
	timerIntervalMs?: number;
};

/**
 * Owns the process-level POS sync runtime. Layouts consume this service but do
 * not construct competing schedulers, which keeps a single writer for every
 * offline resource and makes teardown explicit.
 */
export function createPosApplicationRuntime(
	options: PosApplicationRuntimeOptions,
) {
	const coordinator = new SyncCoordinator({
		concurrency: 1,
		resources: options.resources,
		runResource: options.runResource,
		onStateChange: options.onSyncStateChange,
	});
	setSyncCoordinator(coordinator);

	const sync = createOfflineSyncRuntime({
		canSync: options.canSync,
		canRunTimerSync: options.canRunTimerSync,
		runTrigger: (trigger) => coordinator.runTrigger(trigger),
		timerIntervalMs: options.timerIntervalMs,
	});
	let started = false;
	const handleServiceWorkerMessage = (event: MessageEvent) => {
		if (event.data?.type !== "POSAWESOME_REPLAY_OUTBOX") return;
		void coordinator.runTrigger("online_resume").catch((error) => {
			console.warn("Background outbox replay failed", error);
		});
	};

	return {
		coordinator,
		sync,
		start() {
			if (started) return;
			started = true;
			sync.startTimerSync();
			if (typeof navigator !== "undefined") {
				navigator.serviceWorker?.addEventListener?.(
					"message",
					handleServiceWorkerMessage,
				);
			}
		},
		stop() {
			if (!started) return;
			started = false;
			sync.stopTimerSync();
			if (typeof navigator !== "undefined") {
				navigator.serviceWorker?.removeEventListener?.(
					"message",
					handleServiceWorkerMessage,
				);
			}
		},
	};
}
