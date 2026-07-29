<template>
	<v-dialog
		:model-value="modelValue"
		@update:model-value="$emit('update:modelValue', $event)"
		:fullscreen="useFullscreenDetails"
		:max-width="useFullscreenDetails ? undefined : '840px'"
		scrollable
		class="invoice-item-details-dialog"
	>
		<v-card class="pos-themed-card details-dialog-card" v-if="item">
			<v-card-title class="details-dialog__header d-flex align-center py-3 px-4">
				<div class="d-flex align-center gap-3 min-w-0">
					<div class="details-dialog__thumb">
						<v-img
							v-if="itemImage && !imageFailed"
							:src="itemImage"
							:alt="itemTitle"
							class="details-dialog__thumb-image"
							@error="imageFailed = true"
						/>
						<v-icon v-else color="primary" size="24">mdi-package-variant-closed</v-icon>
					</div>
					<div class="d-flex flex-column min-w-0">
						<span class="text-subtitle-1 font-weight-bold text-truncate line-height-1-2">
							{{ itemTitle }}
						</span>
						<span class="text-caption text-secondary text-truncate" v-if="item.item_code">
							{{ item.item_code }}
						</span>
					</div>
				</div>
				<v-spacer></v-spacer>
				<v-btn
					icon="mdi-close"
					variant="text"
					density="compact"
					:aria-label="__('Close item details')"
					@click="$emit('update:modelValue', false)"
				></v-btn>
			</v-card-title>
			<v-divider></v-divider>
			<v-card-text class="details-dialog__body pa-4">
				<div class="posa-item-details-form">
					<!-- Basic Information Section -->
					<div class="posa-form-section">
						<div class="posa-section-header mb-3">
							<v-icon size="small" class="section-icon mr-1">mdi-information-outline</v-icon>
							<span class="posa-section-title font-weight-bold">{{ __("Basic Information") }}</span>
						</div>
						<div class="posa-form-row">
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Item Code')"
									class="pos-themed-input"
									hide-details
									v-model="item.item_code"
									disabled
									prepend-inner-icon="mdi-barcode"
								></v-text-field>
							</div>
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('QTY')"
									class="pos-themed-input"
									hide-details
									:model-value="formatFloat(item.qty, hide_qty_decimals ? 0 : undefined)"
									@change="onQtyChange(item, $event)"
									:rules="[isNumber]"
									:disabled="!canEditQuantity"
									prepend-inner-icon="mdi-numeric"
								></v-text-field>
								<div v-if="item.max_qty !== undefined" class="text-caption mt-1">
									{{
										__("In stock: {0}", [
											formatFloat(item._base_actual_qty, hide_qty_decimals ? 0 : undefined),
										])
									}}
								</div>
							</div>
							<div class="posa-form-field">
								<v-select
									density="compact"
									class="pos-themed-input"
									:label="frappe._('UOM')"
									v-model="item.uom"
									:items="item.item_uoms"
									variant="outlined"
									item-title="uom"
									item-value="uom"
									hide-details
									@update:model-value="calcUom(item, $event)"
									:disabled="!canChangeU"
									prepend-inner-icon="mdi-weight"
								></v-select>
							</div>
						</div>
					</div>

					<!-- Pricing Section -->
					<div class="posa-form-section mt-4">
						<div class="posa-section-header mb-3">
							<v-icon size="small" class="section-icon mr-1">mdi-currency-usd</v-icon>
							<span class="posa-section-title font-weight-bold">{{ __("Pricing & Discounts") }}</span>
						</div>
						<div class="posa-form-row">
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									id="rate"
									:label="frappe._('Rate')"
									class="pos-themed-input"
									hide-details
									:model-value="formatCurrency(item.rate)"
									@change="[
										setFormatedCurrency(item, 'rate', null, false, $event),
										calcPrices(item, $event.target.value, $event),
									]"
									:disabled="!canEditR"
									prepend-inner-icon="mdi-currency-usd"
								></v-text-field>
							</div>
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									id="discount_percentage"
									:label="frappe._('Discount %')"
									class="pos-themed-input"
									hide-details
									:model-value="formatFloat(Math.abs(item.discount_percentage || 0))"
									@change="[
										setFormatedCurrency(item, 'discount_percentage', null, false, $event),
										calcPrices(item, $event.target.value, $event),
									]"
									:disabled="!canEditDisc"
									prepend-inner-icon="mdi-percent"
								></v-text-field>
							</div>
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									id="discount_amount"
									:label="frappe._('Discount Amount')"
									class="pos-themed-input"
									hide-details
									:model-value="formatCurrency(Math.abs(item.discount_amount || 0))"
									@change="[
										setFormatedCurrency(item, 'discount_amount', null, false, $event),
										calcPrices(item, $event.target.value, $event),
									]"
									:disabled="!canEditDisc"
									prepend-inner-icon="mdi-tag-minus"
								></v-text-field>
							</div>
						</div>
						<div class="posa-form-row mt-2">
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Price List Rate')"
									class="pos-themed-input"
									hide-details
									:model-value="formatCurrency(item.price_list_rate ?? 0)"
									:disabled="!canChangePLRate"
									readonly
									prepend-inner-icon="mdi-format-list-numbered"
								></v-text-field>
							</div>
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Total Amount')"
									class="pos-themed-input"
									hide-details
									:model-value="formatCurrency(lineAmount)"
									disabled
									prepend-inner-icon="mdi-calculator"
								></v-text-field>
							</div>
							<div class="posa-form-field" v-if="canChangePLRate">
								<v-btn
									size="small"
									color="primary"
									variant="outlined"
									class="change-price-btn"
									@click.stop="changePriceListRate(item)"
								>
									<v-icon size="small" class="mr-1">mdi-pencil</v-icon>
									{{ __("Change Price") }}
								</v-btn>
							</div>
							<div class="posa-form-field" v-if="canToggleOffer">
								<v-btn
									size="small"
									:color="item.posa_is_offer ? 'error' : 'success'"
									variant="tonal"
									class="offer-action-btn"
									@click.stop="$emit('toggle-offer', item)"
								>
									<v-icon size="small" class="mr-1">
										{{ item.posa_is_offer ? 'mdi-tag-remove' : 'mdi-tag-plus' }}
									</v-icon>
									{{ item.posa_is_offer ? __("Remove Offer") : __("Apply Offer") }}
								</v-btn>
							</div>
						</div>
					</div>

					<!-- Stock Information Section -->
					<div class="posa-form-section mt-4">
						<div class="posa-section-header mb-3">
							<v-icon size="small" class="section-icon mr-1">mdi-warehouse</v-icon>
							<span class="posa-section-title font-weight-bold">{{ __("Stock Information") }}</span>
						</div>
						<div class="posa-form-row">
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Available QTY')"
									class="pos-themed-input"
									hide-details
									:model-value="formatFloat(item._base_actual_qty)"
									disabled
									prepend-inner-icon="mdi-package-variant"
								></v-text-field>
							</div>
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Stock QTY')"
									class="pos-themed-input"
									hide-details
									:model-value="formatFloat(item.stock_qty)"
									disabled
									prepend-inner-icon="mdi-scale-balance"
								></v-text-field>
							</div>
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Stock UOM')"
									class="pos-themed-input"
									hide-details
									v-model="item.stock_uom"
									disabled
									prepend-inner-icon="mdi-weight-pound"
								></v-text-field>
							</div>
						</div>
						<div class="posa-form-row mt-2">
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Warehouse')"
									class="pos-themed-input"
									hide-details
									v-model="item.warehouse"
									disabled
									prepend-inner-icon="mdi-warehouse"
								></v-text-field>
							</div>
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Group')"
									class="pos-themed-input"
									hide-details
									v-model="item.item_group"
									disabled
									prepend-inner-icon="mdi-folder-outline"
								></v-text-field>
							</div>
							<div class="posa-form-field" v-if="item.posa_offer_applied">
								<v-checkbox
									density="compact"
									:label="frappe._('Offer Applied')"
									v-model="item.posa_offer_applied"
									readonly
									hide-details
									class="mt-1"
									color="success"
								></v-checkbox>
							</div>
						</div>
					</div>

					<!-- Serial Number Section -->
					<div class="posa-form-section mt-4" v-if="item.has_serial_no || item.serial_no">
						<div class="posa-section-header mb-3">
							<v-icon size="small" class="section-icon mr-1">mdi-barcode-scan</v-icon>
							<span class="posa-section-title font-weight-bold">{{ __("Serial Numbers") }}</span>
						</div>
						<div class="posa-form-row">
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Serial No QTY')"
									class="pos-themed-input"
									hide-details
									v-model="item.serial_no_selected_count"
									type="number"
									disabled
									prepend-inner-icon="mdi-counter"
								></v-text-field>
							</div>
						</div>
						<div class="posa-form-row mt-2">
							<div class="posa-form-field full-width">
								<v-autocomplete
									v-model="item.serial_no_selected"
									:items="getSerialOptions(item)"
									item-title="serial_no"
									item-value="serial_no"
									variant="outlined"
									density="compact"
									chips
									color="primary"
									class="pos-themed-input"
									:label="frappe._('Serial No')"
									multiple
									@update:model-value="setSerialNo(item)"
									prepend-inner-icon="mdi-barcode"
								></v-autocomplete>
							</div>
						</div>
					</div>

					<!-- Batch Number Section -->
					<div class="posa-form-section mt-4" v-if="item.has_batch_no || item.batch_no">
						<div class="posa-section-header mb-3">
							<v-icon size="small" class="section-icon mr-1">mdi-package-variant-closed</v-icon>
							<span class="posa-section-title font-weight-bold">{{ __("Batch Information") }}</span>
						</div>
						<div class="posa-form-row">
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Batch No. Available QTY')"
									class="pos-themed-input"
									hide-details
									:model-value="formatFloat(item.actual_batch_qty)"
									disabled
									prepend-inner-icon="mdi-package-variant"
								></v-text-field>
							</div>
							<div class="posa-form-field">
								<v-text-field
									density="compact"
									variant="outlined"
									color="primary"
									:label="frappe._('Batch No Expiry Date')"
									class="pos-themed-input"
									hide-details
									v-model="item.batch_no_expiry_date"
									disabled
									prepend-inner-icon="mdi-calendar-clock"
								></v-text-field>
							</div>
							<div class="posa-form-field">
								<v-autocomplete
									v-model="item.batch_no"
									:items="getBatchOptions(item)"
									item-title="batch_no"
									variant="outlined"
									density="compact"
									color="primary"
									class="pos-themed-input"
									:label="frappe._('Batch No')"
									@update:model-value="setBatchQty(item, $event)"
									hide-details
									prepend-inner-icon="mdi-package-variant-closed"
								>
									<template v-slot:item="{ props, item }">
										<v-list-item v-bind="props">
											<v-list-item-title>{{ getRaw(item).batch_no }}</v-list-item-title>
											<v-list-item-subtitle class="d-flex align-center">
												<span>{{
													`Available QTY ${
														getRaw(item).available_qty ?? getRaw(item).batch_qty
													} - Expiry Date ${getRaw(item).expiry_date}`
												}}</span>
												<v-chip
													v-if="getRaw(item).is_expired"
													color="error"
													size="x-small"
													variant="flat"
													class="ml-2"
												>
													{{ __("Expired") }}
												</v-chip>
											</v-list-item-subtitle>
										</v-list-item>
									</template>
								</v-autocomplete>
							</div>
						</div>
					</div>

					<!-- Delivery Date Section -->
					<div
						class="posa-form-section mt-4"
						v-if="capabilities.showDeliveryDate"
					>
						<div class="posa-section-header mb-3">
							<v-icon size="small" class="section-icon mr-1">mdi-calendar-check</v-icon>
							<span class="posa-section-title font-weight-bold">{{ __("Delivery Information") }}</span>
						</div>
						<div class="posa-form-row">
							<div class="posa-form-field">
								<VueDatePicker
									v-model="item.posa_delivery_date"
									model-type="format"
									format="dd-MM-yyyy"
									:min-date="new Date()"
									auto-apply
									@update:model-value="validateDueDate(item)"
								/>
							</div>
						</div>
					</div>

					<!-- Additional Notes Section -->
					<div
						class="posa-form-section mt-4"
						v-if="capabilities.showAdditionalNotes"
					>
						<div class="posa-section-header mb-3">
							<v-icon size="small" class="section-icon mr-1">mdi-note-text-outline</v-icon>
							<span class="posa-section-title font-weight-bold">{{ __("Additional Notes") }}</span>
						</div>
						<div class="posa-form-row">
							<div class="posa-form-field full-width">
								<v-textarea
									v-model="item.posa_notes"
									:label="frappe._('Additional Notes')"
									rows="2"
									auto-grow
									variant="outlined"
									density="compact"
									color="primary"
									class="pos-themed-input"
									hide-details
								/>
							</div>
						</div>
					</div>
				</div>
			</v-card-text>
			<v-divider></v-divider>
			<v-card-actions class="px-4 py-3">
				<v-spacer></v-spacer>
				<v-btn
					color="primary"
					variant="tonal"
					@click="$emit('update:modelValue', false)"
				>
					{{ __("Done") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getDisplayableBatchOptions } from "../../../composables/pos/shared/useBatchSerial";
import { useResponsive } from "../../../composables/core/useResponsive";
import { resolveItemImage } from "../../../utils/itemImage";
import {
	getItemUiCapabilities,
} from "../../../composables/pos/items/useItemPermissions";

interface Props {
	modelValue: boolean;
	item: any;
	catalogItem?: any;
	pos_profile: any;
	invoiceType?: string;
	isReturnInvoice?: boolean;
	invoice_doc?: any;
	hide_qty_decimals?: boolean;

	formatFloat: (_val: any, _precision?: number) => string;
	formatCurrency: (_val: any, _precision?: number) => string;
	currencySymbol: (_currency?: string) => string;
	isNumber: (_val: any) => boolean | string;

	setFormatedCurrency: (_item: any, _field: string, _value: any, _force?: boolean, _event?: any) => void;
	calcPrices: (_item: any, _value: any, _event?: any) => void;
	calcUom: (_item: any, _uom: string) => void;
	changePriceListRate: (_item: any) => void;
	getSerialOptions: (_item: any) => any[];
	setSerialNo: (_item: any) => void;
	setBatchQty: (_item: any, _event: any) => void;
	validateDueDate: (_item: any) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [val: boolean];
	"qty-change": [item: any, event: any];
	"toggle-offer": [item: any];
}>();

const { windowWidth } = useResponsive();
const useFullscreenDetails = computed(() => windowWidth.value <= 767);

const __ = (window as any).__ || ((s: string) => s);
const frappe = (window as any).frappe || { _: (s: string) => s };

const imageFailed = ref(false);
const itemTitle = computed(() => props.item?.item_name || props.item?.item_code || __("Item Details"));
const itemImage = computed(() => resolveItemImage(props.item, props.catalogItem));

watch(itemImage, () => {
	imageFailed.value = false;
});

const capabilities = computed(() =>
	getItemUiCapabilities(props.pos_profile, props.item, {
		isReturnInvoice: props.isReturnInvoice,
		invoiceType: props.invoiceType,
	}),
);

const canEditR = computed(() => capabilities.value.editRate);
const canEditDisc = computed(() => capabilities.value.editDiscount);
const canChangePLRate = computed(() => capabilities.value.changePriceListRate);
const canEditQuantity = computed(() => capabilities.value.editQty);
const canChangeU = computed(() => capabilities.value.changeUom);

const lineAmount = computed(() => {
	const amount = Number(props.item?.amount);
	if (Number.isFinite(amount)) return amount;
	return Number(props.item?.qty || 0) * Number(props.item?.rate || 0);
});

const canToggleOffer = computed(() => {
	if (props.isReturnInvoice) return false;
	return !props.item?.is_free_item && !props.item?.posa_is_replace;
});

const onQtyChange = (item: any, event: any) => {
	emit("qty-change", item, event);
};

const getRaw = (item: any) => item?.raw || {};
const getBatchOptions = (item: any) => getDisplayableBatchOptions(item?.batch_no_data);
</script>

<style scoped>
.details-dialog__thumb {
	width: 36px;
	height: 36px;
	flex: 0 0 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	border-radius: var(--pos-radius-sm, 6px);
	background: var(--pos-surface-muted, #f4f5f7);
}

.details-dialog__thumb-image :deep(.v-img__img) {
	object-fit: contain !important;
	object-position: center;
	padding: 2px;
}

.posa-form-row {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
	width: 100%;
}

.posa-form-field {
	width: 100%;
	min-width: 0 !important;
	max-width: 100% !important;
}

.posa-form-field :deep(.v-input),
.posa-form-field :deep(.v-field) {
	width: 100% !important;
	min-width: 0 !important;
}

.change-price-btn,
.offer-action-btn {
	width: 100% !important;
	height: 40px !important;
}

.line-height-1-2 {
	line-height: 1.2;
}

:deep(.v-overlay__content) {
	max-width: 720px !important;
	width: calc(100% - 24px) !important;
	margin: 12px auto !important;
}

@media (max-width: 600px) {
	.posa-form-row {
		grid-template-columns: 1fr;
		gap: 10px;
	}

	:deep(.v-overlay__content) {
		width: calc(100% - 16px) !important;
		margin: 8px auto !important;
	}

	.details-dialog__body {
		padding: 12px !important;
	}
}
</style>
