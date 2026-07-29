<template>
	<div :class="cardClasses" class="pos-themed-card">
		<!-- Product Identity Region -->
		<div class="invoice-item-card__identity">
			<div class="cart-item-thumb" aria-hidden="true">
				<v-img
					v-if="itemImage && !imageFailed"
					:src="itemImage"
					:alt="itemTitle"
					class="cart-item-thumb__image"
					@error="imageFailed = true"
				/>
				<v-icon v-else size="20" class="cart-item-thumb__icon">mdi-package-variant-closed</v-icon>
			</div>
			<div class="cart-item-copy">
				<div class="cart-item-title-row">
					<span class="cart-item-title" :title="itemTitle">{{ itemTitle }}</span>
					<div class="cart-item-badges" v-if="hasBadges">
						<v-chip
							v-if="item.is_bundle"
							color="secondary"
							size="x-small"
							class="cart-item-badge"
						>
							{{ __("Bundle") }}
						</v-chip>
						<v-chip
							v-if="item.name_overridden"
							color="primary"
							size="x-small"
							class="cart-item-badge"
						>
							{{ __("Edited") }}
						</v-chip>
						<v-chip
							v-if="item.batch_no_is_expired"
							color="error"
							size="x-small"
							variant="flat"
							class="cart-item-badge"
						>
							{{ __("Expired") }}
						</v-chip>
						<v-chip
							v-if="item.has_batch_no && item.batch_no"
							color="info"
							size="x-small"
							variant="tonal"
							class="cart-item-badge"
						>
							{{ __("Batch") }}: {{ item.batch_no }}
						</v-chip>
						<v-chip
							v-if="item.posa_is_offer || item.is_free_item"
							color="success"
							size="x-small"
							variant="flat"
							class="cart-item-badge"
						>
							{{ __("Offer") }}
						</v-chip>
					</div>
				</div>
				<div class="cart-item-meta-row">
					<span class="cart-item-meta" :title="itemMetaTitle">{{ itemMetaTitle }}</span>
					<div class="cart-item-name-actions" v-if="canOverrideName">
						<v-btn
							icon
							size="x-small"
							variant="text"
							class="cart-item-name-action"
							@click.stop="$emit('open-name-dialog', item)"
							:aria-label="__('Edit item name')"
						>
							<v-icon size="x-small">mdi-pencil-outline</v-icon>
						</v-btn>
						<v-btn
							v-if="item.name_overridden"
							icon
							size="x-small"
							variant="text"
							class="cart-item-name-action"
							@click.stop="$emit('reset-item-name', item)"
							:aria-label="__('Reset item name')"
						>
							<v-icon size="x-small">mdi-undo</v-icon>
						</v-btn>
					</div>
				</div>
			</div>
		</div>

		<!-- Quantity Counter Region -->
		<div class="invoice-item-card__qty">
			<div class="posa-cart-table__qty-counter" :class="{ 'rtl-layout': isRTL }">
				<v-btn
					:disabled="disableDecrement"
					size="small"
					variant="flat"
					class="posa-cart-table__qty-btn minus-btn qty-control-btn"
					@click.stop="handleMinusClick"
					:aria-label="__('Decrease quantity')"
				>
					<v-icon size="small">mdi-minus</v-icon>
				</v-btn>
				<div
					v-if="!isEditingQty"
					class="posa-cart-table__qty-display amount-value"
					:class="{ 'negative-number': isNegative(item.qty), 'large-number': qtyLength > 6 }"
					:title="formatFloat(item.qty, hideQtyDecimals ? 0 : undefined)"
					@click.stop="openQtyEdit"
					tabindex="0"
					data-pos-keyboard-target="cart-qty"
					role="button"
					:aria-label="__('Edit quantity')"
					@keydown.enter.prevent="openQtyEdit"
					@keydown.space.prevent="openQtyEdit"
				>
					{{ formatFloat(item.qty, hideQtyDecimals ? 0 : undefined) }}
				</div>
				<v-text-field
					v-else
					v-model="editingQtyValue"
					density="compact"
					variant="outlined"
					class="posa-cart-table__qty-input"
					@blur="closeQtyEdit"
					@keydown.enter.prevent="closeQtyEdit"
					@keydown.esc.prevent="cancelQtyEdit"
					@click.stop
					ref="qtyInput"
					:autofocus="true"
					type="number"
					:disabled="disableInput"
				></v-text-field>
				<v-btn
					:disabled="disableIncrement"
					size="small"
					variant="flat"
					class="posa-cart-table__qty-btn plus-btn qty-control-btn"
					@click.stop="$emit('add-one', item)"
					:aria-label="__('Increase quantity')"
				>
					<v-icon size="small">mdi-plus</v-icon>
				</v-btn>
			</div>
		</div>

		<!-- Rate Region -->
		<div class="invoice-item-card__rate">
			<div
				v-if="!isEditingRate"
				class="invoice-item-card__rate-display"
				:class="{
					'is-editable': !disableRateEdit,
					'is-disabled': disableRateEdit,
				}"
				:tabindex="disableRateEdit ? -1 : 0"
				:role="disableRateEdit ? undefined : 'button'"
				:aria-disabled="disableRateEdit"
				:aria-label="disableRateEdit ? __('Rate') : __('Edit rate')"
				data-pos-keyboard-target="cart-rate"
				@click.stop="openRateEdit"
				@keydown.enter.prevent="openRateEdit"
				@keydown.space.prevent="openRateEdit"
			>
				<span v-if="layoutMode !== 'row'" class="cart-rate-label text-caption text-secondary mr-1">
					{{ __("Rate") }}:
				</span>

				<bdi class="cart-item-money cart-item-rate">
					<span class="amount-value" :class="{ 'negative-number': isNegative(item.rate) }">
						{{ formatMoney(item.rate, formatCurrency, currencySymbol, displayCurrency) }}
					</span>
				</bdi>

				<v-icon
					v-if="!disableRateEdit"
					size="14"
					class="invoice-item-card__rate-edit-icon"
					aria-hidden="true"
				>
					mdi-pencil-outline
				</v-icon>
			</div>

			<v-text-field
				v-else
				ref="rateInput"
				v-model="editingRateValue"
				type="number"
				inputmode="decimal"
				density="compact"
				variant="outlined"
				class="invoice-item-card__rate-input"
				:disabled="disableRateEdit"
				:autofocus="true"
				hide-details
				@click.stop
				@blur="submitRateEdit"
				@keydown.enter.prevent="submitRateEdit"
				@keydown.esc.prevent="cancelRateEdit"
			/>
		</div>

		<!-- Amount Region -->
		<div class="invoice-item-card__amount">
			<bdi class="cart-item-money cart-item-amount">
				<span class="amount-value" :class="{ 'negative-number': isNegative(lineAmount) }">
					{{ formatMoney(lineAmount, formatCurrency, currencySymbol, displayCurrency) }}
				</span>
			</bdi>
		</div>

		<!-- Action Cluster Region -->
		<div class="invoice-item-card__actions">
			<div class="cart-item-actions">
				<InvoiceItemRowActions
					:item="item"
					:can-remove="canRemove"
					@open-details="$emit('open-details', $event)"
					@remove-item="$emit('remove-item', $event)"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { formatMoney } from "../../../composables/pos/shared/useMoneyFormatter";
