const CACHE_PREFIX = "posawesome-cache-";
const VERSION_URL = "/assets/posawesome/dist/js/version.json";
const DEFAULT_CACHE_VERSION = "default";
const MAX_RUNTIME_CACHE_ITEMS = 350;
const MAX_IMAGE_CACHE_ITEMS = 250;

const STATIC_PRECACHE_URLS = [
	"/app/posapp",
	"/assets/posawesome/dist/js/posapp/workers/itemWorker.js",
	"/assets/posawesome/dist/js/libs/dexie.min.js",
	"/manifest.json",
	"/offline.html",
];

function buildVersionedAssetUrl(url, version) {
	return `${url}?v=${encodeURIComponent(version || DEFAULT_CACHE_VERSION)}`;
}

function pickAssetUrl(assets, key, fallbackPath, version) {
	// Entries are now content-hashed at build time (see
	// build-manifest.js). The hashed filename is published in
	// version.json -> assets[key]; fall back to the legacy un-hashed
	// path for transitional rollouts where an old version.json is
	// still being served.
	const value = typeof assets?.[key] === "string" ? assets[key].trim() : "";
	if (value) {
		return value;
	}
	return buildVersionedAssetUrl(fallbackPath, version);
}

function getPrecacheUrls(version, assets = {}) {
	const fontAssets = Array.isArray(assets.fonts)
		? assets.fonts.filter((url) => typeof url === "string" && url.trim())
		: [];
	const styleAssets = Array.isArray(assets.styles)
		? assets.styles.filter((url) => typeof url === "string" && url.trim())
		: [];
	return [
		pickAssetUrl(assets, "loader", "/assets/posawesome/dist/js/loader.js", version),
		pickAssetUrl(assets, "css", "/assets/posawesome/dist/js/posawesome.css", version),
		...styleAssets,
		pickAssetUrl(assets, "posawesome", "/assets/posawesome/dist/js/posawesome.js", version),
		pickAssetUrl(assets, "offlineIndex", "/assets/posawesome/dist/js/offline/index.js", version),
		buildVersionedAssetUrl("/assets/posawesome/dist/js/posapp/workers/itemWorker.js", version),
		buildVersionedAssetUrl("/assets/posawesome/dist/js/libs/dexie.min.js", version),
		...fontAssets,
		...STATIC_PRECACHE_URLS,
	];
}

let cachedCacheName = null;
let cacheNameInFlight = null;
let currentVersion = null;
let currentAssets = {};

async function precacheUrls(cacheName, version, assets = {}) {
	const cache = await caches.open(cacheName);
	const urls = getPrecacheUrls(version, assets);
	try {
		const responses = await Promise.all(
			urls.map(async (url) => {
				const response = await fetch(url);
				if (!response || !response.ok) {
					throw new Error(`Precache request failed (${response?.status || 0}): ${url}`);
				}
				return { url, response };
			}),
		);
		await Promise.all(responses.map(({ url, response }) => cache.put(url, response.clone())));
	} catch (error) {
		await caches.delete(cacheName);
		throw error;
	}
	return cache;
}

function cacheFamilyNames(activeCacheName) {
	return new Set([activeCacheName, `${activeCacheName}-runtime`, `${activeCacheName}-images`]);
}

async function cleanupObsoleteCaches(activeCacheName) {
	const keys = await caches.keys();
	const activeNames = cacheFamilyNames(activeCacheName);
	await Promise.all(
		keys
			.filter((key) => key.startsWith(CACHE_PREFIX) && !activeNames.has(key))
			.map((key) => caches.delete(key)),
	);
}

function postVersionMessage(target) {
	if (!currentVersion) return;
	const message = {
		type: "SW_VERSION_INFO",
		version: currentVersion,
		timestamp: Number(currentVersion),
	};
	if (target && typeof target.postMessage === "function") {
		target.postMessage(message);
	}
}

function extractBuildVersion(payload) {
	const version = payload?.version || payload?.buildVersion;
	return typeof version === "string" && version.trim().length ? version.trim() : DEFAULT_CACHE_VERSION;
}

function extractBuildAssets(payload) {
	return payload?.assets && typeof payload.assets === "object" ? payload.assets : {};
}

// Listen for version check messages
self.addEventListener("message", (event) => {
	const payload = event.data || {};
	if (payload.type === "CHECK_VERSION") {
		if (event.ports && event.ports[0]) {
			postVersionMessage(event.ports[0]);
		} else if (event.source) {
			postVersionMessage(event.source);
		}
		return;
	}
	if (payload.type === "SKIP_WAITING") {
		self.skipWaiting();
		return;
	}
	if (payload.type === "REFRESH_CACHE_VERSION") {
		const target = (event.ports && event.ports[0]) || event.source || null;
		const task = refreshCacheVersion(target);
		if (typeof event.waitUntil === "function") {
			event.waitUntil(task);
		}
		return;
	}
	if (payload.type === "CLIENT_FORCE_UNREGISTER") {
		const task = forceUnregisterServiceWorker();
		if (typeof event.waitUntil === "function") {
			event.waitUntil(task);
		}
	}
});

