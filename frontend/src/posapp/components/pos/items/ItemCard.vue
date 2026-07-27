<template>
	<article
		:class="['card-item-card', { 'item-highlighted': isItemHighlighted }]"
		data-pos-keyboard-target="item-card"
		tabindex="0"
		:aria-label="`${item.item_name || item.item_code}`"
		@click="onClick"
		@keydown.enter="onClick"
		@keydown.space.prevent="onClick"
		:draggable="true"
		@dragstart="onDragStart"
		@dragend="onDragEnd"
	>
		<div class="card-item-image-container">
			<v-img
				v-if="resolvedImage && !imageFailed"
				:src="resolvedImage"
				class="card-item-image"
				:alt="item.item_name || item.item_code"
				@error="imageFailed = true"
			>
				<template #placeholder>
					<div class="image-placeholder">
						<v-icon size="40" color="grey-lighten-2"> mdi-image </v-icon>
					</div>
				</template>
			</v-img>
			<div v-else class="image-placeholder">
				<v-icon size="40" color="grey-lighten-2"> mdi-package-variant-closed </v-icon>
			</div>
		</div>
		<div class="card-item-content">
			<div class="card-item-header">
				<div class="card-item-name-shell" :title="item.item_name || item.item_code">
					<h4 class="card-item-name">{{ item.item_name || item.item_code }}</h4>
					<v-tooltip activator="parent" location="bottom">
						{{ item.item_name || item.item_code }}
					</v-tooltip>
				</div>
				<span v-if="showItemCode" class="card-item-code">{{ item.item_code }}</span>
			</div>
			<div class="card-item-footer">
				<div class="card-item-price">
					<div class="primary-price">
						<span class="currency-symbol">
							{{ currencySymbol(primaryCurrency) }}
						</span>
						<span class="price-amount">
							{{ formatCurrency(primaryRate, primaryCurrency, primaryPrecision) }}
						</span>
						<ItemRateInfoMenu
							v-if="showRateInfo"
							:rate-info="rateInfo"
							:currency-symbol="currencySymbol"
							:format-currency="formatCurrency"
							:rate-precision="ratePrecision"
						/>
					</div>
					<div v-if="showSecondaryPrice" class="secondary-price">
						<span class="currency-symbol">
							{{ currencySymbol(secondaryCurrency) }}
						</span>
						<span class="price-amount">
							{{ formatCurrency(secondaryRate, secondaryCurrency, secondaryPrecision) }}
						</span>
					</div>
				</div>
				<v-btn
					icon
					variant="outlined"
					class="item-card-add"
					:aria-label="addItemLabel"
					:title="addItemLabel"
					@click.stop="onClick"
					@keydown.stop
					@pointerdown.stop
				>
					<v-icon size="20">mdi-plus</v-icon>
					<v-tooltip activator="parent" location="top">{{ addItemLabel }}</v-tooltip>
				</v-btn>
			</div>
			<div v-if="allowStockDisplay" class="card-item-details">
				<div class="card-item-stock" :title="stockTitle">
					<v-icon size="14" class="stock-icon">mdi-package-variant-closed</v-icon>
					<span class="stock-label">{{ __("Stock") }}</span>
					<span
						class="stock-amount"
						:class="{
							'negative-number': isNegative(item.actual_qty),
						}"
					>
						{{ formattedActualQty }}
					</span>
					<span class="stock-uom">{{ item.stock_uom || "" }}</span>
				</div>
			</div>
		</div>
	</article>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { resolveItemImage } from "../../../utils/itemImage";
import ItemRateInfoMenu from "./ItemRateInfoMenu.vue";
import { priceListToSelectedCurrency } from "../../../utils/erpnextCurrency";

const __ =
	typeof window !== "undefined" && typeof window.__ === "function"
		? window.__
		: (value) => value;

