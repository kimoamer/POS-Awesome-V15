<template>
	<div class="purchase-items-container">
		<!-- Desktop / Tablet Table View (>= 768px) -->
		<div class="d-none d-md-block">
			<v-data-table
				:headers="headers"
				:items="items"
				item-key="line_id"
				class="elevation-1 border rounded pos-purchase-data-table"
				density="compact"
				hide-default-footer
				:items-per-page="-1"
			>
				<template v-slot:item.index="{ index }">
					<span class="text-caption font-weight-bold text-medium-emphasis"><bdi>{{ index + 1 }}</bdi></span>
				</template>

				<template v-slot:item.item_name="{ item }">
					<div class="py-1">
						<div class="font-weight-bold"><bdi>{{ item.item_name }}</bdi></div>
						<div class="text-caption text-medium-emphasis">
							<bdi>{{ item.item_code }}</bdi>
						</div>
					</div>
				</template>

				<template v-slot:item.uom="{ item }">
					<div class="pos-table__editor-box uom-editor" @click.stop>
						<v-btn
							size="x-small"
							variant="flat"
							class="pos-table__editor-btn uom-arrow"
							@click.stop="changeUom(item, -1)"
							:disabled="!item.item_uoms || item.item_uoms.length <= 1"
							:aria-label="__('Previous unit of measure')"
						>
							<v-icon size="small">mdi-chevron-left</v-icon>
						</v-btn>
						<v-select
							:model-value="item.uom"
							@update:model-value="(val) => $emit('update-uom', { item, value: val })"
							:items="item.item_uoms || [{ uom: item.stock_uom, conversion_factor: 1 }]"
							item-title="uom"
							item-value="uom"
							density="compact"
							variant="outlined"
							class="pos-table__editor-input uom-select"
							:class="{ 'uom-display-mode': !item._isEditingUom }"
							hide-details
							@focus="item._isEditingUom = true"
							@blur="item._isEditingUom = false"
						></v-select>
						<v-btn
							size="x-small"
							variant="flat"
							class="pos-table__editor-btn uom-arrow"
							@click.stop="changeUom(item, 1)"
							:disabled="!item.item_uoms || item.item_uoms.length <= 1"
							:aria-label="__('Next unit of measure')"
						>
							<v-icon size="small">mdi-chevron-right</v-icon>
						</v-btn>
					</div>
				</template>

				<template v-slot:item.qty="{ item }">
					<div class="pos-table__qty-counter">
						<v-btn
							size="small"
							variant="flat"
							class="pos-table__qty-btn minus-btn qty-control-btn"
							@click.stop="$emit('update-qty', { item, value: item.qty - 1 })"
							:aria-label="__('Decrease quantity')"
						>
							<v-icon size="small">mdi-minus</v-icon>
						</v-btn>
						<div
							v-if="!item._isEditingQty"
							class="pos-table__qty-display"
							@click.stop="openQtyEdit(item)"
						>
							<bdi>{{ formatNumber(item.qty) }}</bdi>
						</div>
						<v-text-field
							v-else
							v-model="item._editingQtyValue"
							density="compact"
							variant="outlined"
							class="pos-table__qty-input"
							@blur="closeQtyEdit(item)"
							@keydown.enter.prevent="closeQtyEdit(item)"
							@click.stop
							autofocus
							type="number"
							min="0"
						></v-text-field>
						<v-btn
							size="small"
							variant="flat"
							class="pos-table__qty-btn plus-btn qty-control-btn"
							@click.stop="$emit('update-qty', { item, value: item.qty + 1 })"
							:aria-label="__('Increase quantity')"
						>
							<v-icon size="small">mdi-plus</v-icon>
						</v-btn>
					</div>
				</template>

				<template v-slot:item.rate="{ item }">
					<div class="pos-table__editor-box">
						<div
							v-if="!item._isEditingRate"
							class="pos-table__editor-display"
							@click.stop="openRateEdit(item)"
						>
							<span class="currency-symbol"><bdi>{{ currencySymbol }}</bdi></span>
							<span class="amount-value"><bdi>{{ formatCurrency(item.rate) }}</bdi></span>
						</div>
						<v-text-field
							v-else
							v-model="item._editingRateValue"
							density="compact"
							variant="outlined"
							class="pos-table__editor-input"
							@blur="closeRateEdit(item)"
							@keydown.enter.prevent="closeRateEdit(item)"
							@click.stop
							autofocus
							type="number"
							min="0"
						></v-text-field>
					</div>
				</template>

				<template v-slot:item.received_qty="{ item }">
					<v-text-field
						v-if="receiveNow"
						density="compact"
						variant="outlined"
						hide-details
						type="number"
						min="0"
						:model-value="item.received_qty"
						@update:model-value="(val) => $emit('update-received-qty', { item, value: val })"
						class="pos-themed-input"
						style="width: 80px"
					></v-text-field>
				</template>

				<template v-slot:item.amount="{ item }">
					<div class="text-right font-weight-bold">
						<bdi>{{ currencySymbol }}</bdi> <bdi>{{ formatCurrency(item.qty * item.rate) }}</bdi>
					</div>
				</template>

				<template v-slot:item.actions="{ item }">
					<v-btn
						icon="mdi-delete-outline"
						variant="text"
						color="error"
						size="small"
						@click="$emit('remove-item', item)"
						:aria-label="__('Remove item')"
					></v-btn>
				</template>
			</v-data-table>
		</div>

		<!-- Mobile Card View (< 768px) -->
		<div class="d-md-none purchase-item-cards-list">
			<v-card
				v-for="item in items"
				:key="item.line_id || item.item_code"
				class="mb-3 pa-3 purchase-item-card border pos-themed-card"
				variant="outlined"
			>
				<div class="d-flex align-center justify-space-between mb-2">
					<div>
						<div class="font-weight-bold text-subtitle-2"><bdi>{{ item.item_name }}</bdi></div>
						<div class="text-caption text-medium-emphasis"><bdi>{{ item.item_code }}</bdi></div>
					</div>
					<v-btn
						icon="mdi-delete-outline"
						variant="text"
						color="error"
						size="small"
						@click="$emit('remove-item', item)"
						:aria-label="__('Remove item')"
					/>
				</div>

				<v-row dense class="align-center ga-2 mb-2">
					<!-- UOM Selector -->
					<v-col cols="6">
						<div class="text-caption text-muted mb-1">{{ __("UOM") }}</div>
						<v-select
							:model-value="item.uom"
							@update:model-value="(val) => $emit('update-uom', { item, value: val })"
							:items="item.item_uoms || [{ uom: item.stock_uom, conversion_factor: 1 }]"
							item-title="uom"
							item-value="uom"
							density="compact"
							variant="outlined"
							hide-details
							class="pos-themed-input"
						/>
					</v-col>

					<!-- Qty Stepper -->
					<v-col cols="6">
						<div class="text-caption text-muted mb-1">{{ __("Qty") }}</div>
						<div class="pos-table__qty-counter w-100">
							<v-btn
								size="small"
								variant="flat"
								class="pos-table__qty-btn minus-btn qty-control-btn"
								@click.stop="$emit('update-qty', { item, value: item.qty - 1 })"
							>
								<v-icon size="small">mdi-minus</v-icon>
							</v-btn>
							<div
								v-if="!item._isEditingQty"
								class="pos-table__qty-display"
								@click.stop="openQtyEdit(item)"
							>
								<bdi>{{ formatNumber(item.qty) }}</bdi>
							</div>
							<v-text-field
								v-else
								v-model="item._editingQtyValue"
								density="compact"
								variant="outlined"
								class="pos-table__qty-input"
								@blur="closeQtyEdit(item)"
								@keydown.enter.prevent="closeQtyEdit(item)"
								@click.stop
								autofocus
								type="number"
								min="0"
							></v-text-field>
							<v-btn
								size="small"
								variant="flat"
								class="pos-table__qty-btn plus-btn qty-control-btn"
								@click.stop="$emit('update-qty', { item, value: item.qty + 1 })"
							>
								<v-icon size="small">mdi-plus</v-icon>
							</v-btn>
						</div>
					</v-col>

					<!-- Rate Editor -->
					<v-col cols="6">
						<div class="text-caption text-muted mb-1">{{ __("Rate") }}</div>
						<div class="pos-table__editor-box w-100">
							<div
								v-if="!item._isEditingRate"
								class="pos-table__editor-display w-100"
								@click.stop="openRateEdit(item)"
							>
								<span class="currency-symbol"><bdi>{{ currencySymbol }}</bdi></span>
								<span class="amount-value"><bdi>{{ formatCurrency(item.rate) }}</bdi></span>
							</div>
							<v-text-field
								v-else
								v-model="item._editingRateValue"
								density="compact"
								variant="outlined"
								class="pos-table__editor-input"
								@blur="closeRateEdit(item)"
								@keydown.enter.prevent="closeRateEdit(item)"
								@click.stop
								autofocus
								type="number"
								min="0"
							></v-text-field>
						</div>
					</v-col>

					<!-- Received Qty (If Receive Now) -->
					<v-col cols="6" v-if="receiveNow">
						<div class="text-caption text-muted mb-1">{{ __("Received Qty") }}</div>
						<v-text-field
							density="compact"
							variant="outlined"
							hide-details
							type="number"
							min="0"
							:model-value="item.received_qty"
							@update:model-value="(val) => $emit('update-received-qty', { item, value: val })"
							class="pos-themed-input"
						></v-text-field>
					</v-col>
				</v-row>

				<v-divider class="my-2"></v-divider>

				<div class="d-flex align-center justify-space-between text-subtitle-2">
					<span class="text-muted">{{ __("Amount") }}</span>
					<strong class="text-primary">
						<bdi>{{ currencySymbol }}</bdi> <bdi>{{ formatCurrency(item.qty * item.rate) }}</bdi>
					</strong>
				</div>
			</v-card>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		headers: Array,
		items: Array,
		currencySymbol: String,
		receiveNow: Boolean,
		formatCurrency: Function,
		formatNumber: Function,
	},
	emits: ["update-uom", "update-qty", "update-rate", "update-received-qty", "remove-item"],
	methods: {
		changeUom(item, direction) {
			if (!item.item_uoms || item.item_uoms.length <= 1) return;
			const uoms = item.item_uoms.map((u) => u.uom);
			const currentIndex = uoms.indexOf(item.uom);
			let newIndex = currentIndex + direction;

			if (newIndex < 0) {
				newIndex = uoms.length - 1;
			} else if (newIndex >= uoms.length) {
				newIndex = 0;
			}

			const newUom = uoms[newIndex];
			if (newUom !== item.uom) {
				this.$emit("update-uom", { item, value: newUom });
			}
		},
		openQtyEdit(item) {
			item._isEditingQty = true;
			item._editingQtyValue = "";
		},
		closeQtyEdit(item) {
			if (item._isEditingQty) {
				if (item._editingQtyValue !== "" && item._editingQtyValue != null) {
					const val = parseFloat(item._editingQtyValue);
					if (!isNaN(val) && val >= 0) {
						this.$emit("update-qty", { item, value: val });
					}
				}
				item._isEditingQty = false;
			}
		},
		openRateEdit(item) {
			item._isEditingRate = true;
			item._editingRateValue = "";
		},
		closeRateEdit(item) {
			if (item._isEditingRate) {
				if (item._editingRateValue !== "" && item._editingRateValue != null) {
					const val = parseFloat(item._editingRateValue);
					if (!isNaN(val) && val >= 0) {
						this.$emit("update-rate", { item, value: val });
					}
				}
				item._isEditingRate = false;
			}
		},
	},
};
</script>

