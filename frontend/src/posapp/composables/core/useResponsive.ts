import {
	computed,
	onBeforeUnmount,
	onMounted,
	ref,
	type ComputedRef,
	type Ref,
} from "vue";

export const POS_VIEWPORT_BREAKPOINTS = Object.freeze({
	phone: 600,
	tabletPortrait: 900,
	desktop: 1200,
});

export type PosViewportMode =
	| "phone"
	| "tablet-portrait"
	| "tablet-landscape"
	| "desktop";
export type PosDensityMode = "counter" | "touch" | "compact";
export type PosInputModality = "mouse" | "touch";

export function resolveViewportMode(width: number): PosViewportMode {
	if (width < POS_VIEWPORT_BREAKPOINTS.phone) return "phone";
	if (width < POS_VIEWPORT_BREAKPOINTS.tabletPortrait) {
		return "tablet-portrait";
	}
	if (width < POS_VIEWPORT_BREAKPOINTS.desktop) {
		return "tablet-landscape";
	}
	return "desktop";
}

export function resolveDensityMode({
	width,
	coarsePointer,
	preference,
}: {
	width: number;
	coarsePointer: boolean;
	preference?: PosDensityMode | null;
}): PosDensityMode {
	if (preference) return preference;
	if (coarsePointer) return "touch";
	if (width < POS_VIEWPORT_BREAKPOINTS.desktop) return "compact";
	return "counter";
}

const hasWindow = typeof window !== "undefined";
const windowWidth = ref(hasWindow ? window.innerWidth : 1280);
const windowHeight = ref(hasWindow ? window.innerHeight : 900);
const coarsePointer = ref(
	hasWindow ? window.matchMedia?.("(pointer: coarse)")?.matches || false : false,
);
const reducedMotion = ref(
	hasWindow
		? window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ||
			false
		: false,
);
const densityPreference = ref<PosDensityMode | null>(null);
const baseWidth = ref(1440);
const baseHeight = ref(900);

let consumerCount = 0;
let listening = false;
let resizeRafId: number | null = null;
let coarseQuery: MediaQueryList | null = null;
let motionQuery: MediaQueryList | null = null;

function readDensityPreference() {
	if (!hasWindow) return null;
	try {
		const stored = localStorage.getItem("posa_density_mode");
		return stored === "counter" || stored === "touch" || stored === "compact"
			? stored
			: null;
	} catch {
		return null;
	}
}

densityPreference.value = readDensityPreference();

function updateViewport() {
	if (!hasWindow) return;
	windowWidth.value = window.innerWidth;
	windowHeight.value = window.innerHeight;
	coarsePointer.value = coarseQuery?.matches || false;
	reducedMotion.value = motionQuery?.matches || false;
	applyResponsiveAttributes();
}

function applyResponsiveAttributes() {
	if (!hasWindow) return;
	const mode = resolveViewportMode(windowWidth.value);
	const density = resolveDensityMode({
		width: windowWidth.value,
		coarsePointer: coarsePointer.value,
		preference: densityPreference.value,
	});
	document.documentElement.dataset.posViewport = mode;
	document.documentElement.dataset.posDensity = density;
	document.documentElement.dataset.posInput = coarsePointer.value
		? "touch"
		: "mouse";
}

function scheduleViewportUpdate() {
	if (!hasWindow) return;
	if (resizeRafId !== null) window.cancelAnimationFrame(resizeRafId);
	resizeRafId = window.requestAnimationFrame(() => {
		resizeRafId = null;
		updateViewport();
	});
}

function startResponsiveRuntime() {
	if (!hasWindow || listening) return;
	listening = true;
	coarseQuery = window.matchMedia?.("(pointer: coarse)") || null;
	motionQuery =
		window.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
	window.addEventListener("resize", scheduleViewportUpdate, { passive: true });
	coarseQuery?.addEventListener?.("change", scheduleViewportUpdate);
	motionQuery?.addEventListener?.("change", scheduleViewportUpdate);
	updateViewport();
}

function stopResponsiveRuntime() {
	if (!hasWindow || !listening) return;
	listening = false;
	window.removeEventListener("resize", scheduleViewportUpdate);
	coarseQuery?.removeEventListener?.("change", scheduleViewportUpdate);
	motionQuery?.removeEventListener?.("change", scheduleViewportUpdate);
	coarseQuery = null;
	motionQuery = null;
	if (resizeRafId !== null) {
		window.cancelAnimationFrame(resizeRafId);
		resizeRafId = null;
	}
}

