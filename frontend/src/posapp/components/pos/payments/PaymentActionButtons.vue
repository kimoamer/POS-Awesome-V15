<template>
	<div v-if="viewportMode === 'phone'" class="payment-action-buttons payment-action-buttons--phone">
		<v-menu location="top start">
			<template v-slot:activator="{ props: menuProps }">
				<v-btn
					icon
					variant="outlined"
					class="payment-more-btn payment-footer-btn"
					v-bind="menuProps"
					:disabled="loading"
					aria-label="More actions"
				>
					<v-icon size="20">mdi-dots-vertical</v-icon>
				</v-btn>
			</template>
			<v-list density="compact" class="pa-1">
				<v-list-item
					link
					:disabled="loading || validatePayment"
					@click="$emit('submit-and-print')"
				>
					<template v-slot:prepend>
						<v-icon size="18" color="success">mdi-printer</v-icon>
					</template>
					<v-list-item-title class="font-weight-bold">
						{{ __("Submit & Print") }}
					</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-btn
			color="error"
			variant="flat"
			class="payment-cancel-btn payment-footer-btn"
			data-pos-keyboard-target="payment-cancel"
			:disabled="loading"
			:aria-disabled="loading"
			@click="!loading && $emit('cancel')"
		>
			{{ __("Cancel") }}
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
	</div>

	<div v-else :class="['payment-action-buttons', `payment-action-buttons--${viewportMode}`, { compact }]">
		<v-btn
			color="error"
			variant="flat"
			class="payment-cancel-btn payment-footer-btn"
			data-pos-keyboard-target="payment-cancel"
			:disabled="loading"
			:aria-disabled="loading"
			@click="!loading && $emit('cancel')"
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
	viewportMode: {
		type: String,
		default: "desktop",
	},
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

.payment-action-buttons--phone {
	grid-template-columns: 44px minmax(86px, 0.8fr) minmax(0, 1.5fr);
	gap: 6px;
}

.payment-more-btn {
	min-width: 44px !important;
	min-height: 44px !important;
	border-radius: var(--payment-radius-sm, 8px) !important;
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
</style>
