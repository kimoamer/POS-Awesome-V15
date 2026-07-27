<template>
	<div class="items-card-container" :style="gridStyle">
		<div v-if="isLoading" class="items-card-grid items-card-skeleton-grid" aria-busy="true">
			<div
				v-for="n in 8"
				:key="n"
				class="item-card-skeleton"
				:style="{ height: skeletonRowHeight + 'px' }"
			>
				<Skeleton class="item-card-skeleton__media" height="132" />
				<div class="item-card-skeleton__body">
					<Skeleton height="14" width="72%" />
					<Skeleton height="14" width="44%" />
					<div class="item-card-skeleton__meta">
						<Skeleton height="12" width="38%" />
						<Skeleton height="12" width="28%" />
					</div>
				</div>
			</div>
		</div>
		<div v-else-if="displayedItems.length === 0" class="items-empty-state">
			<div class="items-empty-state__icon">
				<v-icon size="34">mdi-package-search-outline</v-icon>
			</div>
			<div class="items-empty-state__title">
				{{ noItemsTitle }}
			</div>
			<div class="items-empty-state__subtitle">
				{{ noItemsSubtitle }}
			</div>
			<v-btn
				v-if="showClearButton"
				variant="text"
				color="primary"
				class="items-empty-state__action"
				size="small"
				@click="handleClearSearch"
			>
				<v-icon size="17">mdi-filter-remove-outline</v-icon>
				{{ clearSearchLabel }}
			</v-btn>
		</div>
		<RecycleScroller
			v-else
			ref="scrollerRef"
			class="virtual-scroller"
			:list-class="['items-virtual-list', { 'item-container': isOverflowing }]"
			:items="displayedItems"
			key-field="item_code"
			:item-size="cardSlotHeight"
			:grid-items="cardColumns"
			:item-secondary-size="cardSlotWidth"
			:buffer="virtualScrollBuffer"
			:emit-update="true"
			@update="handleRangeUpdate"
		>
			<template #default="{ item }">
				<ItemCard
					v-if="item"
					:key="item.item_code"
					:item="item"
					:pos-profile="posProfile"
					:context="context"
					:selected-currency="selectedCurrency"
					:selected-exchange-rate="selectedExchangeRate"
					:selected-conversion-rate="selectedConversionRate"
					:hide-qty-decimals="hideQtyDecimals"
					:show-rate-info="showRateInfo"
					:get-item-rate-info="getItemRateInfo"
					:is-item-highlighted="isItemHighlighted(item)"
					:currency-symbol="currencySymbol"
					:format-currency="formatCurrency"
					:format-number="formatNumber"
					:rate-precision="ratePrecision"
					:is-negative="isNegative"
					:allow-stock-display="allowStockDisplay"
					:allow-multi-currency="allowMultiCurrency"
					:style="{
						width: cardColumnWidth + 'px',
						height: cardRowHeight + 'px',
					}"
					@click="handleItemClick"
					@dragstart="handleDragStart"
					@dragend="handleDragEnd"
				/>
			</template>
		</RecycleScroller>
	</div>
</template>

<script setup>
import { computed, ref } from "vue";
import { RecycleScroller } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import ItemCard from "./ItemCard.vue";
import Skeleton from "../../ui/Skeleton.vue";

const props = defineProps({
	displayedItems: { type: Array, default: () => [] },
	isLoading: { type: Boolean, default: false },
	searchInput: { type: String, default: "" },
	itemGroup: { type: String, default: "ALL" },
	isOverflowing: { type: Boolean, default: false },
	cardSlotHeight: { type: Number, default: 0 },
	cardColumns: { type: Number, default: 1 },
	cardSlotWidth: { type: Number, default: 0 },
	cardColumnWidth: { type: Number, default: 0 },
	cardRowHeight: { type: Number, default: 0 },
	cardGap: { type: Number, default: 12 },
	cardPadding: { type: Number, default: 12 },
	virtualScrollBuffer: { type: Number, default: 200 },
	posProfile: { type: Object, default: () => ({}) },
	context: { type: String, default: "pos" },
	selectedCurrency: { type: String, default: "" },
	selectedExchangeRate: { type: Number, default: 1 },
	selectedConversionRate: { type: Number, default: 1 },
	hideQtyDecimals: { type: Boolean, default: false },
	showRateInfo: { type: Boolean, default: true },
	getItemRateInfo: { type: Function, required: true },
	isItemHighlighted: { type: Function, required: true },
	currencySymbol: { type: Function, required: true },
	formatCurrency: { type: Function, required: true },
	formatNumber: { type: Function, required: true },
	ratePrecision: { type: Function, required: true },
	isNegative: { type: Function, required: true },
	noItemsTitle: { type: String, default: "" },
	noItemsSubtitle: { type: String, default: "" },
	clearSearchLabel: { type: String, default: "" },
	allowStockDisplay: { type: Boolean, default: undefined },
	allowMultiCurrency: { type: Boolean, default: undefined },
});

