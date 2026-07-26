<template>
	<div v-if="invoiceDoc && allowPurchaseOrder" class="payment-po">
		<div class="payment-po-grid">
			<div class="payment-po-cell">
				<v-text-field
					v-model="invoiceDoc.po_no"
					:label="__('Purchase Order Number')"
					variant="outlined"
					density="compact"
					class="sleek-field pos-themed-input"
					clearable
					color="primary"
					hide-details
				></v-text-field>
			</div>
			<div class="payment-po-cell">
				<VueDatePicker
					:model-value="newPoDate"
					model-type="format"
					format="dd-MM-yyyy"
					:min-date="new Date()"
					auto-apply
					class="sleek-field pos-themed-input"
					:placeholder="__('Purchase Order Date')"
					@update:model-value="$emit('update:newPoDate', $event)"
				/>
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
	newPoDate: {
		type: String,
		default: null,
	},
});

defineEmits(["update:newPoDate"]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const allowPurchaseOrder = computed(() => parseBooleanSetting(props.posProfile?.posa_allow_customer_purchase_order));
</script>

<style scoped>
.payment-po {
	padding-top: var(--payment-space-2, 8px);
}

.payment-po-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-1, 4px);
}

.payment-po-cell {
	min-width: 0;
}

.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}

@media (max-width: 768px) {
	.payment-po-grid {
		grid-template-columns: 1fr;
	}
}
</style>
