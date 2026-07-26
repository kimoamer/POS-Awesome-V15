<template>
	<div v-if="invoiceDoc && !invoiceDoc.is_return" :class="['customer-credit-container', `customer-credit-container--${viewportMode}`]">
		<!-- Loading State -->
		<div v-if="loading" class="credit-state-box credit-state-box--loading">
			<v-progress-circular indeterminate size="16" width="2" color="primary"></v-progress-circular>
			<span>{{ __("Loading customer credit balance...") }}</span>
		</div>

		<!-- Error State with Retry -->
		<div v-else-if="errorMessage" class="credit-state-box credit-state-box--error">
			<v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
			<span>{{ errorMessage }}</span>
			<v-btn density="compact" variant="text" color="primary" class="credit-retry-action" @click="$emit('retry')">
				{{ __("Retry") }}
			</v-btn>
		</div>

		<!-- Available Credit Overview (Shown BEFORE toggle activation) -->
		<div v-else-if="availableCustomerCredit > 0" class="credit-overview-card">
			<div class="credit-overview-header">
				<div class="credit-overview-title">
					<v-icon size="18" color="primary">mdi-wallet-outline</v-icon>
					<strong>{{ __("Customer Credit Available") }}</strong>
				</div>
				<bdi class="credit-overview-amount">{{ formatCurrency(availableCustomerCredit) }}</bdi>
			</div>

			<!-- Applied Details when Redeem Toggle Active -->
			<div v-if="redeemCustomerCredit" class="credit-applied-details">
				<div class="credit-metrics-grid">
					<div class="credit-metric">
						<span>{{ __("Applied Now") }}</span>
						<bdi class="credit-metric-value credit-metric-value--primary">
							{{ formatCurrency(redeemedCustomerCredit) }}
						</bdi>
					</div>
					<div class="credit-metric">
						<span>{{ __("Remaining Available") }}</span>
						<bdi class="credit-metric-value">
							{{ formatCurrency(availableCustomerCredit - redeemedCustomerCredit) }}
						</bdi>
					</div>
				</div>

				<!-- Source Breakdown Rows -->
				<div v-if="customerCreditDict.length" class="credit-sources-list">
					<h5 class="credit-sources-heading">{{ __("Credit Sources") }}</h5>
					<div v-for="(row, idx) in customerCreditDict" :key="idx" class="customer-credit-source">
						<div class="customer-credit-source__label">
							{{ creditSourceLabel(row) }}
						</div>
						<div class="customer-credit-source__field">
							<bdi class="customer-credit-source__total">{{ formatCurrency(row.total_credit) }}</bdi>
						</div>
						<div class="customer-credit-source__field">
							<v-text-field
								density="compact"
								variant="outlined"
								color="primary"
								type="number"
								inputmode="decimal"
								:prefix="currencySymbol(invoiceDoc.currency)"
								:label="__('Apply Stored Value')"
								class="sleek-field pos-themed-input"
								hide-details
								:model-value="row.credit_to_redeem"
								@change="handleCreditToRedeemChange(row, $event)"
							></v-text-field>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty State when balance is 0 -->
		<div v-else class="credit-state-box credit-state-box--empty">
			<v-icon size="16" color="grey">mdi-wallet-off-outline</v-icon>
			<span>{{ __("No customer credit balance available.") }}</span>
		</div>
	</div>
</template>

<script setup>
const props = defineProps({
	viewportMode: {
		type: String,
		default: "desktop",
	},
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
	redeemedCustomerCredit: {
		type: Number,
		default: 0,
	},
	customerCreditDict: {
		type: Array,
		default: () => [],
	},
	loading: {
		type: Boolean,
		default: false,
	},
	errorMessage: {
		type: String,
		default: "",
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

const emit = defineEmits(["set-formatted-currency", "retry"]);

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
.customer-credit-container {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2, 8px);
	margin-top: var(--payment-space-2, 8px);
}

.credit-state-box {
	display: flex;
	align-items: center;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-2, 8px);
	font-size: var(--payment-font-caption, 11px);
	color: var(--pos-text-secondary, #64748b);
	border-radius: var(--payment-radius-sm, 8px);
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
}

.credit-state-box--error {
	color: rgb(220, 38, 38);
	background: rgba(220, 38, 38, 0.06);
}

.credit-overview-card {
	padding: var(--payment-space-2, 8px);
	border-radius: var(--payment-radius-sm, 8px);
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	background: var(--pos-surface-raised, #ffffff);
}

.credit-overview-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--payment-space-2, 8px);
}

.credit-overview-title {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: var(--payment-font-section, 13px);
	color: var(--pos-text-primary, #0f172a);
}

.credit-overview-amount {
	font-size: var(--payment-font-body, 13px);
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	color: var(--pos-primary, #2563eb);
}

.credit-applied-details {
	margin-top: var(--payment-space-2, 8px);
	padding-top: var(--payment-space-2, 8px);
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
}

.credit-metrics-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--payment-space-2, 8px);
}

.credit-metric {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 6px 8px;
	border-radius: var(--payment-radius-sm, 8px);
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
}

.credit-metric span {
	font-size: 10px;
	color: var(--pos-text-secondary, #64748b);
}

.credit-metric-value {
	font-size: 12px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

.credit-metric-value--primary {
	color: var(--pos-primary, #2563eb);
}

.credit-sources-heading {
	margin: 8px 0 4px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	color: var(--pos-text-secondary, #64748b);
}

.credit-sources-list {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-1, 4px);
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
}

.customer-credit-source__total {
	font-size: 12px;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
	color: var(--pos-text-secondary, #64748b);
}

.customer-credit-source__field {
	min-width: 0;
}

.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}

.credit-retry-action {
	min-height: 40px;
	min-width: 40px;
}

.customer-credit-container--tablet-portrait .credit-retry-action,
.customer-credit-container--tablet-landscape .credit-retry-action {
	min-height: 42px;
	min-width: 42px;
}

.customer-credit-container--phone .credit-retry-action {
	min-height: 44px;
	min-width: 44px;
}

@media (max-width: 599px) {
	.customer-credit-source {
		grid-template-columns: 1fr;
	}
}
</style>