import { resolveItemImage } from "../../../utils/itemImage";
import InvoiceItemRowActions from "./InvoiceItemRowActions.vue";
import { getItemUiCapabilities } from "../../../composables/pos/items/useItemPermissions";

defineOptions({
	name: "InvoiceItemCard",
});

export interface InvoiceItemCardProps {
	item: any;
	catalogItem?: any;
	layoutMode?: "row" | "stacked" | "phone";
	posProfile?: any;
	isReturnInvoice?: boolean;
	invoiceType?: string;
	displayCurrency?: string;
	formatFloat: (val: any, precision?: number) => string;
	formatCurrency: (val: any, precision?: number) => string;
	currencySymbol: (currency?: string) => string;
	isNumber?: (val: any) => boolean | string;
	isNegative: (val: any) => boolean;
	hideQtyDecimals?: boolean;
	isRTL?: boolean;
}

const props = withDefaults(defineProps<InvoiceItemCardProps>(), {
	layoutMode: "row",
	posProfile: () => ({}),
});

const emit = defineEmits([
	"open-name-dialog",
	"reset-item-name",
	"add-one",
	"update-qty",
	"minus-click",
	"calc-uom",
	"update-rate",
	"update-discount-percent",
	"update-discount-amount",
	"toggle-offer",
	"open-details",
	"remove-item",
]);