const props = defineProps({
	item: { type: Object, required: true },
	posProfile: { type: Object, required: true },
	context: { type: String, default: "pos" },
	selectedCurrency: { type: String, default: "" },
	selectedExchangeRate: { type: Number, default: 1 },
	selectedConversionRate: { type: Number, default: 1 },
	hideQtyDecimals: { type: Boolean, default: false },
	showRateInfo: { type: Boolean, default: true },
	getItemRateInfo: { type: Function, required: true },
	isItemHighlighted: { type: Boolean, default: false },
	currencySymbol: { type: Function, required: true },
	formatCurrency: { type: Function, required: true },
	formatNumber: { type: Function, required: true },
	ratePrecision: { type: Function, required: true },
	isNegative: { type: Function, default: (val) => val < 0 },
});

const emit = defineEmits(["click", "dragstart", "dragend"]);

const imageFailed = ref(false);
const resolvedImage = computed(() => resolveItemImage(props.item));

watch(resolvedImage, () => {
	imageFailed.value = false;
});

const addItemLabel = computed(() => __("Add item"));

const showItemCode = computed(() => {
	const code = String(props.item?.item_code || "");
	const name = String(props.item?.item_name || "");
	return Boolean(code && code !== name);
});

const primaryCurrency = computed(() => {
	if (props.context === "purchase") {
		return (
			props.item.original_currency ||
			props.item.currency ||
			props.item.price_list_currency ||
			props.posProfile.currency
		);
	}
	return (
		props.item.original_currency ||
		props.item.currency ||
		props.item.price_list_currency ||
		props.posProfile.currency
	);
});

const primaryRate = computed(() => {
	if (props.context === "purchase") {
		return props.item.original_rate ?? props.item.rate ?? props.item.standard_rate ?? 0;
	}
	return props.item.original_rate ?? props.item.rate ?? 0;
});

const primaryPrecision = computed(() => {
	return props.ratePrecision(primaryRate.value);
});

const secondaryRate = computed(() => {
	return priceListToSelectedCurrency(
		{
			pos_profile: props.posProfile,
			price_list_currency: primaryCurrency.value,
			selected_currency: props.selectedCurrency || props.posProfile.currency,
			exchange_rate: props.selectedExchangeRate,
			conversion_rate: props.selectedConversionRate,
		},
		primaryRate.value,
	);
});

const secondaryPrecision = computed(() => {
	return props.ratePrecision(secondaryRate.value);
});

const rateInfo = computed(() => props.getItemRateInfo(props.item));

const secondaryCurrency = computed(() => props.selectedCurrency);

import { parseBooleanSetting } from "../../../utils/stock";

const allowStockDisplay = computed(() => parseBooleanSetting(props.posProfile?.posa_display_items_in_stock));
const allowMultiCurrency = computed(() => parseBooleanSetting(props.posProfile?.posa_allow_multi_currency));

const showSecondaryPrice = computed(() => {
	return (
		props.context !== "purchase" &&
		allowMultiCurrency.value &&
		Boolean(props.selectedCurrency) &&
		props.selectedCurrency !== primaryCurrency.value
	);
});

const formattedActualQty = computed(() => {
	const numericQty = Number(props.item.actual_qty ?? 0);
	if (!Number.isFinite(numericQty)) {
		return 0;
	}
	if (props.hideQtyDecimals) {
		return props.formatNumber(Math.round(numericQty), 0);
	}
	return props.formatNumber(numericQty, 4);
});

const stockTitle = computed(() => {
	const stockUom = props.item.stock_uom || "";
	return `${__("Stock")}: ${formattedActualQty.value}${stockUom ? ` ${stockUom}` : ""}`;
});

const onClick = (event) => {
	emit("click", event, props.item);
};

const onKeyboardSelect = (event) => {
	const key = event?.key || "";
	if (key !== "Enter" && key !== " ") {
		return;
	}
	event.preventDefault?.();
	emit("click", event, props.item);
};

const onDragStart = (event) => {
	emit("dragstart", event, props.item);
};

const onDragEnd = (event) => {
	emit("dragend", event);
};
</script>