<style scoped>
.purchase-items-container {
	width: 100%;
}

.purchase-item-card {
	border-radius: 10px !important;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.pos-table__qty-counter {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	padding: 2px;
	min-width: 60px;
	height: 36px;
	background: var(--pos-surface-variant, #f8fafc);
	border-radius: 8px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	transition: all 0.3s ease;
	margin: 0 auto;
	box-sizing: border-box;
}

.pos-table__qty-display {
	flex: 1 1 auto;
	text-align: center;
	font-weight: 700;
	padding: 0 4px;
	border-radius: 4px;
	background: var(--pos-primary-container, #e0f2fe);
	border: 1px solid var(--pos-primary-variant, #bae6fd);
	color: var(--pos-primary, #0284c7);
	font-size: 0.85rem;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 28px;
	cursor: pointer;
}

.qty-control-btn {
	width: 28px !important;
	height: 28px !important;
	min-width: 28px !important;
	border-radius: 6px !important;
	font-weight: 700 !important;
	flex-shrink: 0;
}

.qty-control-btn.minus-btn {
	background: var(--pos-button-warning-bg, #fee2e2) !important;
	color: var(--pos-button-warning-text, #dc2626) !important;
}

.qty-control-btn.plus-btn {
	background: var(--pos-button-success-bg, #dcfce7) !important;
	color: var(--pos-button-success-text, #16a34a) !important;
}

.pos-table__qty-input {
	max-width: 90px;
	margin: 0 auto;
}

.pos-table__editor-box {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 2px;
	padding: 2px;
	min-width: 60px;
	height: 36px;
	background: var(--pos-surface-variant, #f8fafc);
	border-radius: 8px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	margin: 0 auto;
}

.pos-table__editor-display {
	flex: 1 1 auto;
	text-align: center;
	font-weight: 700;
	padding: 0 4px;
	border-radius: 4px;
	background: var(--pos-primary-container, #e0f2fe);
	border: 1px solid var(--pos-primary-variant, #bae6fd);
	color: var(--pos-primary, #0284c7);
	font-size: 0.85rem;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 28px;
	cursor: pointer;
}

.pos-table__editor-btn {
	width: 28px !important;
	height: 28px !important;
	min-width: 28px !important;
	border-radius: 6px !important;
}

.uom-editor {
	gap: 2px;
}

.uom-arrow {
	flex-shrink: 0;
}

.uom-select {
	min-width: 40px;
}

.uom-display-mode :deep(.v-field__outline) {
	display: none;
}

.uom-display-mode :deep(.v-field) {
	background-color: transparent !important;
	border: none !important;
	box-shadow: none !important;
}

.uom-display-mode :deep(.v-field__input) {
	justify-content: center;
	padding: 0;
	font-weight: 600;
	color: var(--pos-primary);
}

.uom-display-mode :deep(.v-select__selection-text) {
	text-align: center;
	color: var(--pos-primary);
	font-size: 0.75rem;
	white-space: nowrap;
}

.uom-display-mode :deep(.v-field__append-inner) {
	display: none;
}

.currency-symbol {
	opacity: 0.75;
	margin-inline-end: 2px;
	font-size: 0.85em;
}
</style>
