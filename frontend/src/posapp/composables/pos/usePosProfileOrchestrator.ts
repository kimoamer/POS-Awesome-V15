import { ref, nextTick } from "vue";

let isSwitchingProfile = ref(false);
let activeRequestId = ref(0);

export function usePosProfileOrchestrator() {
	const applyPosProfileChange = async ({
		uiStore,
		nextProfile,
		nextStockSettings,
		onReconcileState,
		onReloadFeatures,
		onRecalculateInvoice,
	}: {
		uiStore: any;
		nextProfile: any;
		nextStockSettings?: any;
		onReconcileState?: (data: { previousProfile: any; nextProfile: any }) => void;
		onReloadFeatures?: () => void;
		onRecalculateInvoice?: () => void;
	}) => {
		if (isSwitchingProfile.value) return;

		isSwitchingProfile.value = true;
		const reqId = ++activeRequestId.value;
		const previousProfile = uiStore.posProfile;

		try {
			// 1. Invalidate all pending request IDs
			uiStore.posProfile = nextProfile;
			if (nextStockSettings && uiStore.stockSettings) {
				uiStore.stockSettings = nextStockSettings;
			}

			await nextTick();

			// 2. Perform state reconciliation across profile-scoped features
			if (typeof onReconcileState === "function") {
				onReconcileState({ previousProfile, nextProfile });
			}

			// 3. Reload newly enabled profile features
			if (typeof onReloadFeatures === "function" && reqId === activeRequestId.value) {
				onReloadFeatures();
			}

			// 4. Recalculate invoice totals and payment allocations
			if (typeof onRecalculateInvoice === "function" && reqId === activeRequestId.value) {
				onRecalculateInvoice();
			}
		} finally {
			if (reqId === activeRequestId.value) {
				isSwitchingProfile.value = false;
			}
		}
	};

	return {
		isSwitchingProfile,
		activeRequestId,
		applyPosProfileChange,
	};
}
