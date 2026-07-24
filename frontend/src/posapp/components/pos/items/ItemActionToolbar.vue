<template>
	<div
		class="item-filter-strip"
		:class="{ 'item-filter-strip--dock-reserved': reserveBottomDockSpace }"
	>
		<div class="category-strip" role="tablist" :aria-label="__('Item groups')">
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

		<div class="filter-actions">
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
				<span
					v-if="offersCount > 0"
					class="filter-action-btn__badge"
					aria-hidden="true"
				>
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
				<span
					v-if="couponsCount > 0"
					class="filter-action-btn__badge"
					aria-hidden="true"
				>
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
import { computed } from "vue";

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
</script>

<style scoped>
.item-filter-strip {
	min-width: 0;
	width: 100%;
	min-height: 52px;
	max-height: 52px;
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: center;
	gap: 8px;
	padding-block: 4px;
	padding-inline: 6px;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-md, 12px);
	background: color-mix(in srgb, var(--pos-surface-raised) 96%, transparent);
	box-shadow: none;
	overflow: hidden;
}

.item-filter-strip--dock-reserved {
	margin-bottom: 0;
}

.category-strip,
.filter-actions {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.category-strip {
	block-size: 44px;
	overflow-x: auto;
	overflow-y: hidden;
	overscroll-behavior-inline: contain;
	padding-block: 3px;
	scrollbar-width: none;
	white-space: nowrap;
}

.category-strip::-webkit-scrollbar,
.filter-actions::-webkit-scrollbar {
	display: none;
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
	font-size: 13px !important;
	font-weight: 680 !important;
}

.category-chip {
	flex: 0 0 auto;
	max-inline-size: 168px;
	padding: 3px !important;
	border: 0 !important;
	border-radius: var(--pos-radius-sm, 10px) !important;
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
	border-radius: var(--pos-radius-sm, 10px);
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
	border-radius: var(--pos-radius-sm, 10px);
	background: var(--pos-surface-raised);
	color: var(--pos-text-primary);
	outline: none;
}

.price-list-display:focus-visible {
	border-color: color-mix(in srgb, var(--pos-primary) 44%, var(--pos-border-light));
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--pos-primary) 10%, transparent);
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
	font-size: 13px;
	font-weight: 760;
	line-height: 1.12;
}

.view-toggle-btn {
	inline-size: 80px !important;
	min-inline-size: 80px !important;
	block-size: 40px !important;
	padding: 2px !important;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-sm, 10px) !important;
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
	border-radius: 8px !important;
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
	border-radius: var(--pos-radius-sm, 10px) !important;
	background: var(--pos-surface-raised) !important;
	box-shadow: none !important;
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
	font-size: 13px;
	font-weight: 690;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.filter-action-btn__badge {
	position: absolute;
	inset-block-start: -5px;
	inset-inline-end: -4px;
	min-inline-size: 16px;
	block-size: 16px;
	padding-inline: 4px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	background: currentColor;
	color: var(--pos-on-primary);
	border: 2px solid var(--pos-surface-raised);
	font-size: 10px;
	font-weight: 800;
	line-height: 1;
}

@media (max-width: 1279px) {
	.item-filter-strip {
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 6px;
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

@media (max-width: 767px) {
	.item-filter-strip {
		max-height: 104px;
		grid-template-columns: 1fr;
		grid-template-rows: 44px 44px;
		align-items: center;
		gap: 4px;
		padding-block: 5px;
	}

	.filter-actions {
		justify-content: flex-start;
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-inline: contain;
		scrollbar-width: none;
	}

	.category-chip {
		max-inline-size: 132px;
	}

	.price-list-display {
		inline-size: 136px;
		min-inline-size: 136px;
	}

	.filter-action-btn {
		flex: 0 0 44px;
	}
}
</style>
