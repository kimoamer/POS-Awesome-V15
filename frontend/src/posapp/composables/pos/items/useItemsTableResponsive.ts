import { ref, computed, onMounted, onBeforeUnmount, type Ref } from "vue";
import * as _ from "lodash";

export interface TableHeader {
	title: string;
	key: string;
	required?: boolean;
	sortable?: boolean;
	align?: "start" | "center" | "end";
	width?: string | number;
	minWidth?: string | number;
	[key: string]: any;
}

export const DATA_TABLE_EXPAND_COLUMN: TableHeader = {
	title: "",
	key: "data-table-expand",
	sortable: false,
	align: "center",
	width: 44,
	minWidth: 44,
};

const COMPACT_COLUMN_WIDTH = 680;
const STACKED_VIEWPORT_WIDTH = 1200;
const STACKED_CONTAINER_WIDTH = 500;
const COMPACT_CART_KEYS = new Set(["item_name", "qty", "rate", "amount", "actions"]);

export type CollapseOptionalSetting = boolean | "auto";

export function resolveCollapseOptional(
	value: CollapseOptionalSetting | undefined,
	width: number,
): boolean {
	if (value === true) return true;
	if (value === false) return false;
	return width > 0 && width < COMPACT_COLUMN_WIDTH;
}

export function getResponsiveVisibleHeaders(
	headers: TableHeader[],
	width: number,
	options: { collapseOptional?: CollapseOptionalSetting } = {},
) {
	return headers
		.filter((header) => {
			const shouldCollapseOptional = resolveCollapseOptional(
				options.collapseOptional,
				width,
			);

			if (shouldCollapseOptional) {
				return COMPACT_CART_KEYS.has(header.key);
			}

			return true;
		})
		.map((header) => ({
			...header,
			width: calculateColumnWidth(header, width),
			minWidth: calculateMinColumnWidth(header),
		}));
}

export function buildFinalVisibleColumns(
	headers: TableHeader[],
	width: number,
	options: { showExpand?: boolean; collapseOptional?: CollapseOptionalSetting } = {},
) {
	const visibleHeaders = getResponsiveVisibleHeaders(headers, width, {
		collapseOptional: options.collapseOptional,
	});

	if (options.showExpand === false) {
		return visibleHeaders;
	}

	return [...visibleHeaders, DATA_TABLE_EXPAND_COLUMN];
}

const calculateColumnWidth = (header: TableHeader, width: number) => {
	const baseWidths: Record<
		string,
		{ min: number; max: number; ratio: number }
	> = {
		item_name: { min: 160, max: 280, ratio: 0.34 },
		qty: { min: 116, max: 124, ratio: 0.14 },
		rate: { min: 82, max: 92, ratio: 0.1 },
		amount: { min: 96, max: 108, ratio: 0.12 },
		discount_percentage: { min: 90, max: 120, ratio: 0.1 },
		discount_amount: { min: 90, max: 120, ratio: 0.11 },
		price_list_rate: { min: 120, max: 140, ratio: 0.13 },
		actions: { min: 96, max: 96, ratio: 0.12 },
		posa_is_offer: { min: 70, max: 90, ratio: 0.06 },
	};

	const config = baseWidths[header.key] || {
		min: 80,
		max: 150,
		ratio: 0.1,
	};
	const calculatedWidth = width * config.ratio;
	return Math.max(config.min, Math.min(config.max, calculatedWidth));
};

const calculateMinColumnWidth = (header: TableHeader) => {
	const minWidths: Record<string, number> = {
		item_name: 160,
		qty: 116,
		rate: 82,
		amount: 96,
		discount_percentage: 90,
		discount_amount: 90,
		price_list_rate: 120,
		actions: 96,
		posa_is_offer: 70,
	};
	return minWidths[header.key] || 80;
};

