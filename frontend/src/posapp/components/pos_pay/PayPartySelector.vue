<template>
	<v-autocomplete
		:model-value="modelValue"
		@update:model-value="$emit('update:modelValue', $event)"
		:items="items"
		:item-title="itemTitle"
		item-value="name"
		:label="resolvedLabel"
		:placeholder="resolvedPlaceholder"
		density="compact"
		variant="outlined"
		color="primary"
		hide-details
		clearable
		:loading="loading"
		:custom-filter="() => true"
		:no-data-text="loading ? __('Loading...') : __('No records found')"
		class="sleek-field pos-themed-input pay-party-selector"
		@update:search="$emit('search', $event)"
	>
		<template #prepend-inner>
			<v-icon class="party-field-icon text-medium-emphasis" size="18">
				{{ partyIcon }}
			</v-icon>
		</template>

		<template #item="{ props: itemProps, item }">
			<v-list-item v-bind="itemProps" class="party-dropdown-item py-1">
				<template #title>
					<span class="font-weight-bold text-slate-800">{{ item.raw[itemTitle] || item.raw.name }}</span>
				</template>
				<template #subtitle>
					<div class="d-flex align-center gap-2 mt-1">
						<span v-if="item.raw.name && item.raw.name !== item.raw[itemTitle]" class="text-caption text-medium-emphasis">
							{{ __("ID") }}: {{ item.raw.name }}
						</span>
						<span v-if="item.raw.mobile_no || item.raw.cell_number" class="text-caption text-medium-emphasis">
							• {{ item.raw.mobile_no || item.raw.cell_number }}
						</span>
						<span v-if="item.raw.department || item.raw.supplier_group" class="text-caption text-medium-emphasis">
							• {{ item.raw.department || item.raw.supplier_group }}
						</span>
					</div>
				</template>
			</v-list-item>
		</template>
	</v-autocomplete>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	modelValue: string | null;
	partyType: string;
	items: Array<Record<string, any>>;
	loading?: boolean;
}>();

defineEmits<{
	"update:modelValue": [value: string | null];
	search: [value: string];
}>();

const __ = (text: string) => (window.__ ? window.__(text) : text);

const itemTitle = computed(() => {
	if (props.partyType === "Supplier") return "supplier_name";
	if (props.partyType === "Employee") return "employee_name";
	return "customer_name";
});

const resolvedLabel = computed(() => __(props.partyType || "Party"));

const resolvedPlaceholder = computed(() => {
	if (props.partyType === "Supplier") return __("Search or select supplier...");
	if (props.partyType === "Employee") return __("Search or select employee...");
	return __("Search or select customer...");
});

const partyIcon = computed(() => {
	if (props.partyType === "Supplier") return "mdi-domain";
	if (props.partyType === "Employee") return "mdi-badge-account-outline";
	return "mdi-account-search-outline";
});
</script>

<style scoped>
.pay-party-selector :deep(.v-field) {
	border-radius: 8px !important;
	background: #ffffff !important;
}

.pay-party-selector :deep(.v-field__outline) {
	--v-field-border-color: #cbd5e1 !important;
}

.pay-party-selector :deep(.v-field--focused .v-field__outline) {
	--v-field-border-color: #008080 !important;
}

.party-dropdown-item {
	border-bottom: 1px solid #f1f5f9;
}
.party-dropdown-item:last-child {
	border-bottom: none;
}
</style>