<style scoped>
.card-item-card {
	--item-card-padding-block: 11px;
	--item-card-padding-inline: 11px;
	--item-card-gap: 7px;
	--item-card-name-height: 34px;
	--item-card-price-height: 44px;
	--item-card-stock-height: 24px;
	background: var(--pos-surface-raised);
	border-radius: var(--pos-radius-md, 14px);
	border: 1px solid var(--pos-border-light);
	overflow: hidden;
	transition:
		transform 0.18s ease,
		box-shadow 0.18s ease,
		border-color 0.18s ease,
		background-color 0.18s ease;
	cursor: pointer;
	display: grid;
	box-sizing: border-box;
	grid-template-rows:
		minmax(0, 1fr)
		var(--item-card-name-height)
		var(--item-card-price-height)
		var(--item-card-stock-height);
	gap: var(--item-card-gap);
	height: 100%;
	margin: 0;
	padding-block: var(--item-card-padding-block);
	padding-inline: var(--item-card-padding-inline);
	width: 100%;
	box-shadow: 0 8px 22px rgba(15, 23, 42, 0.045);
	will-change: transform;
	backface-visibility: hidden;
	transform: translate3d(0, 0, 0);
	position: relative;
}

.card-item-card:hover {
	transform: translate3d(0, -2px, 0);
	box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
	border-color: color-mix(in srgb, var(--pos-primary) 28%, var(--pos-border-light));
}

.card-item-card:focus-visible {
	outline: none;
	border-color: color-mix(in srgb, var(--pos-primary) 54%, var(--pos-border-light));
	box-shadow:
		0 0 0 3px color-mix(in srgb, var(--pos-primary) 12%, transparent),
		0 12px 26px rgba(15, 23, 42, 0.08);
}

.card-item-card.item-highlighted {
	border-color: var(--pos-primary);
	box-shadow:
		0 0 0 3px color-mix(in srgb, var(--pos-primary) 18%, transparent),
		0 12px 28px color-mix(in srgb, var(--pos-primary) 12%, transparent);
	background: color-mix(in srgb, var(--pos-primary-container) 24%, var(--pos-surface-raised));
}

.card-item-image-container {
	position: relative;
	min-block-size: 0;
	block-size: 100%;
	overflow: hidden;
	border-radius: var(--pos-radius-sm, 10px);
	background: color-mix(in srgb, var(--pos-surface-muted) 85%, var(--pos-surface-raised));
}

.card-item-image {
	width: 100%;
	height: 100%;
	padding: clamp(8px, 1vw, 13px);
	object-fit: contain;
	background-color: transparent;
}

.card-item-image :deep(.v-img__img) {
	object-fit: contain;
}

.image-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	color: var(--pos-text-muted);
	background: color-mix(in srgb, var(--pos-surface-muted) 78%, var(--pos-surface-raised));
}

.card-item-content {
	display: contents;
}

.card-item-header {
	min-block-size: 0;
	block-size: var(--item-card-name-height);
	min-width: 0;
	overflow: hidden;
}

.card-item-name-shell {
	min-width: 0;
}