const __ = (window as any).__ || ((text: string) => text);

const isEditingQty = ref(false);
const editingQtyValue = ref("");
const qtyInput = ref<any>(null);

const isEditingRate = ref(false);
const editingRateValue = ref("");
const rateInput = ref<any>(null);
const isSubmittingRate = ref(false);
const imageFailed = ref(false);

const cardClasses = computed(() => [
	"invoice-item-card",
	`invoice-item-card--${props.layoutMode}`,
	{ "is-return-item": props.isReturnInvoice },
]);

const qtyLength = computed(() => String(Math.abs(props.item?.qty || 0)).replace(".", "").length);

const lineAmount = computed(() => {
	const amt = Number(props.item?.amount);
	if (Number.isFinite(amt)) {
		return amt;
	}
	return Number(props.item?.qty || 0) * Number(props.item?.rate || 0);
});

const itemTitle = computed(() => props.item?.item_name || props.item?.item_code || __("Unnamed item"));

const itemImage = computed(() => resolveItemImage(props.item, props.catalogItem));

watch(itemImage, () => {
	imageFailed.value = false;
});

watch(
	() => [props.item?.posa_row_id, props.item?.rate],
	() => {
		if (!isEditingRate.value) {
			editingRateValue.value = "";
		}
	},
);

const itemMetaParts = computed(() => {
	const parts: string[] = [];
	const code = props.item?.item_code;
	if (code && code !== props.item?.item_name) {
		parts.push(code);
	}
	if (props.item?.uom) {
		parts.push(props.item.uom);
	}
	return parts;
});

const itemMetaTitle = computed(() => itemMetaParts.value.join(" · ") || props.item?.uom || "");

const hasBadges = computed(() => {
	return (
		props.item?.is_bundle ||
		props.item?.name_overridden ||
		props.item?.batch_no_is_expired ||
		(props.item?.has_batch_no && props.item?.batch_no) ||
		props.item?.posa_is_offer ||
		props.item?.is_free_item
	);
});

const capabilities = computed(() =>
	getItemUiCapabilities(props.posProfile, props.item, {
		isReturnInvoice: props.isReturnInvoice,
		invoiceType: props.invoiceType,
	}),
);

const canOverrideName = computed(() => capabilities.value.overrideItemName);
const canEditQuantity = computed(() => capabilities.value.editQty);
const canEditR = computed(() => capabilities.value.editRate);
const canRemove = computed(() => capabilities.value.removeItem);

const disableDecrement = computed(() => !canEditQuantity.value);
const disableIncrement = computed(() => !canEditQuantity.value || !!props.item?.disable_increment);
const disableInput = computed(() => !canEditQuantity.value);
const disableRateEdit = computed(() => !canEditR.value);

function openRateEdit() {
	if (disableRateEdit.value) return;
	isEditingRate.value = true;
	editingRateValue.value = String(props.item?.rate ?? 0);
	nextTick(() => {
		const input = rateInput.value?.$el?.querySelector?.("input") || rateInput.value;
		input?.focus?.();
		input?.select?.();
	});
}

