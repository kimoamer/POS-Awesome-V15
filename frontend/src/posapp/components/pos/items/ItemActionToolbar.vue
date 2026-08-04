<template>
	<div class="item-filter-strip" :class="{ 'item-filter-strip--dock-reserved': reserveBottomDockSpace }">
		<div
			class="category-strip-shell"
			:class="{ 'category-strip-shell--overflowing': hasCategoryOverflow }"
		>
			<v-btn
				v-if="hasCategoryOverflow"
				icon
				variant="text"
				class="category-scroll-btn category-scroll-btn--prev"
				:disabled="!canScrollPrev"
				:aria-label="__('Previous item groups')"
				:title="__('Previous item groups')"
				@click="scrollCategories('prev')"
			>
				<v-icon size="19">{{ prevScrollIcon }}</v-icon>
			</v-btn>

			<div
				ref="categoryStripRef"
				class="category-strip"
				role="tablist"
				:aria-label="__('Item groups')"
				@scroll="updateCategoryScrollState"
				@wheel="handleCategoryWheel"
			>
				<v-btn
					v-for="category in allCategories"
					:key="category.value"
					variant="text"
					class="category-chip"
					:class="{ 'category-chip--active': isCategoryActive(category.value) }"
					:aria-pressed="isCategoryActive(category.value)"
					:title="category.label"
					@click="selectCategory(category.value)"
				>
					<span class="category-chip__surface">
						<v-icon v-if="isAllCategory(category.value)" size="16" class="category-chip__icon">
							mdi-view-grid-outline
						</v-icon>
						<span class="category-chip__label">{{ category.label }}</span>
					</span>
					<v-tooltip activator="parent" location="bottom">{{ category.label }}</v-tooltip>
				</v-btn>
			</div>

			<v-btn
				v-if="hasCategoryOverflow"
				icon
				variant="text"
				class="category-scroll-btn category-scroll-btn--next"
				:disabled="!canScrollNext"
				:aria-label="__('Next item groups')"
				:title="__('Next item groups')"
				@click="scrollCategories('next')"
			>
				<v-icon size="19">{{ nextScrollIcon }}</v-icon>
			</v-btn>
		</div>

		<div class="filter-actions">
			<div class="category-select-wrapper">
				<v-select
					:model-value="normalizedModelValue"
					:items="allCategories"
					item-title="label"
					item-value="value"
					variant="outlined"
					density="compact"
					hide-details
					class="category-select-input pos-themed-input"
					:aria-label="__('Item Group')"
					@update:model-value="selectCategory"
				/>
			</div>

			<v-tooltip
				v-if="posProfile.posa_enable_price_list_dropdown !== false"
				location="bottom"
				:disabled="!activePriceList"
			>
				<template #activator="{ props: tooltipProps }">
					<div
						v-bind="tooltipProps"
						class="price-list-display"
						tabindex="0"
						:aria-label="`${__('Price List')}: ${priceListLabel}`"
						:title="priceListLabel"
					>
						<span class="price-list-display__kicker">{{ __("Price List") }}</span>
						<span class="price-list-display__value">{{ priceListLabel }}</span>
					</div>
				</template>
				{{ priceListLabel }}
			</v-tooltip>

			<v-btn-toggle
				:model-value="itemsView"
				class="view-toggle-btn"
				density="compact"
				mandatory
				@update:model-value="updateItemsView"
			>
				<v-btn
					value="card"
					class="view-toggle-btn__item"
					:aria-label="__('Card view')"
					:title="__('Card view')"
				>
					<v-icon size="18">mdi-view-grid-outline</v-icon>
					<v-tooltip activator="parent" location="bottom">{{ __("Card view") }}</v-tooltip>
				</v-btn>
				<v-btn
					value="list"
					class="view-toggle-btn__item"
					:aria-label="__('List view')"
					:title="__('List view')"
				>
					<v-icon size="18">mdi-format-list-bulleted</v-icon>
					<v-tooltip activator="parent" location="bottom">{{ __("List view") }}</v-tooltip>
				</v-btn>
			</v-btn-toggle>

			<v-btn
				variant="text"
				class="filter-action-btn filter-action-btn--offers"
				:aria-label="`${__('Offers')}: ${offersCount}`"
				:title="__('Offers')"
				@click="$emit('open-offers')"
			>
				<v-icon size="18">mdi-tag-outline</v-icon>
				<span class="filter-action-btn__label">{{ __("Offers") }}</span>
				<span v-if="offersCount > 0" class="filter-action-btn__badge" aria-hidden="true">
					{{ formattedOffersCount }}
				</span>
				<v-tooltip activator="parent" location="bottom">
					{{ __("Offers") }}: {{ offersCount }}
				</v-tooltip>
			</v-btn>

			<v-btn
				variant="text"
				class="filter-action-btn filter-action-btn--coupons"
				:aria-label="`${__('Coupons')}: ${couponsCount}`"
				:title="__('Coupons')"
				@click="$emit('open-coupons')"
			>
				<v-icon size="18">mdi-ticket-percent-outline</v-icon>
				<span class="filter-action-btn__label">{{ __("Coupons") }}</span>
				<span v-if="couponsCount > 0" class="filter-action-btn__badge" aria-hidden="true">
					{{ formattedCouponsCount }}
				</span>
				<v-tooltip activator="parent" location="bottom">
					{{ __("Coupons") }}: {{ couponsCount }}
				</v-tooltip>
			</v-btn>
		</div>
	</div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const __ = window.__;

