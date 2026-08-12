<template>
	<div v-if="invoiceDoc" class="loyalty-redemption">
		<!-- Loyalty Points Redemption -->
		<div v-if="hasRedeemableLoyaltyPoints && !invoiceDoc.is_return" class="loyalty-redemption-grid">
			<v-text-field
				density="compact"
				variant="outlined"
				color="primary"
				:label="__('Redeem Loyalty Points')"
				class="sleek-field pos-themed-input"
				hide-details
				:model-value="formatCurrency(loyaltyAmount)"
				type="text"
				@change="handleLoyaltyChange"
				:prefix="currencySymbol(invoiceDoc.currency)"
			></v-text-field>

			<v-text-field
				density="compact"
				variant="outlined"
				color="primary"
				:label="
					__('You can redeem up to') +
					(customerInfo.loyalty_points ? ` (${customerInfo.loyalty_points} pts)` : '')
				"
				class="sleek-field pos-themed-input"
				hide-details
				:model-value="formatFloat(availablePointsAmount)"
				:prefix="currencySymbol(invoiceDoc.currency)"
				readonly
			></v-text-field>
		</div>

		<!-- Compact Empty Loyalty State -->
		<div v-else-if="!invoiceDoc.is_return" class="loyalty-empty-state">
			<v-icon size="16" color="grey">mdi-star-off-outline</v-icon>
			<span>{{ __("No loyalty points available for this customer.") }}</span>
		</div>

		<!-- Customer Credit Redemption -->
		<div
			class="credit-redemption-grid"
			v-if="availableCustomerCredit > 0 && !invoiceDoc.is_return && redeemCustomerCredit"
		>
			<v-text-field
				density="compact"
				variant="outlined"
				color="primary"
				:label="__('Applied Stored Value')"
				class="sleek-field pos-themed-input"
				hide-details
				:model-value="formatCurrency(redeemedCustomerCredit)"
				type="text"
				@change="handleCreditChange"
				:prefix="currencySymbol(invoiceDoc.currency)"
				readonly
			></v-text-field>

			<v-text-field
				density="compact"
				variant="outlined"
				color="primary"
				:label="__('Available Stored Value')"
				class="sleek-field pos-themed-input"
				hide-details
				:model-value="formatCurrency(availableCustomerCredit)"
				:prefix="currencySymbol(invoiceDoc.currency)"
				readonly
			></v-text-field>
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
	customerInfo: {
		type: [Object, String],
		default: () => ({}),
	},
	posProfile: {
		type: [Object, String],
		default: () => ({}),
	},
	availablePointsAmount: {
		type: Number,
		default: 0,
	},
	loyaltyAmount: {
		type: Number,
		default: 0,
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
	formatCurrency: {
		type: Function,
		required: true,
	},
	formatFloat: {
		type: Function,
		required: true,
	},
	currencySymbol: {
		type: Function,
		required: true,
	},
});

const emit = defineEmits(["update:loyaltyAmount", "update:redeemedCustomerCredit", "set-formatted-currency"]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const hasRedeemableLoyaltyPoints = computed(() => {
	const points = Number(props.customerInfo?.loyalty_points || 0);
	return Number.isFinite(points) && points > 0;
});

const handleLoyaltyChange = (event) => {
	emit("set-formatted-currency", {
		field: "loyalty_amount",
		value: event.target.value,
	});
};

const handleCreditChange = (event) => {
	emit("set-formatted-currency", {
		field: "redeemed_customer_credit",
		value: event.target.value,
	});
};
</script>

<style scoped>
.loyalty-redemption-grid,
.credit-redemption-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-1, 4px);
}

.loyalty-empty-state {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: var(--payment-space-2, 8px);
	font-size: var(--payment-font-caption, 11px);
	color: var(--pos-text-secondary, #64748b);
}

.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}

@media (max-width: 599px) {
	.loyalty-redemption-grid,
	.credit-redemption-grid {
		grid-template-columns: 1fr;
	}
}
</style>
