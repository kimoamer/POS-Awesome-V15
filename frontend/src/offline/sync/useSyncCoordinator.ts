import {
	SyncCoordinator,
	createDefaultSyncCoordinator,
} from "./SyncCoordinator";

let coordinator: SyncCoordinator | null = null;

export function useSyncCoordinator() {
	if (!coordinator) {
		coordinator = createDefaultSyncCoordinator();
	}
	return coordinator;
}

export function setSyncCoordinator(nextCoordinator: SyncCoordinator) {
	coordinator = nextCoordinator;
	return coordinator;
}

export function resetSyncCoordinatorForTests() {
	coordinator = null;
}
