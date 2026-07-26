<template>
	<div :class="['payment-action-buttons', { compact }]">
		<v-btn
			color="error"
			variant="flat"
			class="payment-cancel-btn payment-footer-btn"
			data-pos-keyboard-target="payment-cancel"
			@click="$emit('cancel')"
		>
			{{ __("Cancel Payment") }}
		</v-btn>

		<v-btn
			ref="submitButton"
			color="primary"
			variant="flat"
			class="payment-submit-btn payment-footer-btn"
			data-pos-keyboard-target="payment-submit"
			@click="$emit('submit')"
			:loading="loading"
			:disabled="loading || validatePayment"
			:class="{ 'submit-highlight': highlightSubmit }"
		>
			{{ __("Submit") }}
		</v-btn>

		<v-btn
			color="success"
			variant="flat"
			class="payment-submit-print-btn payment-footer-btn"
			data-pos-keyboard-target="payment-submit-print"
			@click="$emit('submit-and-print')"
			:loading="loading"
			:disabled="loading || validatePayment"
		>
			{{ __("Submit & Print") }}
		</v-btn>
	</div>
</template>

<script setup>
defineProps({
	loading: Boolean,
	validatePayment: Boolean,
	highlightSubmit: Boolean,
	compact: Boolean,
});

defineEmits(["submit", "submit-and-print", "cancel"]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);
</script>

<style scoped>
.payment-action-buttons {
	width: 100%;
	display: grid;
	grid-template-columns: minmax(140px, 0.85fr) minmax(160px, 1fr) minmax(180px, 1.15fr);
	gap: 8px;
	align-items: center;
}

.compact :deep(.v-btn),
:deep(.compact .v-btn) {
	min-height: 40px;
}

.payment-footer-btn {
	--v-theme-overlay-multiplier: 0 !important;
	transition:
		box-shadow 0.18s ease,
		background-color 0.18s ease,
		transform 0.18s ease !important;
	color: #ffffff !important;
	min-height: 44px !important;
	font-weight: 600 !important;
}

.payment-submit-btn {
	background-color: rgb(var(--v-theme-primary)) !important;
}

.payment-submit-print-btn {
	background-color: rgb(var(--v-theme-success)) !important;
}

.payment-cancel-btn {
	background-color: rgb(var(--v-theme-error)) !important;
}

.payment-footer-btn:hover,
.payment-footer-btn:focus,
.payment-footer-btn:focus-visible,
.payment-footer-btn:active {
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18) !important;
	transform: translateY(-1px);
}

.payment-submit-btn:hover,
.payment-submit-btn:focus,
.payment-submit-btn:focus-visible,
.payment-submit-btn:active {
	background-color: rgba(var(--v-theme-primary), 0.9) !important;
}

.payment-submit-print-btn:hover,
.payment-submit-print-btn:focus,
.payment-submit-print-btn:focus-visible,
.payment-submit-print-btn:active {
	background-color: rgba(var(--v-theme-success), 0.9) !important;
}

.payment-cancel-btn:hover,
.payment-cancel-btn:focus,
.payment-cancel-btn:focus-visible,
.payment-cancel-btn:active {
	background-color: rgba(var(--v-theme-error), 0.9) !important;
}

.payment-footer-btn:active {
	transform: translateY(0);
}

:deep(.payment-footer-btn .v-btn__overlay),
:deep(.payment-footer-btn .v-btn__underlay) {
	opacity: 0 !important;
	background: transparent !important;
}

@media (max-width: 768px) {
	.payment-action-buttons {
		grid-template-columns: 1fr;
		gap: 6px;
	}

	.payment-footer-btn {
		font-size: 0.85rem !important;
		min-height: 40px !important;
	}
}
</style>
