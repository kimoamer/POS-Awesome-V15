<template>
	<v-dialog
		:model-value="modelValue"
		:fullscreen="viewportMode === 'phone'"
		:width="viewportMode === 'phone' ? undefined : dialogWidth"
		:transition="viewportMode === 'phone' ? 'dialog-bottom-transition' : 'dialog-transition'"
		@update:model-value="$emit('update:modelValue', $event)"
	>
		<v-card class="gift-card-dialog" :class="[`gift-card-dialog--${viewportMode}`]">
			<!-- Dialog Header -->
			<div class="gift-card-dialog__header">
				<div class="gift-card-dialog__header-copy">
					<h3 class="gift-card-dialog__title">{{ __("Gift Card") }}</h3>
					<span class="gift-card-dialog__subtitle">
						{{ __("Scan or enter code to check balance or redeem") }}
					</span>
				</div>
				<v-btn
					icon="mdi-close"
					variant="text"
					density="compact"
					class="dialog-close-btn"
					:aria-label="__('Close')"
					@click="$emit('update:modelValue', false)"
				></v-btn>
			</div>

			<v-card-text class="gift-card-dialog__content">
				<!-- Mode Selection for Supervisors -->
				<div v-if="isSupervisor" class="gift-card-dialog__modes">
					<v-btn
						:variant="mode === 'issue' ? 'flat' : 'tonal'"
						:color="mode === 'issue' ? 'primary' : undefined"
						class="dialog-action-btn"
						@click="$emit('set-mode', 'issue')"
					>
						{{ __("Issue New Card") }}
					</v-btn>
					<v-btn
						:variant="mode === 'top_up' ? 'flat' : 'tonal'"
						:color="mode === 'top_up' ? 'primary' : undefined"
						class="dialog-action-btn"
						@click="$emit('set-mode', 'top_up')"
					>
						{{ __("Top Up Card") }}
					</v-btn>
					<v-btn
						:variant="mode === 'redeem' ? 'flat' : 'tonal'"
						:color="mode === 'redeem' ? 'primary' : undefined"
						class="dialog-action-btn"
						@click="$emit('set-mode', 'redeem')"
					>
						{{ __("Redeem") }}
					</v-btn>
				</div>

				<!-- Gift Card Code Field -->
				<v-text-field
					:model-value="cardCode"
					:label="__('Gift Card Code')"
					variant="outlined"
					density="compact"
					hide-details
					class="sleek-field pos-themed-input"
					@update:model-value="$emit('update:cardCode', $event)"
				/>

				<!-- Status & Balance Stats -->
				<div class="gift-card-dialog__stats">
					<div class="gift-card-dialog__stat">
						<span>{{ __("Status") }}</span>
						<strong>{{ status || __("Unknown") }}</strong>
					</div>
					<div class="gift-card-dialog__stat">
						<span>{{ __("Balance") }}</span>
						<strong>{{ balance }}</strong>
					</div>
					<div class="gift-card-dialog__stat">
						<span>{{ mode === "redeem" ? __("Applying") : __("Amount") }}</span>
						<strong>{{ redeemAmountDisplay }}</strong>
					</div>
				</div>

				<!-- Amount Input Field -->
				<v-text-field
					v-if="mode === 'redeem'"
					:model-value="redeemAmount"
					:label="__('Redeem Amount')"
					variant="outlined"
					density="compact"
					hide-details
					class="sleek-field pos-themed-input"
					@update:model-value="$emit('update:redeemAmount', $event)"
				/>

				<v-text-field
					v-else
					:model-value="redeemAmount"
					:label="mode === 'issue' ? __('Initial Amount') : __('Top Up Amount')"
					variant="outlined"
					density="compact"
					hide-details
					class="sleek-field pos-themed-input"
					@update:model-value="$emit('update:redeemAmount', $event)"
				/>

				<p v-if="errorMessage" class="gift-card-dialog__error">{{ errorMessage }}</p>
			</v-card-text>

			<v-card-actions class="gift-card-dialog__actions">
				<v-btn variant="outlined" class="dialog-action-btn" @click="$emit('update:modelValue', false)">
					{{ __("Close") }}
				</v-btn>
				<v-btn variant="tonal" class="dialog-action-btn" :disabled="loading" @click="$emit('check-balance')">
					{{ __("Check Balance") }}
				</v-btn>
				<v-btn
					v-if="mode === 'redeem'"
					color="primary"
					variant="flat"
					class="dialog-action-btn"
					:disabled="loading"
					@click="$emit('apply-redemption')"
				>
					{{ __("Apply Redemption") }}
				</v-btn>
				<v-btn
					v-else-if="mode === 'issue'"
					color="primary"
					variant="flat"
					class="dialog-action-btn"
					:disabled="loading"
					@click="$emit('issue-card')"
				>
					{{ __("Issue New Card") }}
				</v-btn>
				<v-btn
					v-else
					color="primary"
					variant="flat"
					class="dialog-action-btn"
					:disabled="loading"
					@click="$emit('top-up-card')"
				>
					{{ __("Top Up Card") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	viewportMode: {
		type: String,
		default: "desktop",
	},
	cardCode: {
		type: String,
		default: "",
	},
	redeemAmount: {
		type: [Number, String],
		default: 0,
	},
	balance: {
		type: [Number, String],
		default: 0,
	},
	status: {
		type: String,
		default: "",
	},
	isSupervisor: {
		type: Boolean,
		default: false,
	},
	loading: {
		type: Boolean,
		default: false,
	},
	mode: {
		type: String,
		default: "redeem",
	},
	errorMessage: {
		type: String,
		default: "",
	},
});

