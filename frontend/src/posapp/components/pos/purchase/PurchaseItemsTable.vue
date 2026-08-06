<template>
	<div class="purchase-items-list">
		<div
			v-for="item in items"
			:key="item.line_id || item.item_code"
			class="purchase-item-card"
		>
			<!-- Top Main Info Row: Image, Name/SKU, Amount, Remove Button -->
			<div class="purchase-item-main">
				<!-- Image -->
				<div class="purchase-item-image">
					<v-avatar size="36" rounded="md" color="grey-lighten-4" class="border flex-shrink-0">
						<v-img v-if="item.image" :src="item.image" cover />
						<v-icon v-else icon="mdi-package-variant-closed" color="medium-emphasis" size="20" />
					</v-avatar>
				</div>

				<!-- Identity: Name & SKU -->
				<div class="purchase-item-identity">
					<div class="purchase-item-name font-weight-bold text-subtitle-2 text-truncate" :title="item.item_name">
						<bdi>{{ item.item_name }}</bdi>
					</div>
					<div class="purchase-item-code text-caption text-medium-emphasis">
						SKU: <bdi>{{ item.item_code }}</bdi>
					</div>
				</div>

				<!-- Amount -->
				<div class="purchase-item-amount">
					<span class="text-caption text-medium-emphasis d-block">{{ __("Amount") }}</span>
					<strong class="text-subtitle-1 font-weight-bold text-primary">
						<bdi>{{ currencySymbol }}</bdi> <bdi>{{ formatCurrency(item.qty * item.rate) }}</bdi>
					</strong>
				</div>

				<!-- Remove Action -->
				<v-btn
					icon="mdi-delete-outline"
					variant="text"
					color="error"
					size="small"
					class="purchase-item-remove"
					:title="__('Remove item')"
					:aria-label="__('Remove item')"
					@click="$emit('remove-item', item)"
				></v-btn>
			</div>

			<!-- Bottom Controls Row: UOM, Quantity Stepper, Rate, Received Qty -->
			<div class="purchase-item-controls" :class="{ 'has-received': receiveNow }">
				<!-- UOM Dropdown -->
				<div class="purchase-item-control">
					<label class="purchase-control-label">{{ __("UOM") }}</label>
					<v-select
						:model-value="item.uom"
						@update:model-value="(val) => $emit('update-uom', { item, value: val })"
						:items="item.item_uoms || [{ uom: item.stock_uom, conversion_factor: 1 }]"
						item-title="uom"
						item-value="uom"
						density="compact"
						variant="outlined"
						hide-details
						class="purchase-item-uom"
					/>
				</div>

				<!-- Qty Control with Up/Down Vertical Arrows -->
				<div class="purchase-item-control">
					<label class="purchase-control-label">{{ __("Quantity") }}</label>
					<div class="purchase-qty-control">
						<input
							class="purchase-qty-control__input"
							type="number"
							min="0"
							step="any"
							:value="item.qty"
							@change="$emit('update-qty', { item, value: Number($event.target.value) })"
						/>
						<div class="purchase-qty-control__buttons">
							<button
								type="button"
								class="purchase-qty-control__btn purchase-qty-control__btn--up"
								:aria-label="__('Increase quantity')"
								@click="$emit('update-qty', { item, value: (Number(item.qty) || 0) + 1 })"
							>
								▲
							</button>
							<button
								type="button"
								class="purchase-qty-control__btn purchase-qty-control__btn--down"
								:aria-label="__('Decrease quantity')"
								@click="$emit('update-qty', { item, value: Math.max(0, (Number(item.qty) || 0) - 1) })"
							>
								▼
							</button>
						</div>
					</div>
				</div>

				<!-- Rate Field -->
				<div class="purchase-item-control">
					<label class="purchase-control-label">{{ __("Rate") }}</label>
					<v-text-field
						:model-value="item.rate"
						@update:model-value="(val) => $emit('update-rate', { item, value: Number(val) })"
						type="number"
						min="0"
						step="any"
						density="compact"
						variant="outlined"
						hide-details
						class="pos-themed-input"
					/>
				</div>

				<!-- Received Qty (If Receive Now enabled) -->
				<div v-if="receiveNow" class="purchase-item-control">
					<label class="purchase-control-label">{{ __("Received Qty") }}</label>
					<v-text-field
						:model-value="item.received_qty"
						@update:model-value="(val) => $emit('update-received-qty', { item, value: Number(val) })"
						type="number"
						min="0"
						step="any"
						density="compact"
						variant="outlined"
						hide-details
						class="pos-themed-input"
					/>
				</div>
			</div>
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
};
</script>

