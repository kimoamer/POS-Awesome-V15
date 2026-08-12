import { createApp, defineAsyncComponent } from "vue";
// @ts-ignore
import vuetify from "./plugins/vuetify";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
// @ts-ignore
import Dexie from "dexie/dist/dexie.mjs";
import "@vuepic/vue-datepicker/dist/main.css";
import "../../../posawesome/public/css/rtl.css";
import "../style.css";
import "./styles/theme.css";
import eventBus from "./bus";
import themePlugin from "./plugins/theme";
import { pinia } from "./stores";
import { useToastStore } from "./stores/toastStore";
import { useSocketStore } from "./stores/socketStore";
import { createPosAppRouter } from "./router";
import {
	installGlobalErrorHandlers,
	isBenignGlobalError,
} from "./utils/errorReporting";
import {
	clearChunkRecoveryState,
	isDynamicImportFailure,
	recoverFromChunkLoadError,
	scheduleAfterStableBoot,
	scheduleChunkRecoveryStateReset,
} from "./utils/chunkLoadRecovery";
import { finalizePendingBundleActivation } from "./utils/bundleVersionActivation";
import { posDebug } from "./utils/debug";
import { reconcileBuildChangeOnStartup } from "./utils/buildCacheReconciler";
import {
	startupInitPromise,
	isOffline,
	registerPostHydrationTask,
} from "../offline";
import App from "./App.vue";
// @ts-ignore
import {
	attachProfilerHelpers,
	initLongTaskObserver,
	isPerfEnabled,
} from "./utils/perf";

declare const __BUILD_VERSION__: string;

const VueDatePicker = defineAsyncComponent(
	() => import("@vuepic/vue-datepicker"),
);

attachProfilerHelpers();

// Expose Dexie globally for libraries that expect a global Dexie instance
if (typeof window !== "undefined" && !(window as any).Dexie) {
	(window as any).Dexie = Dexie;
}

if (typeof frappe === "undefined") {
	console.error("Frappe is not defined");
} else {
	frappe.provide("frappe.PosApp");
}

export async function initPosStorage() {
	await startupInitPromise;
}

function getPosBuildVersion() {
	return typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : null;
}

let buildReconciliationChain: Promise<unknown> = Promise.resolve();

function queueBuildReconciliation(deferInitialBaseline: boolean) {
	const reconcile = async () =>
		await reconcileBuildChangeOnStartup({
			runtimeBuildVersion: getPosBuildVersion(),
			isOnline: !isOffline(),
			deferInitialBaseline,
		});
	buildReconciliationChain = buildReconciliationChain.then(
		reconcile,
		reconcile,
	);
	return buildReconciliationChain;
}

registerPostHydrationTask(async () => {
	await queueBuildReconciliation(false);
});

export async function runPosBootSync() {
	await queueBuildReconciliation(true);
}

async function startOptionalRuntimeServices() {
	const socketStore = useSocketStore();
	socketStore.init();

	await import("../sw-updater").catch((error) => {
		console.warn("Failed to initialize POS service worker updater", error);
	});

	if (!document.querySelector('link[rel="manifest"]')) {
		const link = document.createElement("link");
		link.rel = "manifest";
		link.href = "/manifest.json";
		document.head.appendChild(link);
	}

	const iconVersion =
		typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : "";
	const iconHref = `/assets/posawesome/icons/logo-192.png${
		iconVersion ? `?v=${encodeURIComponent(iconVersion)}` : ""
	}`;
	let appIcon = document.querySelector<HTMLLinkElement>(
		'link[data-posmate-app-icon="favicon"]',
	);
	if (!appIcon) {
		appIcon = document.createElement("link");
		appIcon.rel = "icon";
		appIcon.type = "image/png";
		appIcon.sizes = "192x192";
		appIcon.dataset.posmateAppIcon = "favicon";
		document.head.appendChild(appIcon);
	}
	appIcon.href = iconHref;

	let appleTouchIcon = document.querySelector<HTMLLinkElement>(
		'link[data-posmate-app-icon="apple-touch"]',
	);
	if (!appleTouchIcon) {
		appleTouchIcon = document.createElement("link");
		appleTouchIcon.rel = "apple-touch-icon";
		appleTouchIcon.sizes = "192x192";
		appleTouchIcon.dataset.posmateAppIcon = "apple-touch";
		document.head.appendChild(appleTouchIcon);
	}
	appleTouchIcon.href = iconHref;

	if (
		("serviceWorker" in navigator &&
			window.location.protocol === "https:") ||
		window.location.hostname === "localhost" ||
		window.location.hostname === "127.0.0.1"
	) {
		// Register at `/sw.js?v=<build>` so a new build forces a fresh
		// SW registration. The sw.js bytes are stable across deploys
		// (the file reads version.json at runtime), so without a
		// per-build URL discriminator the browser keeps the old SW
		// instance serving its old precache. Symptom in the field:
		// "POS won't let me add items" — the operator sees the new
		// Pinia store hooked up to the OLD bundle's DOM. Frappe drops
		// the query string for static files, so the served bytes are
		// identical; only the registration scope key differs.
		const swBuildVersion =
			typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : "";
		const swUrl = swBuildVersion
			? `/sw.js?v=${encodeURIComponent(swBuildVersion)}`
			: "/sw.js";
		navigator.serviceWorker
			.register(swUrl)
			.then((registration) => {
				posDebug("service-worker", "Registered", registration.scope);
			})
			.catch((err) => console.error("SW registration failed", err));
	}
}

