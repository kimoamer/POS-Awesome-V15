<template>
	<div v-if="invoiceDoc" class="payment-additional-info">
		<div class="payment-details-grid">
			<!-- Delivery Date (if applicable) -->
			<div v-if="allowSalesOrder && invoiceType === 'Order'" class="payment-details-cell">
				<label class="payment-field-label">{{ __("Delivery Date") }}</label>
				<VueDatePicker
					:model-value="newDeliveryDate"
					model-type="format"
					format="dd-MM-yyyy"
					:min-date="new Date()"
					auto-apply
					class="sleek-field pos-themed-input"
					:placeholder="__('Delivery Date')"
					@update:model-value="emit('update:newDeliveryDate', $event)"
				/>
			</div>

			<!-- Return Valid Until -->
			<div v-if="returnValidityEnabled && !invoiceDoc.is_return" class="payment-details-cell">
				<VueDatePicker
					:model-value="returnValidUptoDate"
					model-type="format"
					format="dd-MM-yyyy"
					:min-date="returnValidityMinDate"
					:enable-time-picker="false"
					auto-apply
					class="sleek-field pos-themed-input"
					:placeholder="__('Return Valid Until')"
					@update:model-value="emit('update:returnValidUptoDate', $event)"
				/>
			</div>

			<!-- Shipping Address Selection -->
			<div v-if="invoiceDoc.posa_delivery_date" class="payment-details-cell payment-details-cell--full">
				<label class="payment-field-label">{{ __("Shipping Address") }}</label>
				<!-- Loading State -->
				<div v-if="addressesLoading" class="address-state-box">
					<v-progress-circular indeterminate size="16" width="2" color="primary"></v-progress-circular>
					<span>{{ __("Loading shipping addresses...") }}</span>
				</div>

				<!-- Error State with Retry -->
				<div v-else-if="addressesError" class="address-state-box address-state-box--error">
					<v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
					<span>{{ addressesError }}</span>
					<v-btn density="compact" variant="text" color="primary" class="address-retry-action" @click="emit('retry-addresses')">
						{{ __("Retry") }}
					</v-btn>
				</div>

				<div v-else class="address-field-wrapper">
					<v-autocomplete
						density="compact"
						clearable
						auto-select-first
						variant="outlined"
						color="primary"
						:label="__('Shipping Address')"
						v-model="invoiceDoc.shipping_address_name"
						:items="addresses"
						item-title="display_title"
						item-value="name"
						class="sleek-field pos-themed-input"
						:no-data-text="__('No saved addresses found')"
						hide-details
						:custom-filter="addressFilter"
					>
						<template v-slot:item="{ props, item }">
							<v-list-item v-bind="props">
								<v-list-item-title class="text-primary text-subtitle-1">
									<div>{{ (item?.raw && item.raw.address_title) || item.address_title }}</div>
								</v-list-item-title>
								<v-list-item-subtitle>
									<div>{{ (item?.raw && item.raw.address_line1) || item.address_line1 }}</div>
								</v-list-item-subtitle>
								<v-list-item-subtitle v-if="(item?.raw && item.raw.address_line2) || item.address_line2">
									<div>{{ (item?.raw && item.raw.address_line2) || item.address_line2 }}</div>
								</v-list-item-subtitle>
								<v-list-item-subtitle v-if="(item?.raw && item.raw.city) || item.city">
									<div>{{ (item?.raw && item.raw.city) || item.city }}</div>
								</v-list-item-subtitle>
								<v-list-item-subtitle v-if="(item?.raw && item.raw.state) || item.state">
									<div>{{ (item?.raw && item.raw.state) || item.state }}</div>
								</v-list-item-subtitle>
								<v-list-item-subtitle v-if="(item?.raw && item.raw.country) || item.country">
									<div>{{ (item?.raw && item.raw.country) || item.country }}</div>
								</v-list-item-subtitle>
								<v-list-item-subtitle v-if="(item?.raw && item.raw.mobile_no) || item.mobile_no">
									<div>{{ (item?.raw && item.raw.mobile_no) || item.mobile_no }}</div>
								</v-list-item-subtitle>
								<v-list-item-subtitle v-if="(item?.raw && item.raw.address_type) || item.address_type">
									<div>{{ (item?.raw && item.raw.address_type) || item.address_type }}</div>
								</v-list-item-subtitle>
							</v-list-item>
						</template>
					</v-autocomplete>
					<v-btn
						density="compact"
						variant="tonal"
						color="primary"
						class="create-address-btn"
						icon="mdi-plus"
						:title="__('Create Address')"
						:aria-label="__('Create Address')"
						@click="emit('new-address')"
					></v-btn>
				</div>
			</div>

			<!-- Additional Notes -->
			<div v-if="showAdditionalNotes" class="payment-details-cell payment-details-cell--full">
				<v-textarea
					class="payment-notes-field sleek-field"
					variant="outlined"
					density="compact"
					clearable
					color="primary"
					auto-grow
					rows="2"
					:label="__('Additional Notes')"
					v-model="invoiceDoc.posa_notes"
					hide-details
				></v-textarea>
			</div>

			<!-- Authorization Code -->
			<div v-if="showAuthorizationCode" class="payment-details-cell">
				<v-text-field
					class="sleek-field pos-themed-input"
					variant="outlined"
					density="compact"
					clearable
					color="primary"
					:label="__('Authorization Code')"
					v-model="invoiceDoc.posa_authorization_code"
					hide-details
					autocomplete="off"
					maxlength="32"
				></v-text-field>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";
