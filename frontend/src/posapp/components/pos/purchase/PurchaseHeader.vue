<template>
	<div class="purchase-header-section pa-0">
		<div class="purchase-meta-grid">
			<!-- Supplier -->
			<div class="purchase-meta-col purchase-meta-col--supplier">
				<v-autocomplete
					:model-value="supplier"
					@update:model-value="$emit('update:supplier', $event)"
					:items="supplierOptions"
					item-title="supplier_name"
					item-value="name"
					:label="frappe._('Supplier')"
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
			<div class="purchase-meta-col purchase-meta-col--warehouse">
				<v-autocomplete
					:model-value="warehouse"
					@update:model-value="$emit('update:warehouse', $event)"
					:items="warehouseOptions"
					item-title="warehouse_name"
					item-value="name"
					:label="frappe._('Warehouse')"
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
			<div class="purchase-meta-col purchase-meta-col--date">
				<VueDatePicker
					:model-value="transactionDate"
					@update:model-value="$emit('update:transactionDate', $event)"
					model-type="format"
					format="dd-MM-yyyy"
					:enable-time-picker="false"
					auto-apply
					:placeholder="frappe._('Posting Date')"
					class="pos-themed-input purchase-date-picker"
				/>
			</div>

			<!-- Required By -->
			<div class="purchase-meta-col purchase-meta-col--date">
				<VueDatePicker
					:model-value="scheduleDate"
					@update:model-value="$emit('update:scheduleDate', $event)"
					model-type="format"
					format="dd-MM-yyyy"
					:enable-time-picker="false"
					auto-apply
					:placeholder="frappe._('Required By')"
					class="pos-themed-input purchase-date-picker"
				/>
			</div>

			<!-- Switches (Create Bill / Receive Now) -->
			<div class="purchase-meta-col purchase-meta-col--switches d-flex align-center ga-2">
				<div
					v-if="posProfile.posa_allow_purchase_receipt"
					class="purchase-switch-chip"
					:class="{ 'purchase-switch-chip--disabled': receiveDisabled }"
				>
					<v-switch
						:model-value="receiveNow"
						@update:model-value="$emit('update:receiveNow', $event)"
						density="compact"
						hide-details
						color="success"
						:disabled="receiveDisabled"
						:label="receiveDisabled ? __('Received') : __('Receive')"
						class="ma-0"
					></v-switch>
				</div>

				<div
					class="purchase-switch-chip"
					:class="{ 'purchase-switch-chip--disabled': createInvoiceDisabled }"
				>
					<v-switch
						:model-value="createInvoice"
						@update:model-value="$emit('update:createInvoice', $event)"
						density="compact"
						hide-details
						color="primary"
						:disabled="createInvoiceDisabled"
						:label="createInvoiceDisabled ? __('Billed') : __('Create Bill')"
						class="ma-0"
					></v-switch>
				</div>
			</div>
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