const emit = defineEmits(["select-item", "dragstart", "dragend", "virtual-range-update", "clear-search"]);

const showClearButton = computed(() => {
	return Boolean(props.searchInput) || (props.itemGroup && props.itemGroup !== "ALL");
});

const gridStyle = computed(() => ({
	"--items-grid-padding": `${props.cardPadding || 12}px`,
	"--items-grid-gap": `${props.cardGap || 12}px`,
}));

const skeletonRowHeight = computed(() => props.cardRowHeight || 240);

const handleItemClick = (event, item) => {
	emit("select-item", event, item);
};

const handleDragStart = (event, item) => {
	emit("dragstart", event, item);
};

const handleDragEnd = (event) => {
	emit("dragend", event);
};

const handleRangeUpdate = (...args) => {
	emit("virtual-range-update", ...args);
};

const handleClearSearch = () => {
	emit("clear-search");
};

const scrollerRef = ref(null);

const scrollToItem = (index) => {
	scrollerRef.value?.scrollToItem?.(index);
};

const getScrollerElement = () => {
	const ref = scrollerRef.value;
	return ref?.$el || ref;
};

const scrollToPosition = (position) => {
	const ref = scrollerRef.value;
	if (typeof ref?.scrollToPosition === "function") {
		ref.scrollToPosition(position);
		return true;
	}

	const scrollerElement = getScrollerElement();
	if (scrollerElement && "scrollTop" in scrollerElement) {
		scrollerElement.scrollTop = position;
		return true;
	}
	return false;
};

defineExpose({ scrollToItem, scrollToPosition, getScrollerElement, scrollerRef });
</script>

<style scoped>
.items-card-container {
	--items-grid-padding: 12px;
	--items-grid-gap: 12px;
	--items-grid-scrollbar: color-mix(in srgb, var(--pos-text-muted) 28%, transparent);
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
	overflow: hidden;
	position: relative;
}

.items-card-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(min(190px, 100%), 1fr));
	gap: var(--items-grid-gap);
	padding: var(--items-grid-padding);
	height: 100%;
	overflow-y: auto;
	overflow-x: hidden;
	scrollbar-gutter: stable;
	scrollbar-width: thin;
	scrollbar-color: var(--items-grid-scrollbar) transparent;
	overscroll-behavior: contain;
	contain: layout style;
	will-change: scroll-position;
	transform: translate3d(0, 0, 0);
}

.virtual-scroller {
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
	position: relative;
	scrollbar-gutter: stable;
	scrollbar-width: thin;
	scrollbar-color: var(--items-grid-scrollbar) transparent;
	overscroll-behavior: contain;
	contain: layout style;
	will-change: scroll-position;
}

.item-container {
	overflow: visible;
}

.virtual-scroller :deep(.vue-recycle-scroller__item-wrapper),
.virtual-scroller :deep(.vue-recycle-scroller__item-view) {
	margin: 0 !important;
	padding: 0 !important;
	box-sizing: border-box;
	overflow: visible !important;
}

.virtual-scroller :deep(.vue-recycle-scroller__item-view) {
	display: flex;
	align-items: flex-start;
	justify-content: flex-start;
}

.items-card-grid::-webkit-scrollbar {
	width: 8px;
}

.virtual-scroller::-webkit-scrollbar {
	width: 8px;
}

