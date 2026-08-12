const DIST_BASE_URL = "/assets/posawesome/dist/js/";

// Every emitted entry is now content-hashed. The Page controller
// (posapp.js) and the Service Worker (sw.js) read the actual hashed
// filenames from version.json's `assets` map at runtime, so the
// browser cannot pin a stale cached `posawesome.js` across deploys.
export function getEntryFileName() {
	return "[name]-[hash].js";
}

function toPublicAssetUrl(fileName) {
	return `${DIST_BASE_URL}${String(fileName || "").replace(/^\/+/, "")}`;
}

function toVersionedPublicAssetUrl(fileName, version) {
	const url = toPublicAssetUrl(fileName);
	return version ? `${url}?v=${encodeURIComponent(version)}` : url;
}

export function getChunkFileName(bundle, chunkName) {
	const match = Object.values(bundle || {}).find(
		(entry) => entry?.type === "chunk" && entry?.name === chunkName,
	);
	return match?.fileName || null;
}

export function getCssAssetFileNames(bundle, entryName = "posawesome") {
	const entry = Object.values(bundle || {}).find(
		(candidate) =>
			candidate?.type === "chunk" && candidate?.name === entryName,
	);
	const entryCss = [];
	const visitedChunks = new Set();
	const collectChunkCss = (chunk) => {
		if (!chunk || chunk.type !== "chunk" || visitedChunks.has(chunk.fileName)) {
			return;
		}
		visitedChunks.add(chunk.fileName);
		const importedCss = chunk.viteMetadata?.importedCss;
		if (importedCss) {
			entryCss.push(
				...Array.from(importedCss).filter((fileName) =>
					String(fileName).endsWith(".css"),
				),
			);
		}
		for (const importedChunk of chunk.imports || []) {
			collectChunkCss(bundle?.[importedChunk]);
		}
	};
	collectChunkCss(entry);
	if (entryCss.length) {
		return Array.from(new Set(entryCss)).sort();
	}

	// Compatibility fallback for synthetic bundles/tests and older Vite output.
	// A non-split build emits one stylesheet, while a split build normally exposes
	// the exact entry CSS set through `viteMetadata.importedCss` above.
	const cssAssets = Object.values(bundle || {}).filter(
		(entry) =>
			entry?.type === "asset" &&
			typeof entry?.fileName === "string" &&
			entry.fileName.endsWith(".css"),
	);
	if (!cssAssets.length) return [];
	cssAssets.sort((a, b) => (b.source?.length || 0) - (a.source?.length || 0));
	return [cssAssets[0].fileName];
}

function getCriticalFontAssetFileNames(bundle) {
	return Object.values(bundle || {})
		.filter(
			(entry) =>
			entry?.type === "asset" &&
			typeof entry?.fileName === "string" &&
			/materialdesignicons-webfont.*\.woff2$/i.test(
				entry.fileName,
			),
		)
		.map((entry) => entry.fileName)
		.sort();
}

export function buildVersionPayload(version, bundle = {}) {
	const loaderFile = getChunkFileName(bundle, "loader");
	const posawesomeFile = getChunkFileName(bundle, "posawesome");
	const offlineIndexFile = getChunkFileName(bundle, "offline/index");
	const cssFiles = getCssAssetFileNames(bundle);
	const styleUrls = cssFiles.map((fileName) =>
		toVersionedPublicAssetUrl(fileName, version),
	);
	const cssUrl = toVersionedPublicAssetUrl("posawesome.css", version);
	const fontFiles = getCriticalFontAssetFileNames(bundle);

	return {
		version,
		assets: {
			loader: loaderFile
				? toVersionedPublicAssetUrl(loaderFile, version)
				: toVersionedPublicAssetUrl("loader.js", version),
			posawesome: posawesomeFile
				? toVersionedPublicAssetUrl(posawesomeFile, version)
				: toVersionedPublicAssetUrl("posawesome.js", version),
			// `css` remains for clients upgrading from a pre-split release.
			css: cssUrl,
			styles: styleUrls.length ? styleUrls : [cssUrl],
			offlineIndex: offlineIndexFile
				? toPublicAssetUrl(offlineIndexFile)
				: toPublicAssetUrl("offline/index.js"),
			fonts: fontFiles.map(toPublicAssetUrl),
		},
	};
}