const props = defineProps({
	modelValue: { type: String, default: "ALL" },
	itemsGroup: { type: Array, default: () => [] },
	itemsView: { type: String, default: "card" },
	posProfile: { type: Object, required: true },
	activePriceList: { type: String, default: "" },
	offersCount: { type: Number, default: 0 },
	couponsCount: { type: Number, default: 0 },
	reserveBottomDockSpace: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "update:itemsView", "open-offers", "open-coupons"]);
const categoryStripRef = ref(null);
const hasCategoryOverflow = ref(false);
const canScrollPrev = ref(false);
const canScrollNext = ref(false);
let categoryResizeObserver = null;
let categoryScrollRaf = 0;

const translate = (value) => (typeof __ === "function" ? __(value) : value);

const normalizedModelValue = computed(() => String(props.modelValue || "ALL"));

const normalizeCategory = (entry) => {
	const rawValue =
		typeof entry === "string"
			? entry
			: entry?.value || entry?.item_group || entry?.name || entry?.title || entry?.label || "";
	const value = String(rawValue || "ALL");
	const label = value === "ALL" ? translate("All Items") : value;
	return {
		value,
		label,
	};
};

const allCategories = computed(() => {
	const seen = new Set();
	const categories = [normalizeCategory("ALL")];
	seen.add("ALL");

	props.itemsGroup.forEach((entry) => {
		const category = normalizeCategory(entry);
		if (!category.value || seen.has(category.value)) {
			return;
		}
		seen.add(category.value);
		categories.push(category);
	});

	return categories;
});

const priceListLabel = computed(() => props.activePriceList || translate("Default Price List"));
const formattedOffersCount = computed(() => formatCount(props.offersCount));
const formattedCouponsCount = computed(() => formatCount(props.couponsCount));
const isRtl = computed(() => {
	const el = categoryStripRef.value;
	if (el && typeof window !== "undefined") {
		return window.getComputedStyle(el).direction === "rtl";
	}
	if (typeof document !== "undefined") {
		return document.documentElement?.dir === "rtl";
	}
	return false;
});
const prevScrollIcon = computed(() => (isRtl.value ? "mdi-chevron-right" : "mdi-chevron-left"));
const nextScrollIcon = computed(() => (isRtl.value ? "mdi-chevron-left" : "mdi-chevron-right"));

function selectCategory(value) {
	emit("update:modelValue", value);
}

function updateItemsView(value) {
	if (!value) {
		return;
	}
	emit("update:itemsView", value);
}

function isCategoryActive(value) {
	return String(value || "ALL") === normalizedModelValue.value;
}

function isAllCategory(value) {
	return String(value || "ALL") === "ALL";
}

function formatCount(value) {
	const count = Number(value || 0);
	if (!Number.isFinite(count) || count <= 0) {
		return "0";
	}
	return count > 99 ? "99+" : String(Math.round(count));
}

