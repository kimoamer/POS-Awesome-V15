<template>
	<tr class="posa-cart-item-row" v-memo="memoDeps">
		<template v-for="column in visibleColumns" :key="column.key">
			<!-- Item Name Column -->
			<td v-if="column.key === 'item_name'" class="text-start" :data-column-key="'item_name'">
				<div class="cart-item-identity">
					<div class="cart-item-thumb" aria-hidden="true">
						<v-img
							v-if="itemImage && !imageFailed"
							:src="itemImage"
							:alt="itemTitle"
							class="cart-item-thumb__image"
							@error="imageFailed = true"
						/>
						<v-icon v-else size="20" class="cart-item-thumb__icon">
							mdi-package-variant-closed
						</v-icon>
					</div>
					<div class="cart-item-copy">
						<div class="cart-item-title-row">
							<span class="cart-item-title" :title="itemTitle">{{ itemTitle }}</span>
							<div class="cart-item-badges">
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
									{{ __("Offer Item") }}
								</v-chip>
								<v-tooltip v-if="item.pricing_rule_badge" location="bottom">
									<template #activator="{ props }">
										<v-chip
											v-bind="props"
											color="primary"
											size="x-small"
											class="cart-item-badge"
										>
											{{ item.pricing_rule_badge.label }}
										</v-chip>
									</template>
									<span>{{ item.pricing_rule_badge.tooltip }}</span>
								</v-tooltip>
							</div>
						</div>
						<div class="cart-item-meta-row">
							<span class="cart-item-meta" :title="itemMetaTitle">{{ itemMetaTitle }}</span>
							<div class="cart-item-name-actions">
								<v-btn
									v-if="canOverrideName"
									icon
									size="x-small"
									variant="text"
									class="cart-item-name-action"
									@click.stop="$emit('open-name-dialog', item)"
									:aria-label="__('Edit item name')"
								>
									<v-icon size="small">mdi-pencil-outline</v-icon>
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
									<v-icon size="small">mdi-undo</v-icon>
								</v-btn>
							</div>
						</div>
					</div>
				</div>
			</td>

			<!-- Quantity Column -->
			<td v-else-if="column.key === 'qty'" class="text-center" :data-column-key="'qty'">
				<div class="posa-cart-table__qty-counter" :class="{ 'rtl-layout': isRTL }">
					<v-btn
						:disabled="disableDecrement"
						size="small"
						variant="flat"
						class="posa-cart-table__qty-btn posa-cart-table__qty-btn--minus minus-btn qty-control-btn"
						@click.stop="handleMinusClick"
						:aria-label="__('Decrease quantity')"
					>
						<v-icon size="small">mdi-minus</v-icon>
					</v-btn>
					<div
						v-if="!isEditingQty"
						class="posa-cart-table__qty-display amount-value number-field-rtl"
						:class="{
							'negative-number': isNegative(item.qty),
							disabled: disableInput,
						}"
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
						@keydown.enter.prevent="submitQtyEdit"
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
						class="posa-cart-table__qty-btn posa-cart-table__qty-btn--plus plus-btn qty-control-btn"
						@click.stop="$emit('add-one', item)"
						:aria-label="__('Increase quantity')"
					>
						<v-icon size="small">mdi-plus</v-icon>
					</v-btn>
				</div>
			</td>

			<!-- UOM Column (Optional) -->
			<td v-else-if="column.key === 'uom'" class="text-center" :data-column-key="'uom'">
				<div class="posa-cart-table__editor-box">
					<div
						v-if="!isEditingUom"
						class="posa-cart-table__editor-display"
						:class="{ disabled: disableUomEdit }"
						@click.stop="openUomEdit"
						tabindex="0"
						data-pos-keyboard-target="cart-uom"
						role="button"
						:aria-label="__('Edit UOM')"
						@keydown.enter.prevent="openUomEdit"
						@keydown.space.prevent="openUomEdit"
					>
						{{ item.uom }}
					</div>
					<v-select
						v-else
						:model-value="item.uom"
						:items="item.item_uoms || [item.uom]"
						item-title="uom"
						item-value="uom"
						density="compact"
						variant="outlined"
						class="posa-cart-table__editor-input"
						@update:model-value="submitUomEdit"
						@blur="closeUomEdit"
						@keydown.esc.prevent="cancelUomEdit"
						@click.stop
						ref="uomSelect"
						:disabled="disableUomEdit"
					></v-select>
				</div>
			</td>

			<!-- Price List Rate (Optional) -->
			<td
				v-else-if="column.key === 'price_list_rate'"
				class="text-center"
				:data-column-key="'price_list_rate'"
			>
				<bdi class="cart-item-money">
					<span class="currency-symbol">{{ currencySymbol(displayCurrency) }}</span>
					<span
						class="amount-value"
						:class="{ 'negative-number': isNegative(item.price_list_rate) }"
					>
						{{ formatCurrency(item.price_list_rate) }}
					</span>
				</bdi>
			</td>

			<!-- Discount % (Optional) -->
			<td
				v-else-if="column.key === 'discount_percentage'"
				class="text-center"
				:data-column-key="'discount_percentage'"
			>
				<div class="posa-cart-table__editor-box">
					<div
						v-if="!isEditingDiscountPercent"
						class="posa-cart-table__editor-display"
						:class="{ disabled: disableDiscountEdit }"
						@click.stop="openDiscountPercentEdit"
						tabindex="0"
						data-pos-keyboard-target="cart-discount-percent"
						role="button"
						:aria-label="__('Edit discount percentage')"
						@keydown.enter.prevent="openDiscountPercentEdit"
						@keydown.space.prevent="openDiscountPercentEdit"
					>
						<span class="amount-value">
							{{
								formatFloat(
									Math.abs(
										item.discount_percentage ||
											(item.price_list_rate
												? (item.discount_amount / item.price_list_rate) * 100
												: 0),
									),
								)
							}}%
						</span>
					</div>
					<v-text-field
						v-else
						v-model="editingDiscountPercentValue"
						density="compact"
						variant="outlined"
						class="posa-cart-table__editor-input"
						@blur="closeDiscountPercentEdit"
						@keydown.enter.prevent="submitDiscountPercentEdit"
						@keydown.esc.prevent="cancelDiscountPercentEdit"
						@click.stop
						ref="discountPercentInput"
						:autofocus="true"
						type="number"
						:disabled="disableDiscountEdit"
					></v-text-field>
				</div>
			</td>

			<!-- Discount Amount (Optional) -->
			<td
				v-else-if="column.key === 'discount_amount'"
				class="text-center"
				:data-column-key="'discount_amount'"
			>
				<div class="posa-cart-table__editor-box">
					<div
						v-if="!isEditingDiscountAmount"
						class="posa-cart-table__editor-display"
						:class="{ disabled: disableDiscountEdit }"
						@click.stop="openDiscountAmountEdit"
						tabindex="0"
						data-pos-keyboard-target="cart-discount-amount"
						role="button"
						:aria-label="__('Edit discount amount')"
						@keydown.enter.prevent="openDiscountAmountEdit"
						@keydown.space.prevent="openDiscountAmountEdit"
					>
						<bdi class="cart-item-money">
							<span class="currency-symbol">{{ currencySymbol(displayCurrency) }}</span>
							<span class="amount-value">{{
								formatCurrency(Math.abs(item.discount_amount || 0))
							}}</span>
						</bdi>
					</div>
					<v-text-field
						v-else
						v-model="editingDiscountAmountValue"
						density="compact"
						variant="outlined"
						class="posa-cart-table__editor-input"
						@blur="closeDiscountAmountEdit"
						@keydown.enter.prevent="closeDiscountAmountEdit"
						@keydown.esc.prevent="cancelDiscountAmountEdit"
						@click.stop
						ref="discountAmountInput"
						:autofocus="true"
						type="number"
						:disabled="disableDiscountEdit"
					></v-text-field>
				</div>
			</td>

			<!-- Rate Column -->
			<td v-else-if="column.key === 'rate'" class="text-center" :data-column-key="'rate'">
				<div class="posa-cart-table__editor-box">
					<div
						v-if="!isEditingRate"
						class="posa-cart-table__editor-display"
						:class="{ disabled: disableRateEdit }"
						@click.stop="openRateEdit"
						tabindex="0"
						data-pos-keyboard-target="cart-rate"
						role="button"
						:aria-label="__('Edit rate')"
						@keydown.enter.prevent="openRateEdit"
						@keydown.space.prevent="openRateEdit"
					>
						<bdi class="cart-item-money cart-item-rate">
							<span class="cart-rate-label">{{ __("Rate") }}</span>
							<span class="currency-symbol">{{ currencySymbol(displayCurrency) }}</span>
							<span class="amount-value" :class="{ 'negative-number': isNegative(item.rate) }">
								{{ formatCurrency(item.rate) }}
							</span>
						</bdi>
					</div>
					<v-text-field
						v-else
						v-model="editingRateValue"
						density="compact"
						variant="outlined"
						class="posa-cart-table__editor-input"
						@blur="closeRateEdit"
						@keydown.enter.prevent="closeRateEdit"
						@keydown.esc.prevent="cancelRateEdit"
						@click.stop
						ref="rateInput"
						:autofocus="true"
						type="number"
						:disabled="disableRateEdit"
					></v-text-field>
				</div>
			</td>

			<!-- Amount Column -->
			<td v-else-if="column.key === 'amount'" class="text-center" :data-column-key="'amount'">
				<bdi class="cart-item-money cart-item-amount right-aligned">
					<span class="currency-symbol">{{ currencySymbol(displayCurrency) }}</span>
					<span
						class="amount-value"
						:class="{ 'negative-number': isNegative(item.qty * item.rate) }"
					>
						{{ formatCurrency(item.qty * item.rate) }}
					</span>
				</bdi>
			</td>

			<!-- Offer Toggle (Optional) -->
			<td
				v-else-if="column.key === 'posa_is_offer'"
				class="text-center"
				:data-column-key="'posa_is_offer'"
			>
				<v-btn
					size="x-small"
					color="primary"
					variant="tonal"
					class="ma-0 pa-0"
					@click.stop="$emit('toggle-offer', item)"
				>
					{{ item.posa_offer_applied ? __("Remove Offer") : __("Apply Offer") }}
				</v-btn>
			</td>

			<!-- Actions Column (Delete + Expand cluster) -->
			<td v-else-if="column.key === 'actions'" class="text-center" :data-column-key="'actions'">
				<div class="cart-item-actions">
					<v-btn
						:disabled="!canRemove"
						size="small"
						variant="text"
						class="cart-item-action delete-action-btn"
						@click.stop="$emit('remove-item', item)"
						:aria-label="__('Remove item')"
					>
						<v-icon size="small">mdi-delete-outline</v-icon>
					</v-btn>
					<v-btn
						icon
						size="small"
						variant="text"
						class="cart-item-action expand-action-btn"
						@click.stop="$emit('toggle-expand')"
						:aria-label="isExpanded ? __('Collapse item details') : __('Expand item details')"
					>
						<v-icon size="small">
							{{ isExpanded ? "mdi-chevron-up" : "mdi-chevron-down" }}
						</v-icon>
					</v-btn>
				</div>
			</td>

			<!-- Fallback for standalone expand column -->
			<td
				v-else-if="column.key === 'data-table-expand'"
				class="text-center"
				:data-column-key="'data-table-expand'"
			>
				<v-btn
					icon
					size="small"
					variant="text"
					class="cart-item-action expand-action-btn"
					@click.stop="$emit('toggle-expand')"
					:aria-label="isExpanded ? __('Collapse item details') : __('Expand item details')"
				>
					<v-icon size="small">
						{{ isExpanded ? "mdi-chevron-up" : "mdi-chevron-down" }}
					</v-icon>
				</v-btn>
			</td>
		</template>
	</tr>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { resolveItemImage } from "../../../utils/itemImage";