import { parseBooleanSetting } from "../../../utils/stock";

const props = defineProps({
	invoiceDoc: {
		type: Object,
		required: true,
	},
	posProfile: {
		type: [Object, String],
		default: () => ({}),
	},
	invoiceType: {
		type: String,
		default: "Invoice",
	},
	returnValidityEnabled: {
		type: Boolean,
		default: false,
	},
	returnValidityMinDate: {
		type: Date,
		default: () => new Date(),
	},
	addresses: {
		type: Array,
		default: () => [],
	},
	addressesLoading: {
		type: Boolean,
		default: false,
	},
	addressesError: {
		type: String,
		default: "",
	},
	newDeliveryDate: {
		type: String,
		default: null,
	},
	returnValidUptoDate: {
		type: String,
		default: null,
	},
	addressFilter: {
		type: Function,
		default: () => true,
	},
});

const emit = defineEmits(["update:newDeliveryDate", "update:returnValidUptoDate", "new-address", "retry-addresses"]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const allowSalesOrder = computed(() => parseBooleanSetting(props.posProfile?.posa_allow_sales_order));
const showAdditionalNotes = computed(() => parseBooleanSetting(props.posProfile?.posa_display_additional_notes));
const showAuthorizationCode = computed(() => parseBooleanSetting(props.posProfile?.posa_display_authorization_code));
</script>

<style scoped>
.payment-details-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-1, 4px);
}

.payment-details-cell {
	min-width: 0;
}

.payment-details-cell--full {
	grid-column: 1 / -1;
}

.address-state-box {
	display: flex;
	align-items: center;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-2, 8px);
	font-size: var(--payment-font-caption, 11px);
	color: var(--pos-text-secondary, #64748b);
	border-radius: var(--payment-radius-sm, 8px);
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
}

.address-state-box--error {
	color: rgb(220, 38, 38);
	background: rgba(220, 38, 38, 0.06);
}

.address-field-wrapper {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: var(--payment-space-2, 8px);
	align-items: center;
}

.create-address-btn {
	height: 40px;
	width: 40px;
	min-width: 40px;
}

.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}

@media (max-width: 899px) {
	.payment-details-grid {
		grid-template-columns: 1fr;
	}

	.create-address-btn {
		height: 44px;
		width: 44px;
		min-width: 44px;
	}
}
</style>
