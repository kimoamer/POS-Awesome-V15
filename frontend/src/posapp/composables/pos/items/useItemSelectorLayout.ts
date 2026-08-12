import { ref, computed, onMounted, onUnmounted, nextTick, watch, type Ref } from "vue";
import _ from "lodash";
import {
	getCardGap,
	getCardPadding,
} from "../../../utils/itemSelectorLayout";
import { useResponsive } from "../../core/useResponsive";

type SelectorLayoutOptions = {
	resizeDebounce?: number;
	loadVisibleItems?: () => void;
	showMedia?: Ref<boolean>;
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
	const { windowWidth } = useResponsive();
	const containerWidth = ref(0);
	const isOverflowing = ref(false);
	const itemsContainerRef = ref<any>(null);
	const scrollThrottle = ref<number | null>(null);
	let resizeObserver: ResizeObserver | null = null;

	// Computed Metrics
	const measuredWidth = computed(
		() => containerWidth.value || getFallbackContainerWidth(),
	);
	const cardGap = computed(() => getCardGap(measuredWidth.value));
	const cardPadding = computed(() => getCardPadding(measuredWidth.value));

	const cardColumns = computed(() => {
		const width = measuredWidth.value;
		if (width <= 0) return 1;

		const gap = cardGap.value;
		const padding = cardPadding.value;
		const availableWidth = Math.max(0, width - padding * 2);
		const minimumColumnWidth = getMinimumColumnWidth(width);
		const rawColumns = Math.floor(
			(availableWidth + gap) / (minimumColumnWidth + gap),
		);
		const minColumns = width >= 320 ? 2 : 1;
		const maxColumns = getMaximumColumns(width);
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
		const container = measuredWidth.value;
		const width = cardColumnWidth.value;
		if (options.showMedia?.value === false) {
			return container < 560 ? 152 : 158;
		}

		if (container < 560) return width < 170 ? 208 : 216;
		if (container < 900) return width < 175 ? 220 : 228;
		if (container < 1100) return width < 180 ? 226 : 234;
		return width >= 210 ? 248 : 238;
	});

	const cardSlotHeight = computed(() => cardRowHeight.value + cardGap.value);
	const cardSlotWidth = computed(() => cardColumnWidth.value + cardGap.value);

	// Actions
	const refreshLayoutMetrics = async () => {
		await nextTick();
		updateContainerWidth();
		checkItemContainerOverflow();
	};

	const scheduleCardMetricsUpdate = _.debounce(() => {
		void refreshLayoutMetrics();
	}, resizeDebounce);

	const getItemsContainerElement = (): HTMLElement | null => {
		if (!itemsContainerRef.value) {
			return null;
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
		if (width > 0) {
			containerWidth.value = Math.max(0, Math.round(width));
		}
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
			const nextWidth =
				entry?.contentRect?.width ||
				el.getBoundingClientRect().width ||
				0;
			if (nextWidth > 0) {
				containerWidth.value = Math.max(0, Math.round(nextWidth));
			}
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

		el.style.removeProperty("max-height");
		const scrollElement =
			(el.querySelector(".virtual-scroller") as HTMLElement | null) ||
			(el.querySelector(".items-card-grid") as HTMLElement | null) ||
			(el.querySelector(".v-table__wrapper") as HTMLElement | null) ||
			el;

		isOverflowing.value =
			scrollElement.scrollHeight > scrollElement.clientHeight + 1;
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
	const stopViewportWatch = watch(windowWidth, () => {
		if (typeof ResizeObserver === "undefined") {
			scheduleCardMetricsUpdate();
		}
	});

	// Lifecycle
	onMounted(() => {
		nextTick(() => {
			observeItemsContainer();
			checkItemContainerOverflow();
		});
	});

	onUnmounted(() => {
		stopContainerRefWatch();
		stopViewportWatch();
		disconnectResizeObserver();
		if (scrollThrottle.value) {
			cancelAnimationFrame(scrollThrottle.value);
		}
		scheduleCardMetricsUpdate.cancel();
	});

	function getFallbackContainerWidth(): number {
		if (windowWidth.value < 560) {
			return Math.max(0, windowWidth.value - 20);
		}
		if (windowWidth.value < 1200) {
			return Math.max(0, windowWidth.value - 32);
		}
		return Math.max(0, windowWidth.value * 0.58);
	}

	function getMinimumColumnWidth(width: number): number {
		if (width < 560) return 148;
		if (width < 900) return 158;
		if (width < 1100) return 168;
		return 176;
	}

	function getMaximumColumns(width: number): number {
		if (width < 320) return 1;
		if (width < 560) return 2;
		if (width < 740) return 3;
		if (width < 900) return 4;
		if (width < 1100) return 5;
		return 6;
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
		refreshLayoutMetrics,
		scheduleCardMetricsUpdate,
		onListScroll,
	};
}
