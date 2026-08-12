// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
	clearCacheAPI,
	clearLocalStorage,
	clearSessionStorage,
} from "../src/utils/clearAllCaches";

describe("POS cache isolation", () => {
	afterEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		vi.unstubAllGlobals();
	});

	it("clears only POS-owned local and session storage keys by default", async () => {
		localStorage.setItem("posa_catalog", "1");
		localStorage.setItem("posawesome_theme_preference", "dark");
		localStorage.setItem("posa_offline_invoices", "pending-sale");
		localStorage.setItem("erpnext_unrelated", "keep");
		sessionStorage.setItem("posa_boot_retry_once", "1");
		sessionStorage.setItem("frappe_unrelated", "keep");

		await clearLocalStorage();
		await clearSessionStorage();

		expect(localStorage.getItem("posa_catalog")).toBeNull();
		expect(localStorage.getItem("posawesome_theme_preference")).toBeNull();
		expect(localStorage.getItem("posa_offline_invoices")).toBe(
			"pending-sale",
		);
		expect(localStorage.getItem("erpnext_unrelated")).toBe("keep");
		expect(sessionStorage.getItem("posa_boot_retry_once")).toBeNull();
		expect(sessionStorage.getItem("frappe_unrelated")).toBe("keep");
	});

	it("deletes only POSAwesome Cache API namespaces by default", async () => {
		const deleteCache = vi.fn(async () => true);
		vi.stubGlobal("caches", {
			keys: vi.fn(async () => [
				"posawesome-cache-build-1",
				"posawesome-cache-build-1-images",
				"erpnext-cache-v1",
			]),
			delete: deleteCache,
		});

		await clearCacheAPI();

		expect(deleteCache).toHaveBeenCalledTimes(2);
		expect(deleteCache).toHaveBeenCalledWith("posawesome-cache-build-1");
		expect(deleteCache).toHaveBeenCalledWith(
			"posawesome-cache-build-1-images",
		);
		expect(deleteCache).not.toHaveBeenCalledWith("erpnext-cache-v1");
	});
});