defineEmits([
	"update:modelValue",
	"update:cardCode",
	"update:redeemAmount",
	"set-mode",
	"check-balance",
	"apply-redemption",
	"issue-card",
	"top-up-card",
]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const dialogWidth = computed(() => {
	if (props.viewportMode === "tablet-landscape") return "min(640px, calc(100vw - 24px))";
	if (props.viewportMode === "tablet-portrait") return "min(600px, calc(100vw - 24px))";
	return "min(520px, calc(100vw - 24px))";
});

const redeemAmountDisplay = computed(() => {
	const amount = props.redeemAmount;
	return amount === null || amount === undefined || amount === "" ? "0" : String(amount);
});
</script>

<style scoped>
.gift-card-dialog {
	display: flex;
	flex-direction: column;
	background: var(--pos-surface-raised, #ffffff);
	border-radius: var(--payment-radius-md, 10px);
}

.gift-card-dialog--phone {
	height: 100dvh;
	border-radius: 0;
}

.gift-card-dialog__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--payment-space-3, 12px) var(--payment-space-4, 16px);
	border-bottom: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	min-height: 54px;
}

.gift-card-dialog__title {
	margin: 0;
	font-size: var(--payment-font-section, 14px);
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
}

.gift-card-dialog__subtitle {
	font-size: var(--payment-font-caption, 11px);
	color: var(--pos-text-secondary, #64748b);
}

.gift-card-dialog__content {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-3, 12px);
	padding: var(--payment-space-4, 16px);
	overflow-y: auto;
	flex: 1;
}

.gift-card-dialog__modes {
	display: flex;
	flex-wrap: wrap;
	gap: var(--payment-space-2, 8px);
}

.gift-card-dialog__stats {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: var(--payment-space-2, 8px);
}

.gift-card-dialog__stat {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 8px 10px;
	border-radius: var(--payment-radius-sm, 8px);
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
}

.gift-card-dialog__stat span {
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	color: var(--pos-text-secondary, #64748b);
}

.gift-card-dialog__stat strong {
	font-size: var(--payment-font-body, 13px);
	color: var(--pos-text-primary, #0f172a);
}

.gift-card-dialog__actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-3, 12px) var(--payment-space-4, 16px);
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
}

.dialog-action-btn {
	min-height: 40px;
}

.gift-card-dialog--tablet-portrait .dialog-action-btn,
.gift-card-dialog--tablet-landscape .dialog-action-btn {
	min-height: 42px;
}

.gift-card-dialog--phone .dialog-action-btn {
	min-height: 44px;
}

.gift-card-dialog__error {
	margin: 0;
	font-size: 11px;
	font-weight: 600;
	color: rgb(220, 38, 38);
}

@media (max-width: 599px) {
	.gift-card-dialog__stats {
		grid-template-columns: 1fr;
	}

	.gift-card-dialog__actions {
		flex-direction: column;
		align-items: stretch;
	}
}
</style>