export function useItemsTableResponsive(
	containerRef: Ref<HTMLElement | null>,
	headers: Ref<TableHeader[]>,
	options: { collapseOptional?: CollapseOptionalSetting | Ref<CollapseOptionalSetting> } = {},
) {
	const containerWidth = ref(0);
	const containerHeight = ref(0);
	const viewportWidth = ref(typeof window !== "undefined" ? window.innerWidth : 0);
	const breakpoint = ref("xl");
	let resizeObserver: ResizeObserver | null = null;

	const updateBreakpoint = (width: number) => {
		if (width < 500) return "xs";
		if (width < 700) return "sm";
		if (width < 900) return "md";
		if (width < 1200) return "lg";
		return "xl";
	};

	const isStackedRows = computed(() => {
		const currentViewportWidth = viewportWidth.value || 0;
		const currentContainerWidth = containerWidth.value || 0;
		return (
			(currentViewportWidth > 0 && currentViewportWidth < STACKED_VIEWPORT_WIDTH) ||
			(currentContainerWidth > 0 && currentContainerWidth < STACKED_CONTAINER_WIDTH)
		);
	});

	const collapseOptionalColumns = computed(() => {
		const currentContainerWidth = containerWidth.value || 0;
		return (
			isStackedRows.value ||
			(currentContainerWidth > 0 && currentContainerWidth < COMPACT_COLUMN_WIDTH)
		);
	});

	const responsiveHeaders = computed(() => {
		const width = containerWidth.value;
		if (!headers.value || headers.value.length === 0) return [];

		const collapseSetting =
			typeof options.collapseOptional === "object" && options.collapseOptional && "value" in options.collapseOptional
				? options.collapseOptional.value
				: options.collapseOptional;

		return getResponsiveVisibleHeaders(headers.value, width, {
			collapseOptional: collapseSetting !== undefined ? collapseSetting : collapseOptionalColumns.value,
		});
	});

	const isColumnVisible = (key: string) => {
		return responsiveHeaders.value.some((h) => h.key === key);
	};

	const containerStyles = computed(() => ({
		height: "100%",
		maxHeight: "100%",
		minHeight: "0",
		"--container-width": containerWidth.value + "px",
		"--container-height": containerHeight.value + "px",
	}));

	const containerClasses = computed(() => ({
		[`breakpoint-${breakpoint.value}`]: true,
		"compact-view": containerWidth.value < COMPACT_COLUMN_WIDTH,
		"medium-view":
			containerWidth.value >= COMPACT_COLUMN_WIDTH && containerWidth.value < 900,
		"large-view": containerWidth.value >= 900,
		"cart-compact-columns": collapseOptionalColumns.value,
		"stacked-cart-rows": isStackedRows.value,
	}));

	const tableClasses = computed(() => ({
		[`container-${breakpoint.value}`]: true,
		"responsive-table": true,
		"stacked-cart-rows": isStackedRows.value,
	}));

	const expandedContentClasses = computed(() => ({
		[`expanded-${breakpoint.value}`]: true,
		"compact-expanded": containerWidth.value < 600,
	}));

	const tableDensity = computed(() => {
		if (isStackedRows.value || containerWidth.value < 500) return "compact";
		if (containerWidth.value < 800) return "default";
		return "comfortable";
	});

	const updateViewportWidth = () => {
		viewportWidth.value = typeof window !== "undefined" ? window.innerWidth : 0;
	};

	const setupResizeObserver = () => {
		if (typeof ResizeObserver !== "undefined" && containerRef.value) {
			const debouncedResizeHandler = _.debounce(
				(entries: ResizeObserverEntry[]) => {
					for (let entry of entries) {
						const { width, height } = entry.contentRect;
						if (
							containerWidth.value !== width ||
							containerHeight.value !== height
						) {
							containerWidth.value = width;
							containerHeight.value = height;
							breakpoint.value = updateBreakpoint(width);
						}
					}
				},
				100,
			);

			resizeObserver = new ResizeObserver(debouncedResizeHandler);
			resizeObserver.observe(containerRef.value);
			// Initial call
			const rect = containerRef.value.getBoundingClientRect();
			containerWidth.value = rect.width;
			containerHeight.value = rect.height;
			breakpoint.value = updateBreakpoint(rect.width);
		}
	};

	onMounted(() => {
		updateViewportWidth();
		if (typeof window !== "undefined") {
			window.addEventListener("resize", updateViewportWidth, { passive: true });
		}
		setupResizeObserver();
	});

	onBeforeUnmount(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
		if (typeof window !== "undefined") {
			window.removeEventListener("resize", updateViewportWidth);
		}
	});

	return {
		containerWidth,
		containerHeight,
		viewportWidth,
		breakpoint,
		responsiveHeaders,
		isStackedRows,
		collapseOptionalColumns,
		isColumnVisible,
		containerStyles,
		containerClasses,
		tableClasses,
		expandedContentClasses,
		tableDensity,
	};
}
