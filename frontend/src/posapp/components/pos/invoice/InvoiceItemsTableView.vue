<template>
	<div class="invoice-items-table-view">
		<v-data-table
			:headers="headers"
			:items="items"
			item-value="posa_row_id"
			class="posa-cart-table elevation-2 pos-themed-card"
			:class="tableClasses"
			fixed-header
			:density="tableDensity"
			hide-default-footer
			:header-props="headerProps"
			:search="itemSearch"
			:custom-filter="customFilter"
		>
			<template #no-data>
				<div class="posa-cart-empty-state">
					<div class="posa-cart-empty-state__icon-wrap">
						<v-icon :icon="emptyStateIcon" size="32" class="posa-cart-empty-state__icon" />
					</div>
					<div class="posa-cart-empty-state__title">{{ emptyStateTitle }}</div>
					<div class="posa-cart-empty-state__subtitle">{{ emptyStateSubtitle }}</div>
				</div>
			</template>

			<template v-slot:item="{ item }">
				<CartItemRow
					:item="item"
					:visible-columns="headers"
					:posProfile="posProfile"
					:isReturnInvoice="isReturnInvoice"
					:invoiceType="invoiceType"
					:displayCurrency="displayCurrency"
					:formatFloat="formatFloat"
					:formatCurrency="formatCurrency"
					:currencySymbol="currencySymbol"
					:isNumber="isNumber"
					:isNegative="isNegative"
					:hideQtyDecimals="hideQtyDecimals"
					:isRTL="isRTL"
					:is-expanded="false"
					@update-qty="(item, qty) => $emit('update-qty', item, qty)"
					@qty-edit-submitted="$emit('qty-edit-submitted', $event)"
					@minus-click="$emit('minus-click', $event)"
					@add-one="$emit('add-one', $event)"
					@calc-uom="(item, uom) => $emit('calc-uom', item, uom)"
					@update-rate="(item, rate) => $emit('update-rate', item, rate)"
					@update-discount-percent="(item, pct) => $emit('update-discount-percent', item, pct)"
					@update-discount-amount="(item, amt) => $emit('update-discount-amount', item, amt)"
					@discount-percent-edit-submitted="$emit('discount-percent-edit-submitted', $event)"
					@open-name-dialog="$emit('open-name-dialog', $event)"
					@reset-item-name="$emit('reset-item-name', $event)"
					@toggle-offer="$emit('toggle-offer', $event)"
					@toggle-expand="$emit('open-details', item)"
					@remove-item="$emit('remove-item', $event)"
				/>
			</template>
		</v-data-table>
	</div>
</template>

<script setup lang="ts">
import CartItemRow from "./CartItemRow.vue";

defineOptions({
	name: "InvoiceItemsTableView",
});

defineProps({
	items: {
		type: Array as () => any[],
		default: () => [],
	},
	headers: {
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
	tableClasses: Object,
	tableDensity: {
		type: String,
		default: "comfortable",
	},
	headerProps: Object,
	itemSearch: String,
	customFilter: Function,
	emptyStateTitle: String,
	emptyStateSubtitle: String,
	emptyStateIcon: String,
});

defineEmits([
	"update-qty",
	"qty-edit-submitted",
	"minus-click",
	"add-one",
	"calc-uom",
	"update-rate",
	"update-discount-percent",
	"update-discount-amount",
	"discount-percent-edit-submitted",
	"open-name-dialog",
	"reset-item-name",
	"toggle-offer",
	"open-details",
	"remove-item",
]);
</script>

<style scoped>
.invoice-items-table-view {
	height: 100%;
	min-height: 0;
	width: 100%;
	overflow: hidden;
}
</style>