function getCategoryScrollMetrics() {
	const el = categoryStripRef.value;
	if (!el) {
		return {
			max: 0,
			position: 0,
			overflowing: false,
		};
	}

	const max = Math.max(0, el.scrollWidth - el.clientWidth);
	const rawLeft = el.scrollLeft || 0;
	let position = isRtl.value ? Math.abs(rawLeft) : rawLeft;
	if (rawLeft > max) {
		position = max - rawLeft;
	}
	position = Math.max(0, Math.min(max, Math.abs(position)));

	return {
		max,
		position,
		overflowing: max > 1,
	};
}

function updateCategoryScrollState() {
	if (categoryScrollRaf) {
		cancelAnimationFrame(categoryScrollRaf);
	}
	categoryScrollRaf = requestAnimationFrame(() => {
		categoryScrollRaf = 0;
		const { max, position, overflowing } = getCategoryScrollMetrics();
		hasCategoryOverflow.value = overflowing;
		canScrollPrev.value = overflowing && position > 1;
		canScrollNext.value = overflowing && position < max - 1;
	});
}

function scrollCategoryStripBy(delta, behavior = "smooth") {
	const el = categoryStripRef.value;
	if (!el || !delta) return false;

	const before = el.scrollLeft;
	const signedDelta = isRtl.value ? -delta : delta;
	el.scrollBy({ left: signedDelta, behavior });

	requestAnimationFrame(updateCategoryScrollState);
	return Math.abs(el.scrollLeft - before) > 0.5;
}

function handleCategoryWheel(event) {
	const el = categoryStripRef.value;
	if (!el || !hasCategoryOverflow.value) return;

	const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
	if (!dominantDelta) return;

	const before = el.scrollLeft;
	const signedDelta = isRtl.value ? -dominantDelta : dominantDelta;
	el.scrollLeft += signedDelta;
	const moved = Math.abs(el.scrollLeft - before) > 0.5;

	if (moved) {
		event.preventDefault();
		updateCategoryScrollState();
	}
}

function scrollCategories(direction) {
	const el = categoryStripRef.value;
	if (!el) return;
	const distance = Math.max(160, Math.round(el.clientWidth * 0.6));
	scrollCategoryStripBy(direction === "prev" ? -distance : distance);
}

function setupCategoryResizeObserver() {
	if (typeof ResizeObserver === "undefined" || !categoryStripRef.value) {
		updateCategoryScrollState();
		return;
	}
	categoryResizeObserver?.disconnect?.();
	categoryResizeObserver = new ResizeObserver(updateCategoryScrollState);
	categoryResizeObserver.observe(categoryStripRef.value);
}

watch(
	() => allCategories.value.length,
	() => {
		nextTick(updateCategoryScrollState);
	},
);

onMounted(() => {
	nextTick(() => {
		setupCategoryResizeObserver();
		updateCategoryScrollState();
	});
});

onBeforeUnmount(() => {
	categoryResizeObserver?.disconnect?.();
	if (categoryScrollRaf) {
		cancelAnimationFrame(categoryScrollRaf);
	}
});
</script>

<style scoped>
.item-filter-strip {
	min-width: 0;
	width: 100%;
	min-height: calc(var(--pos-control-height, 44px) + 6px);
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: center;
	gap: var(--pos-control-gap, 6px);
	padding-top: 6px;
	padding-bottom: 0;
	padding-left: 0;
	padding-right: 0;
	border: 0;
	border-radius: 0;
	background: transparent;
	box-shadow: none;
	overflow: visible !important;
}

.item-filter-strip--dock-reserved {
	margin-bottom: 0;
}

.category-strip-shell,
.category-strip,
.filter-actions {
	display: flex;
	align-items: center;
	gap: var(--pos-control-gap, 6px);
	min-width: 0;
}

.category-strip-shell {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	align-items: center;
	gap: var(--pos-control-gap, 6px);
	overflow: hidden;
}

.category-strip-shell--overflowing {
	grid-template-columns: 36px minmax(0, 1fr) 36px;
}

