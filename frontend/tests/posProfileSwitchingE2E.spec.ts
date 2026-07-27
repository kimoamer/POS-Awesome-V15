import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePosProfileOrchestrator } from "../src/posapp/composables/pos/usePosProfileOrchestrator";

describe("POS Profile Switching Integration & E2E", () => {
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

	it("prevents stale background responses from mutating state after activeRequestId increments", async () => {
		const orchestrator = usePosProfileOrchestrator();
		const uiStore = {
			posProfile: { name: "Profile 1" },
			stockSettings: {},
		};

		let staleReloadCalled = false;

		// Start profile change 1
		const p1 = orchestrator.applyPosProfileChange({
			uiStore,
			nextProfile: { name: "Profile 2" },
			onReloadFeatures: () => {
				staleReloadCalled = true;
			},
		});

		// Start profile change 2 immediately (increments activeRequestId)
		await orchestrator.applyPosProfileChange({
			uiStore,
			nextProfile: { name: "Profile 3" },
		});

		await p1;

		expect(uiStore.posProfile.name).toBe("Profile 3");
	});
});
