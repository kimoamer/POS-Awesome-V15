<template>
	<div class="invoice-items-list-container">
		<div
			v-if="items && items.length > 0 && items.length <= virtualizationThreshold"
			class="invoice-items-list"
		>
			<InvoiceItemCard
				v-for="item in items"
				:key="item.posa_row_id || item.item_code"
				:item="item"
				:catalog-item="itemMediaByCode?.get?.(item.item_code)"
				:layout-mode="layoutMode"
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
		<DynamicScroller
			v-else-if="items && items.length > 0"
			class="invoice-items-list invoice-items-list--virtual"
			:items="virtualItems"
			:min-item-size="minimumItemSize"
			key-field="virtualKey"
			:buffer="480"
		>
			<template #default="{ item: row, index, active }">
				<DynamicScrollerItem
					:item="row"
					:active="active"
					:data-index="index"
					:size-dependencies="[layoutMode, row.entry?.qty, row.entry?.rate]"
				>
					<InvoiceItemCard
						:item="row.entry"
						:catalog-item="itemMediaByCode?.get?.(row.entry?.item_code)"
						:layout-mode="layoutMode"
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
				</DynamicScrollerItem>
			</template>
		</DynamicScroller>
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
import { computed } from "vue";
import {
	DynamicScroller,
	DynamicScrollerItem,
} from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import InvoiceItemCard from "./InvoiceItemCard.vue";

defineOptions({
	name: "InvoiceItemsListView",
});

export interface InvoiceItemsListViewProps {
	items?: any[];
	layoutMode?: "row" | "stacked" | "phone";
	itemMediaByCode?: any;
	posProfile?: any;
	isReturnInvoice?: boolean;
	invoiceType?: string;
	displayCurrency?: string;
	formatFloat: (val: any, precision?: number) => string;
	formatCurrency: (val: any, precision?: number) => string;
	currencySymbol: (currency?: string) => string;
	isNumber?: (val: any) => boolean | string;
	isNegative: (val: any) => boolean;
	hideQtyDecimals?: boolean;
	isRTL?: boolean;
	emptyStateTitle?: string;
	emptyStateSubtitle?: string;
	emptyStateIcon?: string;
}

const props = withDefaults(defineProps<InvoiceItemsListViewProps>(), {
	items: () => [],
	layoutMode: "row",
	posProfile: () => ({}),
	emptyStateTitle: "No items in cart",
	emptyStateSubtitle: "Add products from the selector to start this sale.",
	emptyStateIcon: "mdi-cart-outline",
});

const virtualizationThreshold = 50;
const minimumItemSize = computed(() =>
	props.layoutMode === "phone" ? 172 : props.layoutMode === "stacked" ? 148 : 104,
);
const virtualItems = computed(() =>
	(props.items || []).map((entry, index) => ({
		virtualKey:
			entry?.posa_row_id || entry?.name || `${entry?.item_code || "item"}:${index}`,
		entry,
	})),
);

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
	container-type: inline-size;
}

.invoice-items-list {
	height: 100%;
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
	overscroll-behavior: contain;
	padding: 6px;
}

.invoice-items-list--virtual :deep(.vue-recycle-scroller__item-view) {
	padding: 0 6px;
}
</style>
