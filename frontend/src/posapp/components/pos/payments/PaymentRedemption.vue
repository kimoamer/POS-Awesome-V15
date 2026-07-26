<template>
	<div v-if="invoiceDoc" class="loyalty-redemption">
		<!-- Loyalty Points Redemption Grid -->
		<div v-if="hasRedeemableLoyaltyPoints && !invoiceDoc.is_return" class="loyalty-redemption-grid">
			<v-text-field
				density="compact"
				variant="outlined"
				color="primary"
				:label="__('Redeem Loyalty Points')"
				class="sleek-field pos-themed-input loyalty-control-target"
				hide-details
				:model-value="loyaltyAmount || ''"
				type="number"
				step="any"
				min="0"
				:prefix="currencySymbol(invoiceDoc.currency)"
				@input="handleLoyaltyInput"
				@change="handleLoyaltyChange"
			></v-text-field>

			<v-text-field
				density="compact"
				variant="outlined"
				color="primary"
				:label="
					__('Available') +
					(customerInfo?.loyalty_points ? ` (${customerInfo.loyalty_points} pts)` : '')
				"
				class="sleek-field pos-themed-input loyalty-control-target"
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
	availablePointsAmount: {
		type: Number,
		default: 0,
	},
	loyaltyAmount: {
		type: Number,
		default: 0,
	},
	viewportMode: {
		type: String,
		default: "desktop",
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

const emit = defineEmits(["update:loyaltyAmount", "set-formatted-currency"]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const hasRedeemableLoyaltyPoints = computed(() => {
	const points = Number(props.customerInfo?.loyalty_points || 0);
	return Number.isFinite(points) && points > 0;
});

const handleLoyaltyInput = (event) => {
	const val = parseFloat(event.target.value) || 0;
	emit("update:loyaltyAmount", val);
};

const handleLoyaltyChange = (event) => {
	emit("set-formatted-currency", {
		field: "loyalty_amount",
		value: event.target.value,
	});
};
</script>

<style scoped>
.loyalty-redemption-grid {
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

.loyalty-control-target :deep(.v-field) {
	min-height: 40px;
}

@media (max-width: 899px) {
	.loyalty-redemption-grid {
		grid-template-columns: 1fr;
	}

	.loyalty-control-target :deep(.v-field) {
		min-height: 42px;
	}
}

@media (max-width: 599px) {
	.loyalty-control-target :deep(.v-field) {
		min-height: 44px;
	}
}
</style>
