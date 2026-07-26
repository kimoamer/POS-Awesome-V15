<template>
	<div class="payment-dialogs">
		<!-- Custom Days Dialog -->
		<v-dialog
			:model-value="customDaysDialog"
			width="min(360px, calc(100vw - 24px))"
			:retain-focus="false"
			@update:model-value="$emit('update:customDaysDialog', $event)"
		>
			<v-card class="rounded-lg">
				<v-card-title class="pa-4 pb-2 text-h6 font-weight-bold text-primary">
					{{ __("Custom Due Days") }}
				</v-card-title>
				<v-card-text class="pa-4 pt-2">
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
				</v-card-text>
				<v-card-actions class="pa-4 pt-0">
					<v-spacer></v-spacer>
					<v-btn variant="outlined" color="error" density="compact" @click="$emit('update:customDaysDialog', false)">
						{{ __("Close") }}
					</v-btn>
					<v-btn color="primary" variant="flat" density="compact" @click="$emit('apply-custom-days')">
						{{ __("Apply") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Phone Payment Dialog -->
		<v-dialog
			:model-value="phoneDialog"
			width="min(400px, calc(100vw - 24px))"
			:retain-focus="false"
			@update:model-value="$emit('update:phoneDialog', $event)"
		>
			<v-card v-if="invoiceDoc" class="rounded-lg">
				<v-card-title class="pa-4 pb-2">
					<span class="text-h6 font-weight-bold text-primary">{{ __("Confirm Mobile Number") }}</span>
				</v-card-title>
				<v-card-text class="pa-4 pt-2">
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
				</v-card-text>
				<v-card-actions class="pa-4 pt-0">
					<v-spacer></v-spacer>
					<v-btn variant="outlined" color="error" density="compact" @click="$emit('update:phoneDialog', false)">
						{{ __("Close") }}
					</v-btn>
					<v-btn color="primary" variant="flat" density="compact" @click="$emit('request-payment')">
						{{ __("Request") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup>
defineProps({
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
.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}
</style>
