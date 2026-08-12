<template>
	<div class="purchase-header-section pa-0">
		<div class="purchase-meta-grid">
			<!-- Supplier -->
			<div class="purchase-header-field">
				<label class="purchase-header-field__label">
					{{ __("Supplier") }}
				</label>
				<v-autocomplete
					:model-value="supplier"
					@update:model-value="$emit('update:supplier', $event)"
					:items="supplierOptions"
					item-title="supplier_name"
					item-value="name"
					:placeholder="__('Select supplier')"
					density="compact"
					variant="outlined"
					color="primary"
					hide-details="auto"
					:loading="supplierLoading"
					@update:search="$emit('search-supplier', $event)"
					:custom-filter="() => true"
					:no-data-text="supplierLoading ? __('Loading suppliers...') : __('Suppliers not found')"
					class="pos-themed-input"
					clearable
				>
					<template #append-inner>
						<v-tooltip v-if="allowCreateSupplier" :text="__('Add new supplier')">
							<template #activator="{ props }">
								<v-icon
									v-bind="props"
									class="cursor-pointer"
									@mousedown.prevent.stop
									@click.stop="$emit('create-supplier')"
								>
									mdi-plus
								</v-icon>
							</template>
						</v-tooltip>
					</template>
				</v-autocomplete>
			</div>

			<!-- Warehouse -->
			<div class="purchase-header-field">
				<label class="purchase-header-field__label">
					{{ __("Warehouse") }}
				</label>
				<v-select
					:model-value="warehouse"
					@update:model-value="$emit('update:warehouse', $event)"
					:items="warehouseOptions"
					item-title="warehouse_name"
					item-value="name"
					:placeholder="__('Select warehouse')"
					density="compact"
					variant="outlined"
					color="primary"
					hide-details="auto"
					clearable
					:loading="warehouseLoading"
					class="pos-themed-input"
				/>
			</div>

			<!-- Posting Date -->
			<div class="purchase-header-field">
				<label class="purchase-header-field__label">
					{{ __("Posting Date") }}
				</label>
				<VueDatePicker
					:model-value="transactionDate"
					@update:model-value="$emit('update:transactionDate', $event)"
					model-type="format"
					format="dd-MM-yyyy"
					:enable-time-picker="false"
					auto-apply
					:placeholder="__('Posting Date')"
					class="pos-themed-input purchase-date-picker"
				/>
			</div>

			<!-- Required By -->
			<div class="purchase-header-field">
				<label class="purchase-header-field__label">
					{{ __("Required By") }}
				</label>
				<VueDatePicker
					:model-value="scheduleDate"
					@update:model-value="$emit('update:scheduleDate', $event)"
					model-type="format"
					format="dd-MM-yyyy"
					:enable-time-picker="false"
					auto-apply
					:placeholder="__('Required By')"
					class="pos-themed-input purchase-date-picker"
				/>
			</div>
		</div>

		<div class="purchase-header-switches">
			<v-switch
				v-if="posProfile.posa_allow_purchase_receipt"
				:model-value="receiveNow"
				@update:model-value="$emit('update:receiveNow', $event)"
				density="compact"
				hide-details
				color="success"
				:disabled="receiveDisabled"
				:label="receiveDisabled ? __('Received') : __('Receive')"
				class="ma-0"
			/>
			<v-switch
				:model-value="createInvoice"
				@update:model-value="$emit('update:createInvoice', $event)"
				density="compact"
				hide-details
				color="primary"
				:disabled="createInvoiceDisabled"
				:label="createInvoiceDisabled ? __('Billed') : __('Create Bill')"
				class="ma-0"
			/>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		supplier: String,
		supplierOptions: Array,
		supplierLoading: Boolean,
		allowCreateSupplier: Boolean,
		warehouse: String,
		warehouseOptions: Array,
		warehouseLoading: Boolean,
		transactionDate: String,
		scheduleDate: String,
		receiveNow: Boolean,
		createInvoice: Boolean,
		receiveDisabled: Boolean,
		createInvoiceDisabled: Boolean,
		posProfile: Object,
	},
	emits: [
		"update:supplier",
		"update:warehouse",
		"update:transactionDate",
		"update:scheduleDate",
		"update:receiveNow",
		"update:createInvoice",
		"search-supplier",
		"create-supplier",
	],
};
</script>

<style scoped>
.purchase-header-section {
	width: 100%;
}

.purchase-meta-grid {
	display: grid;
	grid-template-columns: minmax(190px, 1.35fr) minmax(150px, 1fr) repeat(2, minmax(130px, 0.85fr));
	gap: 12px;
	align-items: start;
	width: 100%;
}

.purchase-header-field {
	min-width: 0;
}

.purchase-header-field__label {
	display: block;
	margin-block-end: 4px;
	font-size: 11px;
	font-weight: 600;
	color: var(--pos-text-secondary, #64748b);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.purchase-header-field :deep(.v-field) {
	min-height: 40px;
	border-radius: 9px;
}

.purchase-header-field :deep(.v-field__input) {
	min-height: 40px;
	padding-block: 2px;
	font-size: 13px;
}

.purchase-date-picker :deep(.dp__input) {
	min-height: 40px;
	height: 40px;
	border-radius: 9px;
	font-size: 13px;
	padding-inline-start: 32px !important;
	padding-inline-end: 8px !important;
}

.purchase-date-picker :deep(.dp__input_icon) {
	inset-inline-start: 8px !important;
	inset-inline-end: auto !important;
}

.purchase-header-switches {
	display: flex;
	align-items: center;
	gap: 20px;
	min-height: 32px;
	margin-top: 6px;
	padding-inline: 2px;
}

.purchase-header-switches :deep(.v-label) {
	font-size: 12px;
	font-weight: 600;
	color: var(--pos-text-primary, #334155);
	white-space: nowrap;
}

@container (max-width: 760px) {
	.purchase-meta-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@container (max-width: 460px) {
	.purchase-meta-grid {
		grid-template-columns: minmax(0, 1fr);
	}

	.purchase-header-switches {
		flex-wrap: wrap;
	}
}
</style>