import {
	canChangeUom,
	canEditItemDiscount,
	canEditQty,
	canEditRate,
	canOverrideItemName,
	canRemoveItem,
} from "../../../composables/pos/items/useItemPermissions";

defineOptions({
	name: "CartItemRow",
});

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	catalogItem: Object,
	visibleColumns: {
		type: Array,
		default: () => [],
	},
	posProfile: {
		type: Object,
		default: () => ({}),
	},
	isReturnInvoice: Boolean,
	invoiceType: String,
	displayCurrency: String,
	formatFloat: Function,
	formatCurrency: Function,
	currencySymbol: Function,
	isNumber: Function,
	isNegative: Function,
	hideQtyDecimals: Boolean,
	isRTL: Boolean,
	isExpanded: Boolean,
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
	"qty-edit-submitted",
	"discount-percent-edit-submitted",
	"toggle-offer",
	"toggle-expand",
	"remove-item",
]);

const __ = window.__ || ((text) => text);

const isEditingQty = ref(false);
const editingQtyValue = ref("");
const isEditingUom = ref(false);
const isEditingRate = ref(false);
const editingRateValue = ref("");
const isEditingDiscountPercent = ref(false);
const editingDiscountPercentValue = ref("");
const isEditingDiscountAmount = ref(false);
const editingDiscountAmountValue = ref("");
const imageFailed = ref(false);

