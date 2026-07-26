<template>
	<header class="payment-screen-header">
		<div class="payment-screen-header__leading">
			<v-btn
				icon
				variant="text"
				size="small"
				class="payment-screen-header__back-btn"
				:disabled="loading"
				:aria-disabled="loading"
				:aria-label="dialogMode ? __('Close payment') : __('Back to cart')"
				@click="!loading && $emit('back')"
			>
				<v-progress-circular v-if="loading" indeterminate size="20" color="primary" />
				<v-icon v-else size="22">
					{{ dialogMode ? "mdi-close" : "mdi-arrow-left" }}
				</v-icon>
			</v-btn>

			<div class="payment-screen-header__title-group">
				<h2 class="payment-screen-header__title">
					{{
						invoiceDoc?.is_return
							? __("Complete Refund")
							: __("Complete Payment")
					}}
				</h2>
				<p class="payment-screen-header__subtitle">
					{{
						customerInfo?.customer_name ||
						invoiceDoc?.customer_name ||
						invoiceDoc?.customer ||
						__("Customer")
					}}
				</p>
			</div>
		</div>

		<div class="payment-screen-header__trailing">
			<v-chip
				v-if="invoiceDoc?.is_return"
				color="error"
				size="small"
				variant="tonal"
				class="payment-screen-header__badge"
			>
				<v-icon start size="14">mdi-keyboard-return</v-icon>
				{{ __("Return") }}
			</v-chip>

			<v-chip
				v-else-if="invoiceType && invoiceType !== 'Invoice'"
				color="info"
				size="small"
				variant="tonal"
				class="payment-screen-header__badge"
			>
				{{ invoiceType }}
			</v-chip>
		</div>
	</header>
</template>

<script setup lang="ts">
interface Props {
	dialogMode?: boolean;
	invoiceDoc?: any;
	customerInfo?: any;
	invoiceType?: string;
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	dialogMode: false,
	invoiceDoc: () => ({}),
	customerInfo: () => ({}),
	invoiceType: "Invoice",
	loading: false,
});

defineEmits<{
	(e: "back"): void;
}>();

const __ = (window as any).__ || ((s: string) => s);
</script>

<style scoped>
.payment-screen-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	background: var(--pos-card-bg, var(--pos-surface-raised, #ffffff));
	border-bottom: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	min-height: 56px;
}

.payment-screen-header__leading {
	display: flex;
	align-items: center;
	gap: 12px;
}

.payment-screen-header__back-btn {
	color: var(--pos-text-primary, #0f172a) !important;
	border-radius: var(--pos-radius-sm, 8px);
}

.payment-screen-header__title-group {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.payment-screen-header__title {
	margin: 0;
	font-size: 1.125rem;
	font-weight: 700;
	line-height: 1.25;
	color: var(--pos-text-primary, #0f172a);
}

.payment-screen-header__subtitle {
	margin: 0;
	font-size: 0.8125rem;
	font-weight: 500;
	color: var(--pos-text-secondary, #64748b);
}

.payment-screen-header__trailing {
	display: flex;
	align-items: center;
	gap: 8px;
}

.payment-screen-header__badge {
	font-weight: 600;
}
</style>
