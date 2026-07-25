import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import _ from "lodash";
import {
	getCardGap,
	getCardPadding,
} from "../../../utils/itemSelectorLayout.js";

type SelectorLayoutOptions = {
	resizeDebounce?: number;
	loadVisibleItems?: () => void;
};

/**
 * Manages the layout metrics and resize behavior for the ItemsSelector component.
 * Handles calculation of grid columns, card dimensions, and overflow detection.
 */
export function useItemSelectorLayout(options: SelectorLayoutOptions = {}) {
	const {
		resizeDebounce = 100,
		loadVisibleItems, // Method to load more items on scroll (pagination)
	} = options;

	// State
	const windowWidth = ref(window.innerWidth);
	const containerWidth = ref(0);
	const isOverflowing = ref(false);
	const itemsContainerRef = ref<any>(null);
	const scrollThrottle = ref<number | null>(null);
	let resizeObserver: ResizeObserver | null = null;

	// Computed Metrics
	const measuredWidth = computed(() => containerWidth.value || getFallbackContainerWidth());
	const cardGap = computed(() => getCardGap(measuredWidth.value));
	const cardPadding = computed(() => getCardPadding(measuredWidth.value));

	const cardColumns = computed(() => {
		const width = measuredWidth.value;
		if (width <= 0) return 1;

		const gap = cardGap.value;
		const padding = cardPadding.value;
		const availableWidth = Math.max(0, width - padding * 2);
		const minimumColumnWidth = getMinimumColumnWidth(width);
		const rawColumns = Math.floor((availableWidth + gap) / (minimumColumnWidth + gap));
		const minColumns = width >= 320 ? 2 : 1;
		const maxColumns = getMaximumColumns(width, windowWidth.value);
		return clamp(rawColumns || minColumns, minColumns, maxColumns);
	});

	const cardColumnWidth = computed(() => {
		const columns = Math.max(1, cardColumns.value);
		const width = measuredWidth.value;
		if (!width) {
			return getMinimumColumnWidth(width);
		}

		const gapTotal = cardGap.value * (columns - 1);
		const paddingTotal = cardPadding.value * 2;
		const available = Math.max(0, width - gapTotal - paddingTotal);
		return Math.floor(available / columns);
	});

	const cardRowHeight = computed(() => {
		const width = cardColumnWidth.value;
		if (windowWidth.value <= 767 || measuredWidth.value <= 520) {
			return width < 158 ? 210 : 216;
		}
		if (windowWidth.value <= 1279 || measuredWidth.value <= 920) {
			return width < 188 ? 232 : 240;
		}
		if (width >= 240) {
			return 258;
		}
		return 250;
	});

	const cardSlotHeight = computed(() => cardRowHeight.value + cardGap.value);
	const cardSlotWidth = computed(() => cardColumnWidth.value + cardGap.value);

	// Actions
	const updateWindowWidth = () => {
		windowWidth.value = window.innerWidth;
	};

	const scheduleCardMetricsUpdate = _.debounce(() => {
		updateWindowWidth();
		updateContainerWidth();
		checkItemContainerOverflow();
	}, resizeDebounce);

	const getItemsContainerElement = (): HTMLElement | null => {
		if (!itemsContainerRef.value) {
			if (typeof document === "undefined") return null;
			return document.querySelector(".items-card-container") as HTMLElement | null;
		}
		// Handle both Vue component ref and raw element
		return (itemsContainerRef.value.$el ||
			itemsContainerRef.value) as HTMLElement | null;
	};

	const updateContainerWidth = () => {
		const el = getItemsContainerElement();
		if (!el) {
			containerWidth.value = 0;
			return;
		}

		const width = el.getBoundingClientRect().width || el.clientWidth || 0;
		containerWidth.value = Math.max(0, Math.round(width));
	};

	const disconnectResizeObserver = () => {
		if (!resizeObserver) return;
		resizeObserver.disconnect();
		resizeObserver = null;
	};

	const observeItemsContainer = () => {
		disconnectResizeObserver();
		const el = getItemsContainerElement();
		if (!el) {
			containerWidth.value = 0;
			return;
		}

		updateContainerWidth();
		if (typeof ResizeObserver === "undefined") {
			return;
		}

		resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			const nextWidth = entry?.contentRect?.width || el.getBoundingClientRect().width || 0;
			containerWidth.value = Math.max(0, Math.round(nextWidth));
			checkItemContainerOverflow();
		});
		resizeObserver.observe(el);
	};

	const checkItemContainerOverflow = () => {
		const el = getItemsContainerElement();
		if (!el) {
			isOverflowing.value = false;
			return;
		}

		const containerHeight = parseFloat(
			getComputedStyle(el).getPropertyValue("--container-height"),
		);
		if (isNaN(containerHeight)) {
			isOverflowing.value = false;
			return;
		}

		const stickyHeader = el
			.closest(".dynamic-padding")
			?.querySelector(".sticky-header") as HTMLElement | null;
		const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 0;
		const availableHeight = containerHeight - headerHeight;

		// Only apply if calculated height is valid
		if (availableHeight > 0) {
			el.style.maxHeight = `${availableHeight}px`;
			isOverflowing.value = el.scrollHeight > availableHeight;
		}

		// Also schedule metrics update as this might affect layout
		// But be careful of infinite loops; separate updateWindowWidth logic if needed
	};

	const onListScroll = (event: Event) => {
		if (scrollThrottle.value) return;

		scrollThrottle.value = requestAnimationFrame(() => {
			try {
				const el = event.target as HTMLElement | null;
				if (!el) return;
				if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
					// Trigger pagination via callback
					if (typeof loadVisibleItems === "function") {
						// We need access to currentPage logic, but usually loadVisibleItems handles the "next/more" logic
						loadVisibleItems();
					}
				}
			} catch (error: unknown) {
				console.error("Error in list scroll handler:", error);
			} finally {
				scrollThrottle.value = null;
			}
		});
	};

	const stopContainerRefWatch = watch(
		itemsContainerRef,
		() => {
			nextTick(() => {
				observeItemsContainer();
				checkItemContainerOverflow();
			});
		},
		{ flush: "post" },
	);

	// Lifecycle
	onMounted(() => {
		window.addEventListener("resize", scheduleCardMetricsUpdate);
		nextTick(() => {
			updateWindowWidth();
			observeItemsContainer();
			checkItemContainerOverflow();
		});
	});

	onUnmounted(() => {
		window.removeEventListener("resize", scheduleCardMetricsUpdate);
		stopContainerRefWatch();
		disconnectResizeObserver();
		if (scrollThrottle.value) {
			cancelAnimationFrame(scrollThrottle.value);
		}
		scheduleCardMetricsUpdate.cancel();
	});

	function getFallbackContainerWidth(): number {
		if (windowWidth.value <= 767) {
			return Math.max(0, windowWidth.value - 20);
		}
		if (windowWidth.value <= 1279) {
			return Math.max(0, windowWidth.value - 32);
		}
		return Math.max(0, windowWidth.value * 0.58);
	}

	function getMinimumColumnWidth(width: number): number {
		if (width <= 520) {
			return 148;
		}
		if (width <= 920) {
			return 168;
		}
		return 186;
	}

	function getMaximumColumns(width: number, viewportWidth: number): number {
		if (viewportWidth <= 767 || width <= 520) {
			return 2;
		}
		if (viewportWidth <= 1279 || width <= 920) {
			return 4;
		}
		return 5;
	}

	function clamp(value: number, min: number, max: number): number {
		return Math.min(max, Math.max(min, value));
	}

	return {
		// Refs
		windowWidth,
		containerWidth,
		isOverflowing,
		itemsContainerRef, // Bind this to the container in template

		// Computed
		cardColumns,
		cardGap,
		cardPadding,
		cardRowHeight,
		cardSlotHeight,
		cardSlotWidth,
		cardColumnWidth,

		// Methods
		checkItemContainerOverflow,
		scheduleCardMetricsUpdate,
		onListScroll,
	};
}
