<template>
	<div class="payment-dialogs">
		<!-- Custom Days Dialog -->
		<v-dialog
			:model-value="customDaysDialog"
			:fullscreen="viewportMode === 'phone'"
			:width="viewportMode === 'phone' ? undefined : 'min(360px, calc(100vw - 24px))'"
			:retain-focus="false"
			@update:model-value="$emit('update:customDaysDialog', $event)"
		>
			<v-card class="payment-dialog" :class="[`payment-dialog--${viewportMode}`]">
				<div class="payment-dialog__header">
					<h3 class="payment-dialog__title">{{ __("Custom Due Days") }}</h3>
					<v-btn
						icon="mdi-close"
						variant="text"
						density="compact"
						class="payment-dialog__close"
						:aria-label="__('Close')"
						@click="$emit('update:customDaysDialog', false)"
					></v-btn>
				</div>

				<div class="payment-dialog__body">
					<v-text-field
						density="compact"
						variant="outlined"
						type="number"
						min="0"
						max="365"
						class="sleek-field pos-themed-input"
						:model-value="customDaysValue"
						:label="__('Days')"
						hide-details
						@update:model-value="$emit('update:customDaysValue', parseFloat($event))"
					></v-text-field>
				</div>

				<div class="payment-dialog__footer">
					<v-btn variant="outlined" class="dialog-action-btn" @click="$emit('update:customDaysDialog', false)">
						{{ __("Close") }}
					</v-btn>
					<v-btn color="primary" variant="flat" class="dialog-action-btn" @click="$emit('apply-custom-days')">
						{{ __("Apply") }}
					</v-btn>
				</div>
			</v-card>
		</v-dialog>

		<!-- Phone Payment Dialog -->
		<v-dialog
			:model-value="phoneDialog"
			:fullscreen="viewportMode === 'phone'"
			:width="viewportMode === 'phone' ? undefined : 'min(400px, calc(100vw - 24px))'"
			:retain-focus="false"
			@update:model-value="$emit('update:phoneDialog', $event)"
		>
			<v-card v-if="invoiceDoc" class="payment-dialog" :class="[`payment-dialog--${viewportMode}`]">
				<div class="payment-dialog__header">
					<h3 class="payment-dialog__title">{{ __("Confirm Mobile Number") }}</h3>
					<v-btn
						icon="mdi-close"
						variant="text"
						density="compact"
						class="payment-dialog__close"
						:aria-label="__('Close')"
						@click="$emit('update:phoneDialog', false)"
					></v-btn>
				</div>

				<div class="payment-dialog__body">
					<v-text-field
						density="compact"
						variant="outlined"
						color="primary"
						:label="__('Mobile Number')"
						class="sleek-field pos-themed-input"
						hide-details
						v-model="invoiceDoc.contact_mobile"
						type="number"
					></v-text-field>
				</div>

				<div class="payment-dialog__footer">
					<v-btn variant="outlined" class="dialog-action-btn" @click="$emit('update:phoneDialog', false)">
						{{ __("Close") }}
					</v-btn>
					<v-btn color="primary" variant="flat" class="dialog-action-btn" @click="$emit('request-payment')">
						{{ __("Request") }}
					</v-btn>
				</div>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup>
defineProps({
	viewportMode: {
		type: String,
		default: "desktop",
	},
	customDaysDialog: {
		type: Boolean,
		default: false,
	},
	customDaysValue: {
		type: Number,
		default: null,
	},
	phoneDialog: {
		type: Boolean,
		default: false,
	},
	invoiceDoc: {
		type: Object,
		required: true,
	},
});

defineEmits([
	"update:customDaysDialog",
	"update:customDaysValue",
	"apply-custom-days",
	"update:phoneDialog",
	"request-payment",
]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);
</script>

<style scoped>
.payment-dialog {
	display: flex;
	flex-direction: column;
	background: var(--pos-surface-raised, #ffffff);
	border-radius: var(--payment-radius-md, 10px);
}

.payment-dialog--phone {
	height: 100dvh;
	border-radius: 0;
}

.payment-dialog__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--payment-space-3, 12px) var(--payment-space-4, 16px);
	border-bottom: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	min-height: 54px;
}

.payment-dialog__title {
	margin: 0;
	font-size: var(--payment-font-section, 14px);
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
}

.payment-dialog__close {
	width: 40px;
	min-width: 40px;
	height: 40px;
}

.payment-dialog--tablet-portrait .payment-dialog__close,
.payment-dialog--tablet-landscape .payment-dialog__close {
	width: 42px;
	min-width: 42px;
	height: 42px;
}

.payment-dialog--phone .payment-dialog__close {
	width: 44px;
	min-width: 44px;
	height: 44px;
}

.payment-dialog__body {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-3, 12px);
	padding: var(--payment-space-4, 16px);
	flex: 1;
}

.payment-dialog__footer {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-3, 12px) var(--payment-space-4, 16px);
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
}

.dialog-action-btn {
	min-height: 40px;
}

.payment-dialog--tablet-portrait .dialog-action-btn,
.payment-dialog--tablet-landscape .dialog-action-btn {
	min-height: 42px;
}

.payment-dialog--phone .dialog-action-btn {
	min-height: 44px;
}

.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}

@media (max-width: 599px) {
	.payment-dialog__footer {
		flex-direction: column;
		align-items: stretch;
	}

	.payment-dialog--phone .payment-dialog__footer {
		padding-bottom: max(var(--payment-space-3, 12px), env(safe-area-inset-bottom));
	}
}
</style>