const qtyInput = ref(null);
const rateInput = ref(null);
const discountPercentInput = ref(null);
const discountAmountInput = ref(null);
const uomSelect = ref(null);

const memoDeps = computed(() => {
	return [
		props.item.qty,
		props.item.rate,
		props.item.amount,
		props.item.discount_amount,
		props.item.discount_percentage,
		props.item.uom,
		props.item.item_code,
		props.item.item_name,
		props.item.image,
		props.item.item_image,
		props.item.thumbnail,
		props.item.item_image_url,
		props.item.name_overridden,
		props.item.pricing_rule_badge,
		props.item.batch_no_is_expired,
		props.item.batch_no,
		props.item.posa_is_offer,
		props.item.posa_offer_applied,
		props.item.is_free_item,
		props.item.price_list_rate,
		props.isExpanded,
		props.visibleColumns.map((column) => column?.key).join("|"),
		// Include edit states to ensure UI updates when switching modes
		isEditingQty.value,
		isEditingRate.value,
		isEditingUom.value,
		isEditingDiscountPercent.value,
		isEditingDiscountAmount.value,
	];
});

const qtyLength = computed(() => String(Math.abs(props.item.qty || 0)).replace(".", "").length);

const itemTitle = computed(() => props.item.item_name || props.item.item_code || __("Unnamed item"));

