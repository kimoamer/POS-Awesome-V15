<template>
	<div class="selection-fields">
		<!-- Sales Person Selection -->
		<v-row class="payment-selection-row" align="start">
			<v-col cols="12">
				<v-select
					density="compact"
					clearable
					variant="outlined"
					color="primary"
					:label="__('Sales Person')"
					:model-value="salesPerson"
					:items="salesPersons"
					item-title="title"
					item-value="value"
					class="sleek-field pos-themed-input"
					:no-data-text="__('Sales Person not found')"
					hide-details
					:disabled="readonly"
					@update:model-value="$emit('update:sales-person', $event)"
				></v-select>
			</v-col>
		</v-row>
		<!-- Print Format Selection -->
		<v-row v-if="showPrintFormat" class="payment-selection-row" align="start">
			<v-col cols="12">
				<v-select
					density="compact"
					clearable
					variant="outlined"
					color="primary"
					:label="__('Print Format')"
					:model-value="printFormat"
					:items="printFormats"
					class="sleek-field pos-themed-input"
					:no-data-text="__('No Print Formats Found')"
					hide-details
					@update:model-value="$emit('update:print-format', $event)"
				></v-select>
			</v-col>
		</v-row>
	</div>
</template>

<script setup>
defineProps({
	salesPersons: {
		type: Array,
		default: () => [],
	},
	salesPerson: {
		type: String,
		default: "",
	},
	readonly: {
		type: Boolean,
		default: false,
	},
	printFormats: {
		type: Array,
		default: () => [],
	},
	printFormat: {
		type: String,
		default: "",
	},
	showPrintFormat: {
		type: Boolean,
		default: true,
	},
});

defineEmits(["update:sales-person", "update:print-format"]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);
</script>

<style scoped>
.payment-selection-row {
	margin-bottom: var(--payment-space-2, 8px);
}

.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}
</style>
