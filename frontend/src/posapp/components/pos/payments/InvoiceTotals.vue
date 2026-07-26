<template>
	<div v-if="invoice_doc" class="invoice-totals-list">
		<div class="invoice-total-row">
			<span class="invoice-total-row__label">{{ __("Net Total") }}</span>
			<bdi class="invoice-total-row__value">{{ displayMoney(invoice_doc.net_total) }}</bdi>
		</div>

		<div class="invoice-total-row">
			<span class="invoice-total-row__label">{{ __("Tax and Charges") }}</span>
			<bdi class="invoice-total-row__value">{{ displayMoney(invoice_doc.total_taxes_and_charges) }}</bdi>
		</div>

		<div class="invoice-total-row">
			<span class="invoice-total-row__label">{{ __("Total Amount") }}</span>
			<bdi class="invoice-total-row__value">{{ displayMoney(invoice_doc.total) }}</bdi>
		</div>

		<div class="invoice-total-row">
			<span class="invoice-total-row__label">
				{{ __("Item / Rate Discounts") }}
				<v-tooltip location="top" max-width="320" open-on-click open-on-hover :text="discountHelpText">
					<template #activator="{ props: tooltipProps }">
						<button
							v-bind="tooltipProps"
							type="button"
							class="discount-help-trigger"
							:aria-label="__('Discount clarity')"
							@click.stop
						>
							<v-icon icon="mdi-information-outline" size="16" />
						</button>
					</template>
				</v-tooltip>
			</span>
			<bdi class="invoice-total-row__value">{{ displayMoney(itemDiscountTotal) }}</bdi>
		</div>

		<div v-if="invoice_doc.discount_amount" class="invoice-total-row">
			<span class="invoice-total-row__label">{{ __("Additional Discount") }}</span>
			<bdi class="invoice-total-row__value">{{ displayMoney(invoice_doc.discount_amount) }}</bdi>
		</div>

		<div class="invoice-total-row invoice-total-row--grand">
			<span class="invoice-total-row__label">{{ __("Grand Total") }}</span>
			<bdi class="invoice-total-row__value">{{ displayMoney(invoice_doc.grand_total) }}</bdi>
		</div>

		<div v-if="invoice_doc.rounded_total" class="invoice-total-row">
			<span class="invoice-total-row__label">{{ __("Rounded Total") }}</span>
			<bdi class="invoice-total-row__value">{{ displayMoney(invoice_doc.rounded_total) }}</bdi>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	invoice_doc: Object,
	displayCurrency: String,
	diff_payment: Number,
	diff_label: String,
	itemDiscountTotal: {
		type: Number,
		default: 0,
	},
	currencySymbol: Function,
	formatCurrency: Function,
});

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const displayMoney = (value) => {
	const numericValue = Number(value || 0);
	const safeNum = Number.isFinite(numericValue) ? numericValue : 0;
	if (props.formatCurrency) {
		return props.formatCurrency(safeNum);
	}
	const currency = props.invoice_doc?.currency || "";
	const symbol = props.currencySymbol?.(currency) || "";
	const formatted = safeNum.toFixed(2);
	return symbol ? `${symbol} ${formatted}` : formatted;
};

const discountHelpText = computed(
	() =>
		`${__("Item and rate discounts are already included in item rates and Net Total.")} ${__("Additional Discount is the separate invoice-level discount.")}`,
);
</script>

<style scoped>
.invoice-totals-list {
	display: flex;
	flex-direction: column;
	gap: 0;
}

.invoice-total-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	min-height: 38px;
	padding-block: 6px;
	border-bottom: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
}

.invoice-total-row:last-child {
	border-bottom: 0;
}

.invoice-total-row__label {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--pos-text-secondary, #64748b);
}

.invoice-total-row__value {
	font-size: 0.9375rem;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
	color: var(--pos-text-primary, #0f172a);
}

.invoice-total-row--grand {
	margin-top: 4px;
	padding-top: 10px;
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.12));
}

.invoice-total-row--grand .invoice-total-row__label {
	font-size: 1rem;
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
}

.invoice-total-row--grand .invoice-total-row__value {
	font-size: 1.125rem;
	font-weight: 750;
	color: var(--pos-primary, #2563eb);
}

.discount-help-trigger {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	margin-inline-start: 2px;
	border-radius: 999px;
	border: 0;
	background: transparent;
	color: var(--pos-primary, #2563eb);
	cursor: help;
}

.discount-help-trigger:hover,
.discount-help-trigger:focus-visible {
	background: rgba(37, 99, 235, 0.12);
	outline: none;
}
</style>
