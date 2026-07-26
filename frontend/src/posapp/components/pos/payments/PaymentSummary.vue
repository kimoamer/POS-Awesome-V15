<template>
	<div v-if="invoice_doc" class="payment-overview-grid">
		<button
			type="button"
			class="payment-overview-metric"
			@click="$emit('show-paid-amount')"
		>
			<span class="payment-overview-metric__label">{{ __("Paid Amount") }}</span>
			<bdi class="payment-overview-metric__value">
				{{ renderMoney(paidAmount) }}
			</bdi>
		</button>

		<button
			type="button"
			class="payment-overview-metric"
			@click="$emit('show-diff-payment')"
		>
			<span class="payment-overview-metric__label">{{ diff_label || __("To Pay") }}</span>
			<bdi class="payment-overview-metric__value">
				{{ renderMoney(differenceAmount) }}
			</bdi>
		</button>
	</div>
</template>

<script setup>
const props = defineProps({
	compact: {
		type: Boolean,
		default: false,
	},
	invoice_doc: Object,
	paidAmount: {
		type: Number,
		default: 0,
	},
	differenceAmount: {
		type: Number,
		default: 0,
	},
	diff_label: String,
	currency: {
		type: String,
		default: "",
	},
	formatMoney: {
		type: Function,
		default: null,
	},
});

defineEmits(["show-paid-amount", "show-diff-payment", "show-paid-change", "update-credit-change"]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const renderMoney = (val) => {
	const num = Number(val || 0);
	const safeNum = Number.isFinite(num) ? num : 0;
	if (props.formatMoney) {
		return props.formatMoney(safeNum);
	}
	return safeNum.toFixed(2);
};
</script>

<style scoped>
.payment-overview-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 8px;
}

.payment-overview-metric {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	min-width: 0;
	min-height: 56px;
	padding: 8px 12px;
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	border-radius: var(--pos-radius-sm, 10px);
	background: var(--pos-surface-raised, #ffffff);
	text-align: start;
	cursor: pointer;
	transition: background-color 0.15s ease, border-color 0.15s ease;
}

.payment-overview-metric:hover {
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
	border-color: var(--pos-primary, #2563eb);
}

.payment-overview-metric__label {
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--pos-text-secondary, #64748b);
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.payment-overview-metric__value {
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 1.25rem;
	font-weight: 750;
	font-variant-numeric: tabular-nums;
	color: var(--pos-text-primary, #0f172a);
}
</style>
