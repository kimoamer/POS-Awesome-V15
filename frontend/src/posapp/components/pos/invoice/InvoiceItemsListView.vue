<template>
	<div class="invoice-items-list-container">
		<div v-if="items && items.length > 0" class="invoice-items-list">
			<InvoiceItemCard
				v-for="item in items"
				:key="item.posa_row_id || item.item_code"
				:item="item"
				:pos-profile="posProfile"
				:is-return-invoice="isReturnInvoice"
				:invoice-type="invoiceType"
				:display-currency="displayCurrency"
				:format-float="formatFloat"
				:format-currency="formatCurrency"
				:currency-symbol="currencySymbol"
				:is-number="isNumber"
				:is-negative="isNegative"
				:hide-qty-decimals="hideQtyDecimals"
				:is-r-t-l="isRTL"
				@open-name-dialog="$emit('open-name-dialog', $event)"
				@reset-item-name="$emit('reset-item-name', $event)"
				@add-one="$emit('add-one', $event)"
				@update-qty="(item, qty) => $emit('update-qty', item, qty)"
				@minus-click="$emit('minus-click', $event)"
				@calc-uom="(item, uom) => $emit('calc-uom', item, uom)"
				@update-rate="(item, rate) => $emit('update-rate', item, rate)"
				@update-discount-percent="(item, pct) => $emit('update-discount-percent', item, pct)"
				@update-discount-amount="(item, amt) => $emit('update-discount-amount', item, amt)"
				@toggle-offer="$emit('toggle-offer', $event)"
				@open-details="$emit('open-details', $event)"
				@remove-item="$emit('remove-item', $event)"
			/>
		</div>
		<div v-else class="posa-cart-empty-state">
			<div class="posa-cart-empty-state__icon-wrap">
				<v-icon :icon="emptyStateIcon || 'mdi-cart-outline'" size="32" class="posa-cart-empty-state__icon" />
			</div>
			<div class="posa-cart-empty-state__title">{{ emptyStateTitle }}</div>
			<div class="posa-cart-empty-state__subtitle">{{ emptyStateSubtitle }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import InvoiceItemCard from "./InvoiceItemCard.vue";

defineOptions({
	name: "InvoiceItemsListView",
});

defineProps({
	items: {
		type: Array as () => any[],
		default: () => [],
	},
	posProfile: {
		type: Object,
		default: () => ({}),
	},
	isReturnInvoice: Boolean,
	invoiceType: String,
	displayCurrency: String,
	formatFloat: {
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
	isNumber: Function,
	isNegative: {
		type: Function,
		required: true,
	},
	hideQtyDecimals: Boolean,
	isRTL: Boolean,
	emptyStateTitle: {
		type: String,
		default: "No items in cart",
	},
	emptyStateSubtitle: {
		type: String,
		default: "Add products from the selector to start this sale.",
	},
	emptyStateIcon: {
		type: String,
		default: "mdi-cart-outline",
	},
});

defineEmits([
	"open-name-dialog",
	"reset-item-name",
	"add-one",
	"update-qty",
	"minus-click",
	"calc-uom",
	"update-rate",
	"update-discount-percent",
	"update-discount-amount",
	"toggle-offer",
	"open-details",
	"remove-item",
]);
</script>

<style scoped>
.invoice-items-list-container {
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.invoice-items-list {
	height: 100%;
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
	overscroll-behavior: contain;
	padding: 6px;
}
</style>
