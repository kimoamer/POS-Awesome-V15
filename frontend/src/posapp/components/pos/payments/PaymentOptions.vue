<template>
	<div v-if="invoiceDoc" class="settlement-options">
		<div class="settlement-options__list">
			<!-- Credit Sale Option -->
			<div v-if="allowCreditSale && !invoiceDoc.is_return" class="settlement-option">
				<span class="settlement-option__icon">
					<v-icon size="16">mdi-credit-card-clock-outline</v-icon>
				</span>
				<div class="settlement-option__copy">
					<strong class="settlement-option__title">{{ __("Credit Sale") }}</strong>
					<small class="settlement-option__helper">{{ __("Allow payment after invoice submission") }}</small>
				</div>
				<div class="settlement-option__control">
					<v-switch
						:model-value="isCreditSale"
						color="primary"
						hide-details
						density="compact"
						@update:model-value="$emit('update:isCreditSale', $event)"
					></v-switch>
				</div>
			</div>

			<!-- Credit Due Date Controls (Inline or below Credit Sale) -->
			<div v-if="isCreditSale && !invoiceDoc.is_return" class="settlement-option-details">
				<div class="settlement-option-details__field-grid">
					<VueDatePicker
						:model-value="newCreditDueDate"
						model-type="format"
						format="dd-MM-yyyy"
						:min-date="new Date()"
						auto-apply
						teleport
						:placeholder="__('Due Date')"
						class="sleek-field pos-themed-input"
						@update:model-value="$emit('update:newCreditDueDate', $event)"
					/>
					<v-text-field
						density="compact"
						variant="outlined"
						type="number"
						min="0"
						max="365"
						:model-value="creditDueDays"
						:label="__('Days until due')"
						hide-details
						class="sleek-field pos-themed-input"
						@update:model-value="$emit('update:creditDueDays', parseFloat($event))"
						@change="$emit('apply-due-preset', creditDueDays)"
					></v-text-field>
				</div>
				<div class="settlement-option-details__presets">
					<v-chip
						v-for="d in creditDuePresets"
						:key="d"
						size="small"
						class="preset-chip"
						variant="tonal"
						color="primary"
						@click="$emit('apply-due-preset', d)"
					>
						{{ d }} {{ __("days") }}
					</v-chip>
				</div>
			</div>

			<!-- Write Off Difference Option -->
			<div v-if="allowWriteOff && diffPayment > 0 && !invoiceDoc.is_return" class="settlement-option">
				<span class="settlement-option__icon">
					<v-icon size="16">mdi-scale-balance</v-icon>
				</span>
				<div class="settlement-option__copy">
					<strong class="settlement-option__title">{{ __("Write Off Difference") }}</strong>
					<small class="settlement-option__helper">{{ __("Current difference") }}: {{ formatCurrency(diffPayment) }}</small>
				</div>
				<div class="settlement-option__control">
					<v-switch
						:model-value="isWriteOffChange"
						color="primary"
						hide-details
						density="compact"
						@update:model-value="$emit('update:isWriteOffChange', $event)"
					></v-switch>
				</div>
			</div>

			<!-- Write Off Amount Field -->
			<div v-if="isWriteOffChange && diffPayment > 0 && !invoiceDoc.is_return" class="settlement-option-details">
				<v-text-field
					density="compact"
					variant="outlined"
					type="number"
					min="0"
					:max="writeOffEffectiveMax"
					:model-value="writeOffAmountDisplay"
					:label="__('Write Off Amount')"
					hide-details
					class="sleek-field pos-themed-input"
					@update:model-value="$emit('update:writeOffAmount', $event)"
				></v-text-field>
				<small class="settlement-option-details__note">
					{{ __("This amount will be written off on submission.") }}
				</small>
			</div>

			<!-- Cashback Option -->
			<div v-if="invoiceDoc.is_return && allowCashback" class="settlement-option">
				<span class="settlement-option__icon">
					<v-icon size="16">mdi-cash-plus</v-icon>
				</span>
				<div class="settlement-option__copy">
					<strong class="settlement-option__title">{{ __("Cashback") }}</strong>
					<small class="settlement-option__helper">{{ __("Settle return value back through payment methods") }}</small>
				</div>
				<div class="settlement-option__control">
					<v-switch
						:model-value="isCashback"
						color="primary"
						hide-details
						density="compact"
						@update:model-value="$emit('update:isCashback', $event)"
					></v-switch>
				</div>
			</div>

			<!-- Store Return as Credit Option -->
			<div v-if="allowStoreAsCredit" class="settlement-option">
				<span class="settlement-option__icon">
					<v-icon size="16">mdi-cash-refund</v-icon>
				</span>
				<div class="settlement-option__copy">
					<strong class="settlement-option__title">{{ __("Store as Credit") }}</strong>
					<small class="settlement-option__helper">{{ __("Save return value as customer credit balance") }}</small>
				</div>
				<div class="settlement-option__control">
					<v-switch
						:model-value="isCreditReturn"
						color="primary"
						hide-details
						density="compact"
						@update:model-value="$emit('update:isCreditReturn', $event)"
					></v-switch>
				</div>
			</div>

			<!-- Customer Credit Balance Option -->
			<div v-if="!invoiceDoc.is_return && allowCustomerCredit" class="settlement-option">
				<span class="settlement-option__icon">
					<v-icon size="16">mdi-wallet-outline</v-icon>
				</span>
				<div class="settlement-option__copy">
					<strong class="settlement-option__title">{{ __("Use Customer Balance") }}</strong>
					<small class="settlement-option__helper">
						{{ __("Available") }}: {{ formatCurrency(availableCustomerCredit) }}
					</small>
				</div>
				<div class="settlement-option__control">
					<v-switch
						:model-value="redeemCustomerCredit"
						color="primary"
						hide-details
						density="compact"
						@update:model-value="handleRedeemCustomerCreditUpdate"
					></v-switch>
				</div>
			</div>

			<!-- Customer Credit Balance Applied Details -->
			<div v-if="redeemCustomerCredit && !invoiceDoc.is_return && allowCustomerCredit" class="settlement-option-details">
				<div class="credit-summary-card">
					<div class="credit-summary-row">
						<span>{{ __("Available Balance") }}</span>
						<bdi class="credit-summary-value">{{ formatCurrency(availableCustomerCredit) }}</bdi>
					</div>
					<div class="credit-summary-row">
						<span>{{ __("Applied Now") }}</span>
						<bdi class="credit-summary-value credit-summary-value--highlight">{{ formatCurrency(redeemedCustomerCredit) }}</bdi>
					</div>
					<div class="credit-summary-row credit-summary-row--subtle">
						<span>{{ __("Sources Used") }}</span>
						<span>{{ customerCreditSources }} {{ __("source(s) in order") }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	invoiceDoc: {
		type: Object,
		required: true,
	},
	allowCreditSale: {
		type: Boolean,
		default: false,
	},
	allowWriteOff: {
		type: Boolean,
		default: false,
	},
	allowCashback: {
		type: Boolean,
		default: false,
	},
	allowCustomerCredit: {
		type: Boolean,
		default: false,
	},
	allowStoreAsCredit: {
		type: Boolean,
		default: false,
	},
	creditChange: {
		type: Number,
		default: 0,
	},
	diffPayment: {
		type: Number,
		default: 0,
	},
	isWriteOffChange: {
		type: Boolean,
		default: false,
	},
	isCreditSale: {
		type: Boolean,
		default: false,
	},
	isCashback: {
		type: Boolean,
		default: false,
	},
	isCreditReturn: {
		type: Boolean,
		default: false,
	},
	newCreditDueDate: {
		type: String,
		default: null,
	},
	creditDueDays: {
		type: [Number, String],
		default: null,
	},
	creditDuePresets: {
		type: Array,
		default: () => [7, 14, 30],
	},
	writeOffAmount: {
		type: [Number, String],
		default: 0,
	},
	writeOffMaxAmount: {
		type: [Number, String],
		default: null,
	},
	redeemCustomerCredit: {
		type: Boolean,
		default: false,
	},
	availableCustomerCredit: {
		type: Number,
		default: 0,
	},
	redeemedCustomerCredit: {
		type: Number,
		default: 0,
	},
	customerCreditSources: {
		type: Number,
		default: 0,
	},
	formatCurrency: {
		type: Function,
		default: (value) => value,
	},
});