.category-strip {
	block-size: var(--pos-control-height, 44px);
	box-sizing: border-box;
	overflow-x: auto;
	overflow-y: hidden;
	overscroll-behavior-inline: contain;
	padding-block: 3px;
	scrollbar-width: none;
	white-space: nowrap;
	scroll-behavior: smooth;
	touch-action: pan-x;
}

.category-strip::-webkit-scrollbar,
.filter-actions::-webkit-scrollbar {
	display: none;
}

.category-scroll-btn {
	inline-size: 36px !important;
	min-inline-size: 36px !important;
	block-size: 36px !important;
	min-block-size: 36px !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: 999px !important;
	background: var(--pos-surface-raised) !important;
	color: var(--pos-text-primary) !important;
	box-shadow: none !important;
}

.category-scroll-btn:hover,
.category-scroll-btn:focus-visible {
	border-color: color-mix(in srgb, var(--pos-primary) 32%, var(--pos-border-light)) !important;
	background: color-mix(in srgb, var(--pos-primary-container) 68%, var(--pos-surface-raised)) !important;
	color: var(--pos-primary) !important;
}

.category-scroll-btn:disabled {
	opacity: 0.38;
	box-shadow: none !important;
}

.filter-actions {
	flex: 0 0 auto;
	flex-wrap: nowrap;
	justify-content: flex-end;
	overflow: visible;
	white-space: nowrap;
}

.category-chip,
.filter-action-btn,
.view-toggle-btn__item {
	block-size: 44px !important;
	min-block-size: 44px !important;
	min-inline-size: 44px !important;
	text-transform: none !important;
	letter-spacing: 0 !important;
	font-size: var(--pos-font-label, 12px) !important;
	font-weight: 680 !important;
}

.category-chip {
	flex: 0 0 auto;
	max-inline-size: 168px;
	padding: 3px !important;
	border: 0 !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	background: transparent !important;
	color: var(--pos-text-primary) !important;
	box-shadow: none !important;
}

.category-chip :deep(.v-btn__content) {
	min-inline-size: 0;
}

.category-chip__surface {
	block-size: 38px;
	min-inline-size: 38px;
	max-inline-size: 100%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding-inline: 12px;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-control, 8px);
	background: var(--pos-surface-raised);
	color: inherit;
	transition:
		background-color 0.16s ease,
		border-color 0.16s ease,
		color 0.16s ease;
}

.category-chip:hover .category-chip__surface,
.category-chip:focus-visible .category-chip__surface {
	border-color: color-mix(in srgb, var(--pos-primary) 24%, var(--pos-border-light));
	background: color-mix(in srgb, var(--pos-primary-container) 54%, var(--pos-surface-raised));
	color: var(--pos-primary);
}

.category-chip--active .category-chip__surface {
	border-color: color-mix(in srgb, var(--pos-primary) 34%, var(--pos-border-light));
	background: color-mix(in srgb, var(--pos-primary-container) 76%, var(--pos-surface-raised));
	color: var(--pos-primary);
	box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pos-primary) 10%, transparent);
}

.category-chip__icon {
	flex: 0 0 auto;
}

.category-chip__label {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.price-list-display {
	inline-size: 150px;
	min-inline-size: 150px;
	block-size: 40px;
	min-block-size: 40px;
	padding-block: 5px;
	padding-inline: 10px;
	display: grid;
	align-content: center;
	gap: 2px;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-control, 8px);
	background: var(--pos-surface-raised);
	color: var(--pos-text-primary);
	outline: none;
}

.price-list-display:focus-visible {
	border-color: color-mix(in srgb, var(--pos-primary) 44%, var(--pos-border-light));
	box-shadow: none;
	outline: 2px solid color-mix(in srgb, var(--pos-primary) 12%, transparent);
	outline-offset: 0;
}

.price-list-display__kicker {
	font-size: 10px;
	font-weight: 680;
	line-height: 1;
	color: var(--pos-text-muted);
}

.price-list-display__value {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: var(--pos-font-control, 13px);
	font-weight: 760;
	line-height: 1.12;
}

.view-toggle-btn {
	inline-size: 80px !important;
	min-inline-size: 80px !important;
	block-size: 40px !important;
	padding: 2px !important;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised);
	box-shadow: none;
	overflow: hidden;
}