class PosAppController {
	$parent: any;
	page: any;
	app: any;
	router: any;
	routerHistory: any;
	routerDispose: (() => void) | null;
	$el: any;

	constructor(input: any) {
		const parent = input?.parent || input;
		this.$parent = $(document);
		this.page = parent?.page || parent;
		this.app = null;
		this.routerDispose = null;
		this.make_body();
	}

	make_body() {
		this.$el = this.$parent.find(".main-section");
	}

	async initializeApp() {
		document.documentElement.classList.add("posawesome-active");
		document.documentElement.style.setProperty(
			"--posa-desk-sidebar-width",
			"0px",
		);
		// Vuetify instance is now imported from plugins/vuetify.ts
		this.app = createApp(App);
		const { router, history, dispose } = createPosAppRouter();
		this.router = router;
		this.routerHistory = history;
		this.routerDispose = dispose;
		this.app.component("VueDatePicker", VueDatePicker);
		this.app.use(pinia);
		this.app.use(this.router);
		this.app.use(eventBus);
		this.app.use(vuetify);
		this.app.use(themePlugin, { vuetify });

		this.app.config.errorHandler = (
			err: any,
			_instance: any,
			info: string,
		) => {
			if (isDynamicImportFailure(err)) {
				void recoverFromChunkLoadError(err, "vue-error-handler");
				return;
			}

			if (!isBenignGlobalError(err)) {
				console.error("Global Error:", err, info);
				const toastStore = useToastStore();
				toastStore.show({
					message: `An unexpected error occurred: ${err?.message || err}`,
					color: "error",
					timeout: 5000,
				});
			}
		};

		installGlobalErrorHandlers(this.app);

		this.app.mount(this.$el[0]);
		clearChunkRecoveryState();
		void this.router.isReady().finally(() => {
			scheduleChunkRecoveryStateReset();
			scheduleAfterStableBoot(() => {
				void finalizePendingBundleActivation();
				void startOptionalRuntimeServices();
			});
		});

		if (isPerfEnabled()) {
			initLongTaskObserver("posapp");
		}

		return this;
	}

	unmount() {
		document.documentElement.classList.remove("posawesome-active");
		document.documentElement.style.removeProperty(
			"--posa-desk-sidebar-width",
		);
		if (this.app) {
			// Clean up router to prevent global navigation interference
			if (this.router) {
				// Remove all route guards and listeners
				this.router.beforeEachCbs = [];
				this.router.afterEachCbs = [];
			}
			this.routerDispose?.();
			this.routerDispose = null;

			if (
				this.routerHistory &&
				typeof this.routerHistory.destroy === "function"
			) {
				this.routerHistory.destroy();
			} else if (
				this.router &&
				this.router.options &&
				this.router.options.history &&
				typeof this.router.options.history.destroy === "function"
			) {
				this.router.options.history.destroy();
			}

			this.app.unmount();
			this.app = null;
				this.router = null;
				this.routerHistory = null;
			posDebug("lifecycle", "POS App unmounted");
		}
	}

	setup_header() {}
}

export async function mountPosApp(pageRef: any) {
	if (pageRef?.$PosApp) {
		return pageRef.$PosApp;
	}

	const instance = new PosAppController(pageRef);
	await instance.initializeApp();
	if (pageRef) {
		pageRef.$PosApp = instance;
	}
	return instance;
}

frappe.PosApp!.posapp = class extends PosAppController {
	constructor(pageRef: any) {
		super(pageRef);
		void this.initializeApp();
	}
};
