<template>
	<div
		class="invoice-customer-section"
		:class="{ 'invoice-customer-section--with-type': allowSalesOrder }"
	>
		<div class="invoice-customer-section__selector">
			<Customer ref="customerComponent" />
		</div>
		<div v-if="allowSalesOrder" class="invoice-customer-section__type">
			<v-select
				density="compact"
				hide-details
				variant="outlined"
				color="primary"
				class="sleek-field pos-themed-input"
				:items="invoiceTypes"
				:label="frappe._('Type')"
				:model-value="modelValue"
				@update:model-value="$emit('update:modelValue', $event)"
				:disabled="modelValue == 'Return'"
			></v-select>
		</div>
	</div>
</template>

<script setup>
import { computed, ref } from "vue";
import Customer from "../customer/Customer.vue";
import { parseBooleanSetting } from "../../../utils/stock";

const props = defineProps({
	pos_profile: {
		type: Object,
		required: true,
		default: () => ({}),
	},
	invoiceTypes: {
		type: Array,
		default: () => ["Invoice", "Order", "Quotation"],
	},
	modelValue: {
		type: String,
		default: "Invoice",
	},
});

defineEmits(["update:modelValue"]);
const customerComponent = ref(null);
const allowSalesOrder = computed(() => parseBooleanSetting(props.pos_profile?.posa_allow_sales_order));

// Expose focus method for parent
const focusCustomerSearch = () => {
	if (customerComponent.value && typeof customerComponent.value.focusCustomerSearch === "function") {
		customerComponent.value.focusCustomerSearch();
	}
};

const selectFirstCustomer = () => {
	if (customerComponent.value && typeof customerComponent.value.selectFirstCustomer === "function") {
		customerComponent.value.selectFirstCustomer();
	}
};

const openNewCustomer = () => {
	if (customerComponent.value && typeof customerComponent.value.openNewCustomer === "function") {
		customerComponent.value.openNewCustomer();
	}
};

defineExpose({
	focusCustomerSearch,
	selectFirstCustomer,
	openNewCustomer,
});

const frappe = window.frappe;
</script>

<style scoped>
.invoice-customer-section {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	align-items: center;
	gap: var(--pos-control-gap, 6px);
	min-width: 0;
	margin: 0;
	padding: 0;
}

.invoice-customer-section--with-type {
	grid-template-columns: minmax(0, 1fr) minmax(92px, 126px);
}

.invoice-customer-section__selector,
.invoice-customer-section__type {
	min-width: 0;
}

.invoice-customer-section :deep(.v-field) {
	min-height: var(--pos-control-height, 44px) !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	box-shadow: none !important;
}

.invoice-customer-section :deep(.v-field--focused) {
	border-color: color-mix(in srgb, var(--pos-primary) 40%, var(--pos-border-light)) !important;
	box-shadow: none !important;
	outline: 2px solid color-mix(in srgb, var(--pos-primary) 12%, transparent);
	outline-offset: 0;
}

.invoice-customer-section :deep(.v-field__overlay) {
	display: none !important;
}

.invoice-customer-section :deep(.v-field__outline) {
	--v-field-border-opacity: 0 !important;
	color: transparent !important;
}

.invoice-customer-section :deep(.v-field__input),
.invoice-customer-section :deep(input) {
	min-height: var(--pos-control-height, 44px) !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
	font-size: var(--pos-font-control, 13px);
	font-weight: 650;
	color: var(--pos-text-primary);
}

.invoice-customer-section :deep(.v-label) {
	font-size: var(--pos-font-meta, 11px);
	font-weight: 700;
	color: var(--pos-text-muted);
}

@media (max-width: 520px) {
	.invoice-customer-section,
	.invoice-customer-section--with-type {
		grid-template-columns: 1fr;
		padding: 0;
	}
}
</style>