const viewportMode = computed(() => resolveViewportMode(windowWidth.value));
const isPhone = computed(() => viewportMode.value === "phone");
const isTablet = computed(() =>
	["tablet-portrait", "tablet-landscape"].includes(viewportMode.value),
);
const isDesktop = computed(() => viewportMode.value === "desktop");
const isCompact = computed(() => !isDesktop.value);
const isShortViewport = computed(() => windowHeight.value < 760);
const inputModality = computed<PosInputModality>(() =>
	coarsePointer.value ? "touch" : "mouse",
);
const densityMode = computed(() =>
	resolveDensityMode({
		width: windowWidth.value,
		coarsePointer: coarsePointer.value,
		preference: densityPreference.value,
	}),
);

const widthScale = computed(() => windowWidth.value / baseWidth.value);
const heightScale = computed(() => windowHeight.value / baseHeight.value);
const averageScale = computed(() =>
	Math.max(0.85, Math.min(1.1, (widthScale.value + heightScale.value) / 2)),
);

const dynamicSpacing = computed(() => {
	const multiplier =
		densityMode.value === "compact"
			? 0.75
			: densityMode.value === "touch"
				? 1.1
				: 1;
	const scale = averageScale.value * multiplier;
	return {
		xs: Math.max(4, Math.round(4 * scale)),
		sm: Math.max(6, Math.round(8 * scale)),
		md: Math.max(10, Math.round(16 * scale)),
		lg: Math.max(14, Math.round(24 * scale)),
		xl: Math.max(20, Math.round(32 * scale)),
	};
});

const responsiveStyles = computed(() => {
	const bottomSafeSpace = isPhone.value
		? isShortViewport.value
			? 176
			: 196
		: isTablet.value
			? isShortViewport.value
				? 112
				: 132
			: 24;
	return {
		"--dynamic-xs": `${dynamicSpacing.value.xs}px`,
		"--dynamic-sm": `${dynamicSpacing.value.sm}px`,
		"--dynamic-md": `${dynamicSpacing.value.md}px`,
		"--dynamic-lg": `${dynamicSpacing.value.lg}px`,
		"--dynamic-xl": `${dynamicSpacing.value.xl}px`,
		"--container-height": "100%",
		"--card-height": "100%",
		"--bottom-safe-space": `${bottomSafeSpace}px`,
		"--viewport-height": `${windowHeight.value}px`,
		"--font-scale": averageScale.value.toFixed(2),
		"--pos-control-min-height":
			densityMode.value === "touch" ? "48px" : "44px",
	};
});

export function setDensityPreference(preference: PosDensityMode | null) {
	densityPreference.value = preference;
	applyResponsiveAttributes();
	if (!hasWindow) return;
	try {
		if (preference) localStorage.setItem("posa_density_mode", preference);
		else localStorage.removeItem("posa_density_mode");
	} catch {
		// Storage can be unavailable in privacy-restricted browser contexts.
	}
}

export type ResponsiveRuntime = {
	windowWidth: Ref<number>;
	windowHeight: Ref<number>;
	baseWidth: Ref<number>;
	baseHeight: Ref<number>;
	viewportMode: ComputedRef<PosViewportMode>;
	isPhone: ComputedRef<boolean>;
	isTablet: ComputedRef<boolean>;
	isDesktop: ComputedRef<boolean>;
	isCompact: ComputedRef<boolean>;
	isShortViewport: ComputedRef<boolean>;
	coarsePointer: Ref<boolean>;
	reducedMotion: Ref<boolean>;
	inputModality: ComputedRef<PosInputModality>;
	densityMode: ComputedRef<PosDensityMode>;
	densityPreference: Ref<PosDensityMode | null>;
	widthScale: ComputedRef<number>;
	heightScale: ComputedRef<number>;
	averageScale: ComputedRef<number>;
	dynamicSpacing: ComputedRef<Record<string, number>>;
	responsiveStyles: ComputedRef<Record<string, string>>;
	setDensityPreference: typeof setDensityPreference;
};

const runtime: ResponsiveRuntime = {
	windowWidth,
	windowHeight,
	baseWidth,
	baseHeight,
	viewportMode,
	isPhone,
	isTablet,
	isDesktop,
	isCompact,
	isShortViewport,
	coarsePointer,
	reducedMotion,
	inputModality,
	densityMode,
	densityPreference,
	widthScale,
	heightScale,
	averageScale,
	dynamicSpacing,
	responsiveStyles,
	setDensityPreference,
};

export function useResponsive(): ResponsiveRuntime {
	onMounted(() => {
		consumerCount += 1;
		startResponsiveRuntime();
	});
	onBeforeUnmount(() => {
		consumerCount = Math.max(0, consumerCount - 1);
		if (consumerCount === 0) stopResponsiveRuntime();
	});
	return runtime;
}