async function resolveBuildMetadata(forceRefresh = false) {
	if (forceRefresh) {
		currentVersion = null;
		currentAssets = {};
	}
	try {
		const response = await fetch(VERSION_URL, { cache: "no-store" });
		if (response && response.ok) {
			const payload = await response.json();
			currentVersion = extractBuildVersion(payload);
			currentAssets = extractBuildAssets(payload);
			return {
				version: currentVersion,
				assets: currentAssets,
			};
		}
	} catch (err) {
		console.warn("SW: failed to fetch build version", err);
	}
	return {
		version: DEFAULT_CACHE_VERSION,
		assets: currentAssets || {},
	};
}

async function getCacheName(forceRefresh = false, resolvedMetadata = null) {
	if (forceRefresh) {
		cachedCacheName = null;
		cacheNameInFlight = null;
	}
	if (cachedCacheName) {
		return cachedCacheName;
	}
	if (cacheNameInFlight) {
		return cacheNameInFlight;
	}
	cacheNameInFlight = (async () => {
		const metadata = resolvedMetadata || (await resolveBuildMetadata(forceRefresh));
		const version = metadata?.version || DEFAULT_CACHE_VERSION;
		const name = `${CACHE_PREFIX}${version}`;
		if (version !== DEFAULT_CACHE_VERSION) {
			cachedCacheName = name;
		}
		cacheNameInFlight = null;
		return name;
	})();
	return cacheNameInFlight;
}

async function enforceCacheLimit(cache, maxItems = MAX_RUNTIME_CACHE_ITEMS) {
	const keys = await cache.keys();
	if (keys.length > maxItems) {
		const excess = keys.length - maxItems;
		for (let i = 0; i < excess; i++) {
			await cache.delete(keys[i]);
		}
	}
}

async function cacheFirst(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response?.ok && response.status === 200) {
		await cache.put(request, response.clone());
	}
	return response;
}

async function staleWhileRevalidate(request, cacheName, maxItems) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	const network = fetch(request)
		.then(async (response) => {
			if (response?.ok && response.status === 200) {
				await cache.put(request, response.clone());
				await enforceCacheLimit(cache, maxItems);
			}
			return response;
		})
		.catch(() => null);
	if (cached) {
		void network;
		return cached;
	}
	return (await network) || Response.error();
}

async function refreshCacheVersion(target) {
	const metadata = await resolveBuildMetadata(true);
	const activeCacheName = await getCacheName(true, metadata);
	await precacheUrls(activeCacheName, metadata.version, metadata.assets);
	await cleanupObsoleteCaches(activeCacheName);
	postVersionMessage(target);
	const clients = await self.clients.matchAll({
		type: "window",
		includeUncontrolled: true,
	});
	clients.forEach(postVersionMessage);
	return activeCacheName;
}

async function forceUnregisterServiceWorker() {
	cachedCacheName = null;
	cacheNameInFlight = null;
	currentVersion = null;
	currentAssets = {};
	const keys = await caches.keys();
	await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)));
	await self.registration.unregister();
}

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			const metadata = await resolveBuildMetadata();
			const cacheName = await getCacheName(false, metadata);
			await precacheUrls(cacheName, metadata.version, metadata.assets);
			await self.skipWaiting();
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const metadata = await resolveBuildMetadata();
			const activeCacheName = await getCacheName(false, metadata);
			await precacheUrls(activeCacheName, metadata.version, metadata.assets);
			await cleanupObsoleteCaches(activeCacheName);
			await self.clients.claim();
			const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
			clients.forEach(postVersionMessage);
		})(),
	);
});

self.addEventListener("sync", (event) => {
	if (event.tag !== "posawesome-outbox-sync") return;
	event.waitUntil(
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
			clients.forEach((client) => client.postMessage({ type: "POSAWESOME_REPLAY_OUTBOX" }));
		}),
	);
});

self.addEventListener("fetch", (event) => {
	if (event.request.method !== "GET") return;

	const url = new URL(event.request.url);
	if (url.protocol !== "http:" && url.protocol !== "https:") return;

	if (event.request.url.includes("socket.io")) return;

	const isPosawesomeAsset = url.pathname.startsWith("/assets/posawesome/");
	const isNavigation = event.request.mode === "navigate";

	if (!isNavigation && !isPosawesomeAsset) {
		return;
	}

	if (isNavigation) {
		event.respondWith(
			(async () => {
				try {
					return await fetch(event.request);
				} catch (err) {
					const cached = await caches.match(event.request, { ignoreSearch: true });
					if (cached) {
						return cached;
					}

					const appShell = await caches.match("/app/posapp");
					if (appShell) {
						return appShell;
					}

					const offlinePage = await caches.match("/offline.html");
					if (offlinePage) {
						return offlinePage;
					}

					return Response.error();
				}
			})(),
		);
		return;
	}

	event.respondWith(
		(async () => {
			const cacheName = await getCacheName();
			const isImage = event.request.destination === "image";
			const isImmutable =
				/[-.][A-Za-z0-9_-]{8,}\.(?:js|css|woff2?|ttf|eot|png|svg|webp)$/i.test(url.pathname) ||
				url.searchParams.has("v");
			try {
				if (isImage) {
					return await staleWhileRevalidate(
						event.request,
						`${cacheName}-images`,
						MAX_IMAGE_CACHE_ITEMS,
					);
				}
				if (isImmutable) return await cacheFirst(event.request, cacheName);
				return await staleWhileRevalidate(
					event.request,
					`${cacheName}-runtime`,
					MAX_RUNTIME_CACHE_ITEMS,
				);
			} catch (networkError) {
				return (await caches.match(event.request, { ignoreSearch: true })) || Response.error();
			}
		})(),
	);
});