.view-toggle-btn__item {
	inline-size: 38px !important;
	min-inline-size: 38px !important;
	block-size: 36px !important;
	min-block-size: 36px !important;
	padding: 0 !important;
	border-radius: calc(var(--pos-radius-control, 8px) - 2px) !important;
	color: var(--pos-text-muted) !important;
}

.view-toggle-btn__item.v-btn--active {
	background: color-mix(in srgb, var(--pos-primary-container) 78%, transparent) !important;
	color: var(--pos-primary) !important;
}

.filter-action-btn {
	position: relative;
	block-size: 40px !important;
	min-block-size: 40px !important;
	min-inline-size: 84px !important;
	padding-inline: 10px !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised) !important;
	box-shadow: none !important;
	overflow: visible !important;
}

.filter-action-btn :deep(.v-btn__content) {
	overflow: visible !important;
}

.filter-action-btn--offers {
	color: color-mix(in srgb, var(--pos-primary) 82%, #5b21b6) !important;
}

.filter-action-btn--coupons {
	color: var(--pos-accent) !important;
}

.filter-action-btn:hover,
.filter-action-btn:focus-visible {
	background: color-mix(in srgb, currentColor 8%, var(--pos-surface-raised)) !important;
	border-color: color-mix(in srgb, currentColor 30%, var(--pos-border-light)) !important;
}

.filter-action-btn__label {
	font-size: var(--pos-font-control, 13px);
	font-weight: 690;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.filter-action-btn__badge {
	position: absolute;
	inset-block-start: -5px;
	inset-inline-end: -5px;
	min-inline-size: 18px;
	block-size: 18px;
	padding-inline: 4px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	background: #0284c7;
	color: #ffffff !important;
	border: 2px solid var(--pos-surface-raised, #ffffff);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
	font-size: 11px;
	font-weight: 800;
	line-height: 1;
	z-index: 10;
}

.filter-action-btn--offers .filter-action-btn__badge {
	background: #0284c7 !important;
	color: #ffffff !important;
}

.filter-action-btn--coupons .filter-action-btn__badge {
	background: #ea580c !important;
	color: #ffffff !important;
}

.category-select-wrapper {
	min-width: 150px;
	max-width: 220px;
	flex-shrink: 1;
}

:deep(.category-select-input .v-field) {
	border-radius: var(--pos-radius-control, 8px) !important;
	height: 40px !important;
	min-height: 40px !important;
	background: var(--pos-surface-raised) !important;
	border: 1px solid var(--pos-border-light) !important;
}

:deep(.category-select-input .v-field__input) {
	min-height: 40px !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
	font-size: var(--pos-font-control, 12px) !important;
	font-weight: 680 !important;
	color: var(--pos-text-primary) !important;
}

@media (max-width: 1279px) {
	.item-filter-strip {
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--pos-control-gap, 6px);
	}

	.category-chip {
		max-inline-size: 144px;
	}

	.price-list-display {
		inline-size: 142px;
		min-inline-size: 142px;
	}

	.filter-action-btn {
		min-inline-size: 78px !important;
	}
}

@media (max-width: 1120px) {
	.filter-action-btn {
		inline-size: 44px !important;
		min-inline-size: 44px !important;
		padding-inline: 0 !important;
	}

	.filter-action-btn__label {
		display: none;
	}
}

@media (max-width: 1024px) {
	.view-toggle-btn {
		display: none !important;
	}
}

@media (max-width: 960px) {
	.category-strip-shell {
		display: none !important;
	}

	.item-filter-strip {
		max-height: 44px !important;
		grid-template-columns: 1fr !important;
		grid-template-rows: 44px !important;
		align-items: center;
		gap: var(--pos-control-gap, 6px);
		padding: 0;
	}

	.filter-actions {
		width: 100% !important;
		justify-content: flex-start !important;
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-inline: contain;
		scrollbar-width: none;
		gap: 6px !important;
	}

	.category-select-wrapper {
		display: block !important;
		flex: 1 1 auto;
		min-width: 130px;
	}
}
</style>