const emit = defineEmits([
	"update:isWriteOffChange",
	"update:isCreditSale",
	"update:isCashback",
	"update:isCreditReturn",
	"update:newCreditDueDate",
	"update:creditDueDays",
	"update:writeOffAmount",
	"update:redeemCustomerCredit",
	"apply-due-preset",
	"get-available-credit",
]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const handleRedeemCustomerCreditUpdate = (val) => {
	emit("update:redeemCustomerCredit", val);
	emit("get-available-credit", val);
};

const writeOffAmountDisplay = computed(() => {
	if (props.writeOffAmount === null || props.writeOffAmount === undefined || props.writeOffAmount === "") {
		return Math.max(props.diffPayment || 0, 0);
	}
	return props.writeOffAmount;
});

const writeOffEffectiveMax = computed(() => {
	const diffMax = Math.max(Number(props.diffPayment) || 0, 0);
	const profileCap = Number(props.writeOffMaxAmount);
	if (Number.isFinite(profileCap) && profileCap > 0) {
		return Math.min(diffMax, profileCap);
	}
	return diffMax;
});
</script>

<style scoped>
.settlement-options__list {
	display: flex;
	flex-direction: column;
}

.settlement-option {
	display: grid;
	grid-template-columns: 28px minmax(0, 1fr) auto;
	align-items: center;
	gap: var(--payment-space-2, 8px);
	min-height: 44px;
	padding-block: var(--payment-space-1, 4px);
	border-bottom: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
}

.settlement-option:last-child {
	border-bottom: 0;
}

.settlement-option__icon {
	width: 28px;
	height: 28px;
	display: grid;
	place-items: center;
	border-radius: var(--payment-radius-sm, 8px);
	color: var(--pos-primary, #2563eb);
	background: rgba(37, 99, 235, 0.08);
}

.settlement-option__title {
	display: block;
	font-size: var(--payment-font-section, 13px);
	font-weight: 650;
	line-height: 1.2;
	color: var(--pos-text-primary, #0f172a);
}

.settlement-option__helper {
	display: block;
	margin-top: 2px;
	font-size: var(--payment-font-caption, 11px);
	color: var(--pos-text-secondary, #64748b);
}

.settlement-option-details {
	padding: var(--payment-space-2, 8px);
	margin-bottom: var(--payment-space-2, 8px);
	background: var(--pos-surface-raised, #ffffff);
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	border-radius: var(--payment-radius-sm, 8px);
}

.settlement-option-details__field-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--payment-space-2, 8px);
}

.settlement-option-details__presets {
	display: flex;
	flex-wrap: wrap;
	gap: var(--payment-space-1, 4px);
	margin-top: var(--payment-space-2, 8px);
}

.settlement-option-details__note {
	display: block;
	margin-top: 4px;
	font-size: 11px;
	color: var(--pos-text-secondary, #64748b);
}

.credit-summary-card {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.credit-summary-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 12px;
	color: var(--pos-text-primary, #0f172a);
}

.credit-summary-row--subtle {
	font-size: 11px;
	color: var(--pos-text-secondary, #64748b);
}

.credit-summary-value {
	font-weight: 650;
	font-variant-numeric: tabular-nums;
}

.credit-summary-value--highlight {
	color: var(--pos-primary, #2563eb);
}

@media (max-width: 599px) {
	.settlement-option-details__field-grid {
		grid-template-columns: 1fr;
	}
}
</style>