function submitRateEdit() {
	if (!isEditingRate.value || isSubmittingRate.value) return;
	isSubmittingRate.value = true;
	try {
		const rawValue = String(editingRateValue.value ?? "").trim();
		if (rawValue !== "") {
			const newRate = Number(rawValue);
			if (Number.isFinite(newRate) && newRate >= 0 && newRate !== Number(props.item?.rate || 0)) {
				emit("update-rate", props.item, newRate);
			}
		}
	} finally {
		isEditingRate.value = false;
		editingRateValue.value = "";
		nextTick(() => {
			isSubmittingRate.value = false;
		});
	}
}

function cancelRateEdit() {
	isEditingRate.value = false;
	editingRateValue.value = "";
}

function openQtyEdit() {
	if (disableInput.value) return;
	isEditingQty.value = true;
	editingQtyValue.value = "";
	nextTick(() => {
		qtyInput.value?.focus?.();
	});
}

function closeQtyEdit() {
	if (isEditingQty.value) {
		if (editingQtyValue.value !== "" && editingQtyValue.value != null) {
			const newQty = parseFloat(editingQtyValue.value);
			const val = !newQty || newQty <= 0 ? 1 : newQty;
			emit("update-qty", props.item, val);
		}
		isEditingQty.value = false;
		editingQtyValue.value = "";
	}
}

function cancelQtyEdit() {
	isEditingQty.value = false;
	editingQtyValue.value = "";
}

function handleMinusClick() {
	emit("minus-click", props.item);
}
</script>

<style scoped>
.invoice-item-card {
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-raised, #ffffff);
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
	transition:
		background-color 0.2s ease,
		border-color 0.2s ease,
		box-shadow 0.2s ease;
	border-radius: 8px;
	margin-bottom: 8px;
}

