<!-- eslint-disable vue/multi-word-component-names -->
<template>
	<div class="pay-action-buttons-container mt-2">
		<!-- Auto Allocate Toggle -->
		<div class="auto-allocate-row mb-2">
			<v-switch
				:model-value="autoAllocatePaymentAmount"
				color="primary"
				hide-details
				inset
				density="compact"
				:label="__('Auto Allocate Payment Amount')"
				data-test="auto-allocate-payment-toggle"
				class="auto-allocate-switch"
				@update:model-value="$emit('update:auto-allocate-payment-amount', Boolean($event))"
			/>
		</div>

		<!-- Submit / Submit & Print -->
		<v-row dense class="mb-1">
			<v-col cols="7" class="pr-1">
				<v-btn
					block
					height="40"
					class="btn-submit-payment font-weight-bold"
					@click="$emit('submit')"
					:disabled="disabled || loading"
					:loading="loading"
				>
					{{ __("Submit Payment") }}
				</v-btn>
			</v-col>
			<v-col cols="5" class="pl-1">
				<v-btn
					block
					height="40"
					variant="outlined"
					class="btn-submit-print font-weight-bold"
					prepend-icon="mdi-printer-outline"
					@click="$emit('submit-and-print')"
					:disabled="disabled || loading"
					:loading="loading"
				>
					{{ __("Submit & Print") }}
				</v-btn>
			</v-col>
		</v-row>

		<!-- Share Last Payment -->
		<v-btn
			block
			height="36"
			class="btn-share-payment font-weight-bold"
			prepend-icon="mdi-share-variant-outline"
			@click="$emit('share-last-payment')"
			:disabled="disabled || loading || shareLoading"
			:loading="shareLoading"
		>
			{{ __("Share Last Payment") }}
		</v-btn>
	</div>
</template>

<script setup>
const __ = (text) => (window.__ ? window.__(text) : text);

defineProps({
	loading: Boolean,
	disabled: Boolean,
	shareLoading: Boolean,
	autoAllocatePaymentAmount: {
		type: Boolean,
		default: true,
	},
});

defineEmits(["submit", "submit-and-print", "share-last-payment", "update:auto-allocate-payment-amount"]);
</script>

<style scoped>
.pay-action-buttons-container {
	width: 100%;
}

.auto-allocate-row {
	background: var(--pos-surface-muted, #f8fafc);
	border: 1px solid var(--pos-border-light, #e2e8f0);
	border-radius: 8px;
	padding: 4px 10px 4px 6px;
	display: flex;
	align-items: center;
}

.auto-allocate-switch :deep(.v-label) {
	font-size: 12.5px !important;
	font-weight: 600 !important;
	color: #475569 !important;
	opacity: 1 !important;
}

.auto-allocate-switch :deep(.v-switch__track) {
	height: 16px !important;
	min-width: 32px !important;
}

.auto-allocate-switch :deep(.v-switch__thumb) {
	width: 12px !important;
	height: 12px !important;
}

.btn-submit-payment {
	background: #008080 !important;
	color: #ffffff !important;
	border-radius: 8px !important;
	font-size: 12.5px !important;
	text-transform: none !important;
	box-shadow: 0 2px 6px rgba(0, 128, 128, 0.25) !important;
	letter-spacing: 0.01em;
}

.btn-submit-print {
	border-color: #cbd5e1 !important;
	color: #334155 !important;
	border-radius: 8px !important;
	font-size: 12px !important;
	text-transform: none !important;
	background: #ffffff !important;
}

.btn-share-payment {
	background: #e0f2fe !important;
	color: #0284c7 !important;
	border-radius: 8px !important;
	font-size: 12px !important;
	text-transform: none !important;
	border: 1px solid #bae6fd !important;
}
</style>