const itemImage = computed(() => resolveItemImage(props.item, props.catalogItem));

watch(itemImage, () => {
	imageFailed.value = false;
});

const itemMetaParts = computed(() => {
	const parts = [];
	const code = props.item.item_code;
	if (code && code !== props.item.item_name) {
		parts.push(code);
	}
	if (props.item.uom) {
		parts.push(props.item.uom);
	}
	return parts;
});

const itemMetaTitle = computed(() => itemMetaParts.value.join(" · ") || props.item.uom || "");

const canOverrideName = computed(() => canOverrideItemName(props.posProfile, props.item));
const canEditQuantity = computed(() => canEditQty(props.item, props.isReturnInvoice));
const canEditR = computed(() => canEditRate(props.posProfile, props.item, props.isReturnInvoice));
const canEditDisc = computed(() => canEditItemDiscount(props.posProfile, props.item, props.isReturnInvoice));
const canChangeU = computed(() => canChangeUom(props.item, props.isReturnInvoice));
const canRemove = computed(() => canRemoveItem(props.item));

const disableDecrement = computed(() => !canEditQuantity.value);
const disableIncrement = computed(() => !canEditQuantity.value || !!props.item.disable_increment);
const disableInput = computed(() => !canEditQuantity.value);
const disableUomEdit = computed(() => !canChangeU.value);
const disableRateEdit = computed(() => !canEditR.value);
const disableDiscountEdit = computed(() => !canEditDisc.value);

