// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const checkDbHealth = vi.fn().mockResolvedValue(true);

vi.mock("../src/offline/index", () => ({
	checkDbHealth,
}));

describe("item storage safety", () => {
	beforeEach(() => {
		checkDbHealth.mockClear();
	});

	it("does not create a second IndexedDB worker from the item selector", async () => {
		const WorkerConstructor = vi.fn();
		vi.stubGlobal("Worker", WorkerConstructor);
		const { useItemStorageSafety } = await import(
			"../src/posapp/composables/pos/items/useItemStorageSafety"
		);
		const { itemWorker, startItemWorker } = useItemStorageSafety();

		startItemWorker();

		expect(WorkerConstructor).not.toHaveBeenCalled();
		expect(itemWorker.value).toBeNull();
	});
});