.invoice-item-card:hover {
	background: color-mix(
		in srgb,
		var(--pos-primary-container, #eff6ff) 14%,
		var(--pos-surface-raised, #ffffff)
	);
	border-color: color-mix(in srgb, var(--pos-primary, #2563eb) 18%, var(--pos-border-light, #e2e8f0));
	box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.invoice-item-card--row {
	display: grid;
	grid-template-columns: minmax(145px, 1fr) 108px 82px 98px 76px;
	align-items: center;
	gap: 6px;
	min-height: 68px;
	padding: 8px;
}

.invoice-item-card--stacked {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto auto;
	grid-template-areas:
		"identity amount amount"
		"qty rate actions";
	gap: 8px 10px;
	padding: 10px;
	min-height: 104px;
}

.invoice-item-card--stacked .invoice-item-card__identity {
	grid-area: identity;
}

.invoice-item-card--stacked .invoice-item-card__qty {
	grid-area: qty;
	justify-content: flex-start;
}

.invoice-item-card--stacked .invoice-item-card__rate {
	grid-area: rate;
	display: flex;
	align-items: center;
}

.invoice-item-card--stacked .invoice-item-card__amount {
	grid-area: amount;
	justify-content: flex-end;
	align-self: flex-start;
}

.invoice-item-card--stacked .invoice-item-card__actions {
	grid-area: actions;
	justify-content: flex-end;
}

.invoice-item-card--phone {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	grid-template-areas:
		"identity amount"
		"qty actions"
		"rate rate";
	gap: 10px 12px;
	padding: 12px;
	min-height: 112px;
}

.invoice-item-card--phone .invoice-item-card__identity {
	grid-area: identity;
	min-width: 0;
}

.invoice-item-card--phone .invoice-item-card__amount {
	grid-area: amount;
	justify-self: end;
	align-self: flex-start;
}

.invoice-item-card--phone .invoice-item-card__qty {
	grid-area: qty;
	justify-self: start;
}

.invoice-item-card--phone .invoice-item-card__actions {
	grid-area: actions;
	justify-self: end;
}

.invoice-item-card--phone .invoice-item-card__rate {
	grid-area: rate;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding-top: 8px;
	border-top: 1px solid var(--pos-border-light, #e2e8f0);
}

.invoice-item-card__identity {
	display: grid;
	grid-template-columns: 40px minmax(0, 1fr);
	align-items: center;
	gap: 10px;
	min-width: 0;
}

.cart-item-thumb {
	width: 40px;
	height: 40px;
	border-radius: 8px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: color-mix(
		in srgb,
		var(--pos-primary-container, #eff6ff) 20%,
		var(--pos-surface-muted, #f8fafc)
	);
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	flex-shrink: 0;
}

.cart-item-thumb__image {
	width: 100%;
	height: 100%;
}

.cart-item-copy {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.cart-item-title-row,
.cart-item-meta-row {
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
}

.cart-item-title {
	font-size: 13px;
	font-weight: 760;
	line-height: 1.25;
	color: var(--pos-text-primary, #1e293b);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cart-item-meta {
	font-size: 11px;
	font-weight: 560;
	color: var(--pos-text-secondary, #64748b);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.cart-item-badges {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-shrink: 0;
}

.cart-item-badge {
	height: 18px !important;
	font-size: 10px !important;
}

.invoice-item-card__qty {
	display: flex;
	align-items: center;
	justify-content: center;
}

.invoice-item-card__rate {
	display: flex;
	align-items: center;
	justify-content: flex-end;
}

.invoice-item-card__rate-display {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 4px;
	min-width: 0;
	min-height: 36px;
	padding-inline: 6px;
	border: 1px solid transparent;
	border-radius: 7px;
	white-space: nowrap;
}

.invoice-item-card__rate-display.is-editable {
	cursor: pointer;
}

.invoice-item-card__rate-display.is-editable:hover,
.invoice-item-card__rate-display.is-editable:focus-visible {
	border-color: color-mix(in srgb, var(--pos-primary, #2563eb) 40%, transparent);
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 8%, transparent);
	outline: none;
}

.invoice-item-card__rate-display.is-disabled {
	cursor: default;
	opacity: 0.88;
}

.invoice-item-card__rate-edit-icon {
	opacity: 0;
	color: var(--pos-primary, #2563eb);
	transition: opacity 120ms ease;
}

.invoice-item-card__rate-display.is-editable:hover .invoice-item-card__rate-edit-icon,
.invoice-item-card__rate-display.is-editable:focus-visible .invoice-item-card__rate-edit-icon {
	opacity: 1;
}

.invoice-item-card__rate-input {
	width: 100%;
	min-width: 0;
}

.invoice-item-card__rate-input :deep(.v-field) {
	min-height: 36px;
	border-radius: 8px;
}

.invoice-item-card__rate-input :deep(input) {
	text-align: center;
	font-variant-numeric: tabular-nums;
}

.invoice-item-card--stacked .invoice-item-card__rate-input {
	width: min(128px, 100%);
	justify-self: end;
}

.invoice-item-card--phone .invoice-item-card__rate {
	width: 100%;
	min-width: 0;
}

.invoice-item-card--phone .invoice-item-card__rate-display,
.invoice-item-card--phone .invoice-item-card__rate-input {
	width: 100%;
}

.invoice-item-card--phone .invoice-item-card__rate-display {
	justify-content: space-between;
	min-height: 34px;
	padding-inline: 0;
}

.invoice-item-card--phone .invoice-item-card__rate-input :deep(.v-field) {
	min-height: 44px;
}

.invoice-item-card__amount {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	font-weight: 750;
	color: var(--pos-primary, #2563eb);
}

.invoice-item-card__actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
}

.cart-item-actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 2px;
}

.cart-item-action {
	width: 36px !important;
	height: 36px !important;
	min-width: 36px !important;
	border-radius: 8px !important;
}

.details-action-btn:hover {
	color: var(--pos-primary, #3b82f6) !important;
}

.delete-action-btn:hover {
	color: var(--pos-error, #ef4444) !important;
	background: color-mix(in srgb, var(--pos-error, #ef4444) 10%, transparent) !important;
}
</style>
