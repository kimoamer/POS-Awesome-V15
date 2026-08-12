// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readServiceWorkerSource() {
	const thisFile = fileURLToPath(import.meta.url);
	const testsDir = path.dirname(thisFile);
	return readFileSync(
		path.resolve(testsDir, "../../posawesome/www/sw.js"),
		"utf8",
	);
}

describe("service worker precache", () => {
	it("preloads build-manifest font assets for offline icon rendering", () => {
		const source = readServiceWorkerSource();

		expect(source).toContain("assets.fonts");
		expect(source).toContain("...fontAssets");
		expect(source).toContain("cacheFirst");
		expect(source).toContain("staleWhileRevalidate");
	});

	it("preloads every entry stylesheet emitted by CSS code splitting", () => {
		const source = readServiceWorkerSource();

		expect(source).toContain("assets.styles");
		expect(source).toContain("...styleAssets");
	});

	it("preloads the IndexedDB worker and Dexie with the active build version", () => {
		const source = readServiceWorkerSource();

		expect(source).toContain(
			'"/assets/posawesome/dist/js/posapp/workers/itemWorker.js"',
		);
		expect(source).toContain(
			'"/assets/posawesome/dist/js/libs/dexie.min.js"',
		);
		expect(source).toContain("buildVersionedAssetUrl(");
	});

	it("isolates POSAwesome caches and keeps critical assets out of runtime eviction", () => {
		const source = readServiceWorkerSource();

		expect(source).toContain("key.startsWith(CACHE_PREFIX)");
		expect(source).toContain("`${activeCacheName}-runtime`");
		expect(source).toContain("`${activeCacheName}-images`");
		expect(source).toContain("MAX_IMAGE_CACHE_ITEMS");
	});

	it("requests an authenticated client replay when Background Sync is available", () => {
		const source = readServiceWorkerSource();

		expect(source).toContain('event.tag !== "posawesome-outbox-sync"');
		expect(source).toContain('type: "POSAWESOME_REPLAY_OUTBOX"');
	});
});