function openQtyEdit() {
	if (disableInput.value) return;
	isEditingQty.value = true;
	editingQtyValue.value = "";
	nextTick(() => {
		qtyInput.value?.focus();
	});
}

function openUomEdit() {
	if (disableUomEdit.value) return;
	isEditingUom.value = true;
	nextTick(() => {
		const target = uomSelect.value?.$el?.querySelector?.("input") || uomSelect.value;
		target?.focus?.();
	});
}

function closeQtyEdit(options = {}) {
	if (isEditingQty.value) {
		let didUpdate = false;
		if (editingQtyValue.value !== "" && editingQtyValue.value != null) {
			const newQty = parseFloat(editingQtyValue.value);
			// Emit event to update parent state
			const val = !newQty || newQty <= 0 ? 1 : newQty;
			emit("update-qty", props.item, val);
			didUpdate = true;
		}
		isEditingQty.value = false;
		editingQtyValue.value = "";
		if (didUpdate && options?.focusDiscountPercent) {
			emit("qty-edit-submitted", props.item);
		}
	}
}

function cancelQtyEdit() {
	isEditingQty.value = false;
	editingQtyValue.value = "";
}

function handleMinusClick() {
	emit("minus-click", props.item);
}

function changeUom(direction) {
	if (disableUomEdit.value) return;
	const uoms = props.item.item_uoms.map((u) => u.uom);
	const currentIndex = uoms.indexOf(props.item.uom);
	let newIndex = currentIndex + direction;

	if (newIndex < 0) {
		newIndex = uoms.length - 1;
	} else if (newIndex >= uoms.length) {
		newIndex = 0;
	}

	const newUom = uoms[newIndex];
	if (newUom !== props.item.uom) {
		emit("calc-uom", props.item, newUom);
	}
}

function handleUomSelect(newUom) {
	if (disableUomEdit.value) return;
	if (newUom && newUom !== props.item.uom) {
		emit("calc-uom", props.item, newUom);
	}
	// Find the correct component instance to blur - ref is local now
	uomSelect.value?.blur();
}

function openRateEdit() {
	if (disableRateEdit.value) return;
	isEditingRate.value = true;
	editingRateValue.value = "";
	nextTick(() => {
		rateInput.value?.focus();
	});
}

function closeRateEdit() {
	if (isEditingRate.value) {
		if (editingRateValue.value !== "" && editingRateValue.value != null) {
			const newRate = parseFloat(editingRateValue.value);
			if (Number.isFinite(newRate) && newRate !== props.item.rate) {
				// We need to pass the "event-like" object that useDiscounts expects or handle it in parent
				// For isolation, let's emit value and let parent handler construct event if needed
				// But ItemsTable methods expect (item, value, event)
				emit("update-rate", props.item, newRate);
			}
		}
		isEditingRate.value = false;
		editingRateValue.value = "";
	}
}

function cancelRateEdit() {
	isEditingRate.value = false;
	editingRateValue.value = "";
}

function openDiscountPercentEdit() {
	if (disableDiscountEdit.value) return;
	isEditingDiscountPercent.value = true;
	editingDiscountPercentValue.value = "";
	nextTick(() => {
		discountPercentInput.value?.focus();
	});
}

