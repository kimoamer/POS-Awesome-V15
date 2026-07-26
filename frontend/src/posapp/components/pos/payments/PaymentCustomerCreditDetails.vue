<template>
	<div v-if="invoiceDoc && availableCustomerCredit > 0 && !invoiceDoc.is_return && redeemCustomerCredit" class="customer-credit-details">
		<div v-for="(row, idx) in customerCreditDict" :key="idx" class="customer-credit-source">
			<div class="customer-credit-source__label">
				{{ creditSourceLabel(row) }}
			</div>
			<div class="customer-credit-source__field">
				<v-text-field
					density="compact"
					variant="outlined"
					color="primary"
					:label="__('Stored Value Source')"
					class="sleek-field pos-themed-input"
					hide-details
					:model-value="formatCurrency(row.total_credit)"
					readonly
					:prefix="currencySymbol(invoiceDoc.currency)"
				></v-text-field>
			</div>
			<div class="customer-credit-source__field">
				<v-text-field
					density="compact"
					variant="outlined"
					color="primary"
					:label="__('Apply Stored Value')"
					class="sleek-field pos-themed-input"
					hide-details
					type="text"
					:model-value="formatCurrency(row.credit_to_redeem)"
					@change="handleCreditToRedeemChange(row, $event)"
					:prefix="currencySymbol(invoiceDoc.currency)"
				></v-text-field>
			</div>
		</div>
	</div>
</template>

<script setup>
defineProps({
	invoiceDoc: {
		type: Object,
		required: true,
	},
	availableCustomerCredit: {
		type: Number,
		default: 0,
	},
	redeemCustomerCredit: {
		type: Boolean,
		default: false,
	},
	customerCreditDict: {
		type: Array,
		default: () => [],
	},
	creditSourceLabel: {
		type: Function,
		required: true,
	},
	formatCurrency: {
		type: Function,
		required: true,
	},
	currencySymbol: {
		type: Function,
		required: true,
	},
});

const emit = defineEmits(["set-formatted-currency"]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const handleCreditToRedeemChange = (row, event) => {
	emit("set-formatted-currency", {
		target: row,
		field: "credit_to_redeem",
		value: event.target.value,
	});
};
</script>

<style scoped>
.customer-credit-details {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2, 8px);
	padding-top: var(--payment-space-2, 8px);
}

.customer-credit-source {
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
	align-items: center;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-1, 4px);
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
	border-radius: var(--payment-radius-sm, 8px);
	background: var(--pos-surface-raised, #ffffff);
}

.customer-credit-source__label {
	font-size: var(--payment-font-label, 11px);
	font-weight: 600;
	color: var(--pos-text-primary, #0f172a);
	padding-inline: 4px;
	word-break: break-word;
}

.customer-credit-source__field {
	min-width: 0;
}

.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}

@media (max-width: 599px) {
	.customer-credit-source {
		grid-template-columns: 1fr;
	}
}
</style>