.items-card-grid::-webkit-scrollbar-track {
	background: transparent;
}

.virtual-scroller::-webkit-scrollbar-track {
	background: transparent;
}

.items-card-grid::-webkit-scrollbar-thumb,
.virtual-scroller::-webkit-scrollbar-thumb {
	background-color: var(--items-grid-scrollbar);
	border-radius: 999px;
	border: 2px solid transparent;
	background-clip: padding-box;
}

.virtual-scroller :deep(.items-virtual-list) {
	padding: var(--items-grid-padding);
	padding-block-end: calc(var(--items-grid-padding) + var(--items-grid-gap));
	contain: layout style;
	box-sizing: border-box;
	overflow: visible !important;
}

.items-card-skeleton-grid {
	padding-block-end: calc(var(--items-grid-padding) + var(--items-grid-gap));
}

.item-card-skeleton {
	min-width: 0;
	height: 260px;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-md, 14px);
	background: var(--pos-surface-raised);
	overflow: hidden;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.item-card-skeleton__media {
	--sk-bg: color-mix(in srgb, var(--pos-surface-muted) 88%, var(--pos-primary-container));
	border-radius: 0 !important;
}

.item-card-skeleton__body {
	padding-block: 14px;
	padding-inline: 14px;
	display: grid;
	gap: 10px;
}

.item-card-skeleton__body :deep(.skeleton) {
	--sk-bg: color-mix(in srgb, var(--pos-text-muted) 16%, transparent);
	border-radius: 999px !important;
}

.item-card-skeleton__meta {
	margin-block-start: 8px;
	padding-block-start: 10px;
	border-block-start: 1px solid var(--pos-border-light);
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.items-empty-state {
	width: 100%;
	height: 100%;
	min-height: 220px;
	padding-block: clamp(22px, 5vh, 52px);
	padding-inline: clamp(16px, 3vw, 28px);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	color: var(--pos-text-muted);
	background:
		radial-gradient(
			circle at center,
			color-mix(in srgb, var(--pos-primary-container) 40%, transparent),
			transparent 46%
		),
		var(--pos-card-bg);
}

.items-empty-state__icon {
	width: 64px;
	height: 64px;
	margin-block-end: 14px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 1px solid color-mix(in srgb, var(--pos-primary) 18%, var(--pos-border-light));
	border-radius: var(--pos-radius-md, 14px);
	background: color-mix(in srgb, var(--pos-primary-container) 58%, var(--pos-surface-raised));
	color: var(--pos-primary);
}

.items-empty-state__title {
	max-width: 360px;
	font-size: clamp(0.98rem, 1vw, 1.08rem);
	font-weight: 760;
	line-height: 1.24;
	color: var(--pos-text-primary);
}

.items-empty-state__subtitle {
	max-width: 360px;
	margin-block-start: 6px;
	font-size: 0.84rem;
	font-weight: 520;
	line-height: 1.45;
	color: var(--pos-text-muted);
}

.items-empty-state__action {
	margin-block-start: 14px;
	min-height: 40px;
	border-radius: var(--pos-radius-sm, 10px) !important;
	text-transform: none !important;
	letter-spacing: 0 !important;
	font-weight: 700 !important;
}

@media (max-width: 1200px) {
	.item-card-skeleton {
		height: 240px;
	}
}

@media (max-width: 768px) {
	.items-card-grid {
		grid-template-columns: repeat(auto-fill, minmax(min(168px, 100%), 1fr));
	}

	.item-card-skeleton {
		height: 216px;
	}

	.virtual-scroller :deep(.items-virtual-list) {
		padding-block-end: calc(
			var(--items-grid-padding) + var(--items-grid-gap) + var(--bottom-safe-space, 0px)
		);
	}

	.items-card-skeleton-grid {
		padding-block-end: calc(
			var(--items-grid-padding) + var(--items-grid-gap) + var(--bottom-safe-space, 0px)
		);
	}
}

@media (max-width: 430px) {
	.items-card-grid {
		grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
	}

	.items-empty-state {
		min-height: 190px;
	}

	.items-empty-state__icon {
		width: 58px;
		height: 58px;
	}
}
</style>