function closeDiscountPercentEdit() {
	if (isEditingDiscountPercent.value) {
		if (editingDiscountPercentValue.value !== "" && editingDiscountPercentValue.value != null) {
			const newDiscount = parseFloat(editingDiscountPercentValue.value);
			if (Number.isFinite(newDiscount) && newDiscount !== props.item.discount_percentage) {
				emit("update-discount-percent", props.item, newDiscount);
			}
		}
		isEditingDiscountPercent.value = false;
		editingDiscountPercentValue.value = "";
	}
}

function submitDiscountPercentEdit() {
	closeDiscountPercentEdit();
	emit("discount-percent-edit-submitted", props.item);
}

function cancelDiscountPercentEdit() {
	isEditingDiscountPercent.value = false;
	editingDiscountPercentValue.value = "";
}

function openDiscountAmountEdit() {
	if (disableDiscountEdit.value) return;
	isEditingDiscountAmount.value = true;
	editingDiscountAmountValue.value = "";
	nextTick(() => {
		discountAmountInput.value?.focus();
	});
}

function closeDiscountAmountEdit() {
	if (isEditingDiscountAmount.value) {
		if (editingDiscountAmountValue.value !== "" && editingDiscountAmountValue.value != null) {
			const newDiscount = parseFloat(editingDiscountAmountValue.value);
			if (Number.isFinite(newDiscount) && newDiscount !== props.item.discount_amount) {
				emit("update-discount-amount", props.item, newDiscount);
			}
		}
		isEditingDiscountAmount.value = false;
		editingDiscountAmountValue.value = "";
	}
}

function cancelDiscountAmountEdit() {
	isEditingDiscountAmount.value = false;
	editingDiscountAmountValue.value = "";
}
</script>

<style scoped>
/* Local styles specific to the row only */
.currency-display {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 2px;
	width: 100%;
	height: 100%;
	padding: 0;
	margin: 0;
	min-width: 0;
	overflow: hidden;
	white-space: nowrap;
}

.currency-display.right-aligned {
	justify-content: center;
}

.amount-value {
	font-weight: 720;
	text-align: center;
	font-family:
		"SF Pro Display", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans Arabic", "Tahoma",
		sans-serif;
	font-variant-numeric: lining-nums tabular-nums;
	font-feature-settings:
		"tnum" 1,
		"lnum" 1,
		"kern" 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.amount-value.right-aligned {
	text-align: center;
}

.currency-symbol {
	opacity: 0.7;
	margin-inline-end: 2px;
	font-size: 0.78em;
	flex: 0 0 auto;
}

.negative-number {
	color: var(--pos-error) !important;
	font-weight: 600;
}

td {
	padding: 0;
	vertical-align: middle;
	height: var(--cart-table-row-height, 60px);
	text-align: center;
	color: var(--pos-text-primary);
	position: relative;
	min-width: 0;
	overflow: hidden;
}

.posa-cart-table__delete-btn,
.posa-cart-table__expand-btn {
	inline-size: 44px !important;
	block-size: 44px !important;
	min-inline-size: 44px !important;
	border-radius: 10px !important;
	box-shadow: none !important;
}

.posa-cart-table__delete-btn {
	color: var(--pos-error) !important;
	background: transparent !important;
}

.posa-cart-table__delete-btn:hover {
	background: color-mix(in srgb, var(--pos-error) 9%, transparent) !important;
}

.posa-cart-table__expand-btn {
	color: var(--pos-text-secondary) !important;
}

/* Keyboard focus styles */
/* Keyboard focus styles */
.posa-cart-table__qty-display:focus-visible,
.posa-cart-table__editor-display:focus-visible,
.posa-cart-table__delete-btn:focus-visible,
.posa-cart-table__expand-btn:focus-visible,
.cart-item-name-action:focus-visible {
	outline: 2px solid var(--pos-primary);
	outline-offset: 2px;
	z-index: 10;
}
</style>
