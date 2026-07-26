<template>
	<div :class="['selection-fields', `selection-fields--${viewportMode}`]">
		<div class="selection-fields-grid">
			<!-- Sales Person Selection -->
			<div class="selection-field-cell">
				<div v-if="salesPersonsError" class="selection-error-box">
					<v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
					<span>{{ salesPersonsError }}</span>
					<v-btn density="compact" variant="text" color="primary" size="small" @click="$emit('retry-sales-persons')">
						{{ __("Retry") }}
					</v-btn>
				</div>
				<v-select
					v-else
					density="compact"
					clearable
					variant="outlined"
					color="primary"
					:label="__('Sales Person')"
					:model-value="salesPerson"
					:items="normalizedSalesPersons"
					item-title="title"
					item-value="value"
					class="sleek-field pos-themed-input"
					:no-data-text="salesPersonsLoading ? __('Loading Sales Persons...') : __('Sales Person not found')"
					:loading="salesPersonsLoading"
					hide-details
					:disabled="readonly"
					@update:model-value="$emit('update:sales-person', $event)"
				></v-select>
			</div>

			<!-- Print Format Selection -->
			<div v-if="showPrintFormat" class="selection-field-cell">
				<div v-if="printFormatsError" class="selection-error-box">
					<v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
					<span>{{ printFormatsError }}</span>
					<v-btn density="compact" variant="text" color="primary" size="small" @click="$emit('retry-print-formats')">
						{{ __("Retry") }}
					</v-btn>
				</div>
				<v-select
					v-else
					density="compact"
					clearable
					variant="outlined"
					color="primary"
					:label="__('Print Format')"
					:model-value="printFormat"
					:items="normalizedPrintFormats"
					item-title="title"
					item-value="value"
					class="sleek-field pos-themed-input"
					:no-data-text="printFormatsLoading ? __('Loading Print Formats...') : __('No Print Formats Found')"
					:loading="printFormatsLoading"
					hide-details
					@update:model-value="$emit('update:print-format', $event)"
				></v-select>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	viewportMode: {
		type: String,
		default: "desktop",
	},
	salesPersons: {
		type: Array,
		default: () => [],
	},
	salesPerson: {
		type: String,
		default: "",
	},
	salesPersonsLoading: {
		type: Boolean,
		default: false,
	},
	salesPersonsError: {
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
	printFormatsLoading: {
		type: Boolean,
		default: false,
	},
	printFormatsError: {
		type: String,
		default: "",
	},
	showPrintFormat: {
		type: Boolean,
		default: true,
	},
});

defineEmits(["update:sales-person", "update:print-format", "retry-sales-persons", "retry-print-formats"]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const normalizedSalesPersons = computed(() => {
	if (!Array.isArray(props.salesPersons)) return [];
	return props.salesPersons
		.map((item) => {
			if (typeof item === "string") {
				return { title: item, value: item };
			}
			if (item && typeof item === "object") {
				const title = item.title || item.sales_person_name || item.sales_person || item.name || item.value || "";
				const value = item.value || item.name || item.sales_person_name || item.sales_person || item.title || "";
				return { title: String(title), value: String(value) };
			}
			return { title: String(item), value: String(item) };
		})
		.filter((item) => item.title && item.value);
});

const normalizedPrintFormats = computed(() => {
	if (!Array.isArray(props.printFormats)) return [];
	return props.printFormats
		.map((item) => {
			if (typeof item === "string") {
				return { title: item, value: item };
			}
			if (item && typeof item === "object") {
				const title = item.title || item.name || item.value || "";
				const value = item.value || item.name || item.title || "";
				return { title: String(title), value: String(value) };
			}
			return { title: String(item), value: String(item) };
		})
		.filter((item) => item.title && item.value);
});
</script>

<style scoped>
.selection-fields-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-1, 4px);
}

.selection-field-cell {
	min-width: 0;
}

.selection-error-box {
	display: flex;
	align-items: center;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-2, 8px);
	font-size: var(--payment-font-caption, 11px);
	color: rgb(220, 38, 38);
	background: rgba(220, 38, 38, 0.06);
	border-radius: var(--payment-radius-sm, 8px);
}

.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}

.selection-fields--phone .selection-fields-grid,
.selection-fields--tablet-portrait .selection-fields-grid {
	grid-template-columns: 1fr;
}

.selection-fields--tablet-landscape .selection-fields-grid,
.selection-fields--desktop .selection-fields-grid {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
