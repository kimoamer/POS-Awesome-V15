import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import {
	buildVersionPayload,
	getChunkFileName,
	getCssAssetFileNames,
	getEntryFileName,
} from "./build-manifest.js";
import {
	collectMdiIconNames,
	getMissingMdiIcons,
	isPosFontStylesheet,
	keepOnlyWoff2FontSources,
	subsetMaterialDesignIconCss,
} from "./font-optimization.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildVersion = process.env.POSAWESOME_BUILD_VERSION || Date.now().toString();

async function readPosSourceFiles(directory) {
	const sources = [];
	const entries = await fs.readdir(directory, { withFileTypes: true });
	for (const entry of entries) {
		const target = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			sources.push(...(await readPosSourceFiles(target)));
		} else if (/\.(?:ts|vue)$/.test(entry.name)) {
			sources.push(await fs.readFile(target, "utf8"));
		}
	}
	return sources;
}

function posawesomeModernFontPlugin() {
	let mdiIconsPromise = null;
	return {
		name: "posawesome-modern-fonts",
		enforce: "pre",
		async transform(source, id) {
			if (!isPosFontStylesheet(id)) return null;
			let optimized = keepOnlyWoff2FontSources(source);
			if (id.replace(/\\/g, "/").includes("/@mdi/font/css/materialdesignicons.css")) {
				mdiIconsPromise ||= readPosSourceFiles(path.resolve(__dirname, "src/posapp"))
					.then(collectMdiIconNames);
				const iconNames = await mdiIconsPromise;
				const missing = getMissingMdiIcons(optimized, iconNames);
				if (missing.length) {
					throw new Error(`Unknown Material Design icons: ${missing.join(", ")}`);
				}
				optimized = subsetMaterialDesignIconCss(optimized, iconNames);
			}
			return {
				code: optimized,
				map: null,
			};
		},
	};
}

function posawesomeBuildVersionPlugin(version) {
	return {
		name: "posawesome-build-version",
		apply: "build",
		async writeBundle(_options, bundle) {
			const outputDir = path.resolve(__dirname, "../posawesome/public/dist/js");
			await fs.mkdir(outputDir, { recursive: true });

			const compatibilityFiles = new Map();
			const loaderFile = getChunkFileName(bundle, "loader");
			const posawesomeFile = getChunkFileName(bundle, "posawesome");
			const offlineIndexFile = getChunkFileName(bundle, "offline/index");
			if (loaderFile) {
				compatibilityFiles.set("loader.js", `export * from ${JSON.stringify(`./${loaderFile}`)};\n`);
			}
			if (posawesomeFile) {
				compatibilityFiles.set("posawesome.js", `export * from ${JSON.stringify(`./${posawesomeFile}`)};\n`);
			}
			if (offlineIndexFile) {
				compatibilityFiles.set(
					"offline/index.js",
					`export * from ${JSON.stringify(`./${path.posix.basename(offlineIndexFile)}`)};\n`,
				);
			}

			const cssImports = getCssAssetFileNames(bundle).map(
				(fileName) => `@import url(${JSON.stringify(`./${fileName}`)});`,
			);
			compatibilityFiles.set(
				"posawesome.css",
				`${cssImports.join("\n")}\n`,
			);

			await Promise.all(
				Array.from(compatibilityFiles, async ([fileName, contents]) => {
					const target = path.resolve(outputDir, fileName);
					await fs.mkdir(path.dirname(target), { recursive: true });
					await fs.writeFile(target, contents, "utf8");
				}),
			);

			await fs.writeFile(
				path.resolve(outputDir, "version.json"),
				JSON.stringify(buildVersionPayload(version, bundle), null, 2),
				"utf8",
			);
		},
	};
}

export default defineConfig({
	base: "/assets/posawesome/dist/js/",
	plugins: [
		posawesomeModernFontPlugin(),
		posawesomeBuildVersionPlugin(buildVersion),
		vue(),
		viteStaticCopy({
			targets: [
				{
					src: "src/posapp/workers",
					dest: "posapp",
				},
				{
					src: "src/libs/*",
					dest: "libs",
				},
				{
					src: "node_modules/jsbarcode/dist/JsBarcode.all.min.js",
					dest: "libs",
				},
				{
					src: "node_modules/html2pdf.js/dist/html2pdf.bundle.min.js",
					dest: "libs",
				},
			],
		}),
	],
	css: {
		postcss: {
			plugins: [tailwindcss(), autoprefixer()],
		},
	},
	build: {
		target: "esnext",
		modulePreload: { polyfill: false },
		outDir: "../posawesome/public/dist/js",
		// Keep previous hashed files available so an
		// active till can finish a lazy-loaded flow while a new release is deployed.
		emptyOutDir: false,
		cssCodeSplit: true,
		rollupOptions: {
			input: {
				posawesome: path.resolve(__dirname, "src/posawesome.bundle.ts"),
				"offline/index": path.resolve(__dirname, "src/offline/index.ts"),
				loader: path.resolve(__dirname, "src/loader.ts"),
			},
			external: ["socket.io-client"],
			output: {
				format: "es",
				entryFileNames: getEntryFileName,
				chunkFileNames: "[name]-[hash].js",
				// Hash assets too — entries are now hashed
				// (build-manifest.js) so the un-hashed `posawesome.css`
				// would otherwise be the only file the browser can pin
				// stale across deploys.
				assetFileNames: "[name]-[hash].[ext]",
				manualChunks: (id) => {
					if (id.includes("node_modules")) {
						if (id.includes("@vuepic/vue-datepicker")) {
							return "date-picker";
						}
						if (id.includes("vue-qrcode-reader")) {
							return "barcode-camera";
						}
						if (id.includes("vue-virtual-scroller")) {
							return "virtual-scroller";
						}
						if (id.includes("vuetify")) {
							return "vuetify";
						}
						if (
							id.includes("/node_modules/vue/") ||
							id.includes("/node_modules/@vue/") ||
							id.includes("/node_modules/pinia/")
						) {
							return "vue";
						}
						return "vendor";
					}
				},
			},
		},
	},
	worker: {
		format: "es",
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	define: {
		__BUILD_VERSION__: JSON.stringify(buildVersion),
		"process.env.NODE_ENV": '"production"',
		process: '{"env":{}}',
	},
	test: {
		include: ["tests/**/*.spec.{js,ts}", "tests/**/*.test.{js,ts}"],
		exclude: ["tests/smoke/**"],
	},
});
