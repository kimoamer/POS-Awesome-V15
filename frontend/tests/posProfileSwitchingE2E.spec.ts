import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePosProfileOrchestrator } from "../src/posapp/composables/pos/usePosProfileOrchestrator";

describe("POS Profile Switching E2E Orchestrator", () => {
	it("executes transactional profile switching with state reconciliation and request invalidation", async () => {
		const orchestrator = usePosProfileOrchestrator();
		const uiStore = {
			posProfile: { name: "Profile A" },
			stockSettings: {},
		};

		let reconciled = false;
		let featuresReloaded = false;
		let invoiceRecalculated = false;

		await orchestrator.applyPosProfileChange({
			uiStore,
			nextProfile: { name: "Profile B" },
			onReconcileState: ({ previousProfile, nextProfile }) => {
				reconciled = previousProfile.name === "Profile A" && nextProfile.name === "Profile B";
			},
			onReloadFeatures: () => {
				featuresReloaded = true;
			},
			onRecalculateInvoice: () => {
				invoiceRecalculated = true;
			},
		});

		expect(uiStore.posProfile.name).toBe("Profile B");
		expect(reconciled).toBe(true);
		expect(featuresReloaded).toBe(true);
		expect(invoiceRecalculated).toBe(true);
		expect(orchestrator.isSwitchingProfile.value).toBe(false);
	});
});
