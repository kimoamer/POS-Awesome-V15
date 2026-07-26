<template>
	<div v-if="invoiceDoc">
		<!-- Loyalty Points Redemption -->
		<v-row class="payments pa-1" v-if="hasRedeemableLoyaltyPoints && !invoiceDoc.is_return">
			<v-col cols="7">
				<v-text-field
					density="compact"
					variant="solo"
					color="primary"
					:label="__('Redeem Loyalty Points')"
					class="sleek-field pos-themed-input"
					hide-details
					:model-value="formatCurrency(loyaltyAmount)"
					type="text"
					@change="handleLoyaltyChange"
					:prefix="currencySymbol(invoiceDoc.currency)"
				></v-text-field>
			</v-col>
			<v-col cols="5">
				<v-text-field
					density="compact"
					variant="solo"
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
			</v-col>
		</v-row>

		<!-- Customer Credit Redemption -->
		<v-row
			class="payments pa-1"
			v-if="availableCustomerCredit > 0 && !invoiceDoc.is_return && redeemCustomerCredit"
		>
			<v-col cols="7">
				<v-text-field
					density="compact"
					variant="solo"
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
			</v-col>
			<v-col cols="5">
				<v-text-field
					density="compact"
					variant="solo"
					color="primary"
					:label="__('Available Stored Value')"
					class="sleek-field pos-themed-input"
					hide-details
					:model-value="formatCurrency(availableCustomerCredit)"
					:prefix="currencySymbol(invoiceDoc.currency)"
					readonly
				></v-text-field>
			</v-col>
		</v-row>
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
.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}
</style>