<style scoped>
.purchase-items-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: 100%;
}

.purchase-item-card {
	padding: 8px 10px;
	border: 1px solid #e2e8ee;
	border-radius: 10px;
	background: #ffffff;
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.purchase-item-card:hover {
	border-color: #9ddde3;
	box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.purchase-item-main {
	display: grid;
	grid-template-columns: 36px minmax(120px, 1fr) auto 32px;
	gap: 8px;
	align-items: center;
}

.purchase-item-identity {
	min-width: 0;
}

.purchase-item-name {
	font-size: 13px;
	font-weight: 700;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.2;
}

.purchase-item-code {
	font-size: 11px;
}

.purchase-item-amount {
	min-width: 90px;
	text-align: end;
}

.purchase-item-amount span {
	font-size: 10px;
	line-height: 1;
}

.purchase-item-amount strong {
	font-size: 14px;
}

.purchase-item-remove {
	color: #ef5350 !important;
}

.purchase-item-remove:hover {
	background: #fff1f1 !important;
}

.purchase-item-controls {
	display: grid;
	grid-template-columns: minmax(100px, 1fr) minmax(100px, 1.1fr) minmax(80px, 0.9fr);
	gap: 8px;
	margin-top: 6px;
}

.purchase-item-controls.has-received {
	grid-template-columns: minmax(90px, 1fr) minmax(95px, 1.1fr) minmax(75px, 0.8fr) minmax(75px, 0.8fr);
}

.purchase-control-label {
	display: block;
	margin-bottom: 2px;
	color: #64748b;
	font-size: 10px;
	font-weight: 600;
}

/* Vertical Up/Down Qty Control Stepper */
.purchase-qty-control {
	display: grid;
	grid-template-columns: minmax(40px, 1fr) 26px;
	height: 34px;
	border: 1px solid #d9e1e8;
	border-radius: 7px;
	overflow: hidden;
	background: #ffffff;
}

.purchase-qty-control__input {
	border: 0;
	outline: 0;
	text-align: center;
	font-weight: 600;
	font-size: 12px;
	min-width: 0;
	padding: 0 4px;
}

.purchase-qty-control__buttons {
	display: grid;
	grid-template-rows: 1fr 1fr;
	border-inline-start: 1px solid #d9e1e8;
}

.purchase-qty-control__btn {
	border: 0;
	background: #f8fafc;
	cursor: pointer;
	font-size: 9px;
	line-height: 1;
	color: #475569;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background-color 0.15s ease;
}

.purchase-qty-control__btn:hover {
	background: #e2e8f0;
	color: #0f172a;
}

.purchase-qty-control__btn--down {
	border-top: 1px solid #d9e1e8;
}

.purchase-item-control :deep(.v-field) {
	min-height: 34px;
	border-radius: 7px;
}

.purchase-item-control :deep(.v-field__input) {
	min-height: 34px;
	padding-block: 2px;
	font-size: 12px;
}

.purchase-item-uom :deep(.v-field__input) {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 12px;
}

/* Container Queries for very small pane width */
@container (max-width: 420px) {
	.purchase-item-controls,
	.purchase-item-controls.has-received {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@container (max-width: 320px) {
	.purchase-item-main {
		grid-template-columns: 32px minmax(0, 1fr) 30px;
	}
	.purchase-item-amount {
		grid-column: 2;
		text-align: start;
		margin-top: 2px;
	}
	.purchase-item-controls,
	.purchase-item-controls.has-received {
		grid-template-columns: 1fr;
	}
}
</style>