.card-item-name {
	block-size: var(--item-card-name-height);
	margin: 0;
	display: -webkit-box;
	overflow: hidden;
	color: var(--pos-text-primary);
	font-size: 13.5px;
	font-weight: 730;
	line-height: 17px;
	overflow: hidden;
	text-overflow: ellipsis;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

.card-item-code {
	display: none;
}

.card-item-footer {
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	block-size: var(--item-card-price-height);
	overflow: hidden;
}

.card-item-price {
	min-width: 0;
	max-inline-size: calc(100% - 50px);
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 3px;
	overflow: hidden;
}

.primary-price {
	min-width: 0;
	display: flex;
	align-items: baseline;
	flex-wrap: nowrap;
	gap: 4px;
	color: var(--pos-primary);
	font-size: 14px;
	font-weight: 780;
	line-height: 1.15;
	white-space: nowrap;
}

.primary-price .currency-symbol,
.primary-price .price-amount {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.secondary-price {
	min-width: 0;
	display: flex;
	align-items: baseline;
	gap: 3px;
	color: var(--pos-text-muted);
	font-size: 11px;
	font-weight: 620;
	line-height: 1.2;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.item-card-add {
	flex: 0 0 40px;
	inline-size: 40px !important;
	min-inline-size: 40px !important;
	block-size: 40px !important;
	padding: 2px !important;
	border: 0 !important;
	border-radius: var(--pos-radius-sm, 10px) !important;
	background: transparent !important;
	color: var(--pos-primary) !important;
	box-shadow: none !important;
}

@media (min-width: 600px) and (max-width: 1199px) {
	.item-card-add {
		flex: 0 0 42px;
		inline-size: 42px !important;
		min-inline-size: 42px !important;
		block-size: 42px !important;
	}
}

@media (max-width: 599px) {
	.item-card-add {
		flex: 0 0 44px;
		inline-size: 44px !important;
		min-inline-size: 44px !important;
		block-size: 44px !important;
	}
}

.item-card-add :deep(.v-btn__content) {
	inline-size: 100%;
	block-size: 100%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 1px solid color-mix(in srgb, var(--pos-primary) 42%, var(--pos-border-light));
	border-radius: 10px;
	background: color-mix(in srgb, var(--pos-primary-container) 54%, var(--pos-surface-raised));
	transition:
		background-color 0.16s ease,
		border-color 0.16s ease,
		transform 0.16s ease;
}

.item-card-add:hover :deep(.v-btn__content),
.item-card-add:focus-visible :deep(.v-btn__content) {
	border-color: var(--pos-primary);
	background: color-mix(in srgb, var(--pos-primary-container) 78%, var(--pos-surface-raised));
	transform: translateY(-1px);
}

.card-item-details {
	min-width: 0;
	block-size: var(--item-card-stock-height);
	display: flex;
	align-items: center;
	justify-content: flex-start;
	overflow: hidden;
}

.card-item-stock {
	max-inline-size: 100%;
	min-inline-size: 0;
	display: flex;
	align-items: center;
	gap: 4px;
	padding-block: 4px;
	padding-inline: 7px;
	border: 1px solid color-mix(in srgb, var(--pos-text-muted) 14%, var(--pos-border-light));
	border-radius: 999px;
	background: color-mix(in srgb, var(--pos-surface-muted) 62%, transparent);
	color: var(--pos-text-muted);
	font-size: 11px;
	font-weight: 620;
	line-height: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.stock-icon,
.stock-label {
	flex: 0 0 auto;
}

.stock-label {
	color: var(--pos-text-secondary);
}

.stock-amount {
	flex: 0 0 auto;
	min-width: 0;
	font-weight: 740;
	color: var(--pos-text-primary);
}

.stock-amount.negative-number {
	color: rgb(var(--v-theme-error));
}

.stock-uom {
	flex: 1 1 auto;
	min-inline-size: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	text-transform: uppercase;
	color: var(--pos-text-muted);
	font-size: 10px;
	font-weight: 640;
}

@media (max-width: 768px) {
	.card-item-card {
		--item-card-padding-block: 8px;
		--item-card-padding-inline: 9px;
		--item-card-gap: 5px;
		--item-card-name-height: 30px;
		--item-card-price-height: 44px;
		--item-card-stock-height: 21px;
	}

	.card-item-name {
		font-size: 12px;
		line-height: 15px;
	}

	.card-item-code {
		display: none;
	}

	.primary-price {
		font-size: 12.5px;
	}

	.secondary-price {
		font-size: 10.5px;
	}

	.card-item-stock {
		padding-inline: 6px;
		font-size: 10.5px;
	}

	.stock-label {
		display: none;
	}

	.item-card-add :deep(.v-btn__content) {
		inline-size: 32px;
		block-size: 32px;
	}
}

@media (max-width: 430px) {
	.card-item-card {
		--item-card-padding-inline: 8px;
	}

	.card-item-name {
		font-size: 11.5px;
	}

	.card-item-stock {
		max-inline-size: 100%;
	}

	.stock-uom {
		max-inline-size: 44px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.card-item-card,
	.item-card-add :deep(.v-btn__content) {
		transition: none;
	}
}
</style>
