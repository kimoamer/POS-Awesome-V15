<template>
	<div v-if="enabled" class="gift-card-entry">
		<div class="gift-card-entry__summary">
			<div class="gift-card-entry__copy">
				<div class="gift-card-entry__label-row">
					<p class="gift-card-entry__label">{{ __("Gift Card") }}</p>
					<span
						class="gift-card-entry__state"
						:class="{ 'gift-card-entry__state--applied': appliedAmount > 0 }"
					>
						{{ appliedAmount > 0 ? __("Applied") : __("Ready") }}
					</span>
				</div>
				<h4 class="gift-card-entry__title">{{ __("Gift card payment") }}</h4>
				<p class="gift-card-entry__subtitle">
					<template v-if="appliedAmount > 0">
						{{ __("Applied") }} {{ formatCurrency(appliedAmount) }} {{ __("from") }}
						{{ cardCode || __("gift card") }}
					</template>
					<template v-else>
						{{ __("Tap the button below to redeem a gift card during checkout.") }}
					</template>
				</p>
				<div class="gift-card-entry__meta">
					<span class="gift-card-entry__meta-pill">{{ __("Scan-First Flow") }}</span>
					<span v-if="cardCode" class="gift-card-entry__meta-pill gift-card-entry__meta-pill--code">
						{{ cardCode }}
					</span>
				</div>
			</div>
			<div class="gift-card-entry__actions">
				<v-btn data-test="gift-card-toggle" color="primary" variant="tonal" density="compact" @click="emit('toggle')">
					{{ expanded ? __("Hide Gift Card") : actionLabel }}
				</v-btn>
			</div>
		</div>

		<div v-if="expanded" class="gift-card-entry__editor">
			<div class="gift-card-entry__editor-fields">
				<v-text-field
					data-test="gift-card-code-input"
					:model-value="cardCode"
					:label="__('Gift Card Code')"
					hide-details="auto"
					variant="outlined"
					density="compact"
					class="sleek-field pos-themed-input"
					@update:model-value="emit('update:cardCode', $event)"
				/>
				<v-text-field
					data-test="gift-card-amount-input"
					:model-value="redeemAmount"
					:label="__('Amount')"
					type="number"
					hide-details="auto"
					variant="outlined"
					density="compact"
					class="sleek-field pos-themed-input"
					@update:model-value="emit('update:redeemAmount', $event)"
				/>
			</div>

			<div class="gift-card-entry__stats">
				<div class="gift-card-entry__stat">
					<span>{{ __("Balance") }}</span>
					<strong>{{ formatCurrency(balance || 0) }}</strong>
				</div>
				<div class="gift-card-entry__stat">
					<span>{{ __("Status") }}</span>
					<strong>{{ status || __("Not checked") }}</strong>
				</div>
			</div>

			<p v-if="errorMessage" class="gift-card-entry__error">{{ errorMessage }}</p>

			<div class="gift-card-entry__editor-actions">
				<v-btn
					data-test="gift-card-check-balance"
					variant="tonal"
					density="compact"
					:disabled="loading"
					@click="emit('check-balance')"
				>
					{{ __("Check Balance") }}
				</v-btn>
				<v-btn
					data-test="gift-card-apply"
					color="primary"
					variant="flat"
					density="compact"
					:disabled="loading"
					@click="emit('apply')"
				>
					{{ __("Apply Gift Card") }}
				</v-btn>
				<v-btn
					v-if="appliedAmount > 0"
					data-test="gift-card-clear"
					variant="text"
					density="compact"
					color="warning"
					@click="emit('clear')"
				>
					{{ __("Clear") }}
				</v-btn>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	enabled: {
		type: Boolean,
		default: false,
	},
	expanded: {
		type: Boolean,
		default: false,
	},
	appliedAmount: {
		type: Number,
		default: 0,
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
		type: Number,
		default: 0,
	},
	status: {
		type: String,
		default: "",
	},
	loading: {
		type: Boolean,
		default: false,
	},
	errorMessage: {
		type: String,
		default: "",
	},
	formatCurrency: {
		type: Function,
		required: true,
	},
});

const emit = defineEmits([
	"toggle",
	"clear",
	"check-balance",
	"apply",
	"update:cardCode",
	"update:redeemAmount",
]);

const __ = (s) => (typeof window !== "undefined" && (window.__ || window.frappe?._) ? (window.__ || window.frappe._)(s) : s);

const actionLabel = computed(() =>
	props.appliedAmount > 0 ? __("Edit Gift Application") : __("Apply Gift Card"),
);
</script>

<style scoped>
.gift-card-entry {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-3, 12px);
	border-radius: var(--payment-radius-md, 10px);
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	background: var(--pos-surface-raised, #ffffff);
}

.gift-card-entry__summary {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--payment-space-2, 8px);
}

.gift-card-entry__copy {
	min-width: 0;
}

.gift-card-entry__label-row {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 2px;
}

.gift-card-entry__label {
	margin: 0;
	font-size: var(--payment-font-caption, 11px);
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: var(--pos-text-secondary, #64748b);
}

.gift-card-entry__state,
.gift-card-entry__meta-pill {
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 10px;
	font-weight: 700;
}

.gift-card-entry__state {
	background: rgba(37, 99, 235, 0.08);
	color: var(--pos-text-secondary, #64748b);
}

.gift-card-entry__state--applied {
	background: rgba(34, 197, 94, 0.12);
	color: rgb(34, 197, 94);
}

.gift-card-entry__title {
	margin: 0;
	font-size: var(--payment-font-section, 13px);
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
}

.gift-card-entry__subtitle {
	margin: 2px 0 0;
	font-size: var(--payment-font-caption, 11px);
	color: var(--pos-text-secondary, #64748b);
}

.gift-card-entry__meta {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: 6px;
}

.gift-card-entry__meta-pill {
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.04));
	color: var(--pos-text-secondary, #64748b);
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
}

.gift-card-entry__meta-pill--code {
	color: var(--pos-text-primary, #0f172a);
}

.gift-card-entry__actions,
.gift-card-entry__editor-actions {
	display: flex;
	flex-wrap: wrap;
	gap: var(--payment-space-2, 8px);
}

.gift-card-entry__actions {
	justify-content: flex-end;
}

.gift-card-entry__editor {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2, 8px);
	padding-top: var(--payment-space-2, 8px);
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
}

.gift-card-entry__editor-fields,
.gift-card-entry__stats {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--payment-space-2, 8px);
}

.gift-card-entry__stat {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 8px 10px;
	border-radius: var(--payment-radius-sm, 8px);
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
}

.gift-card-entry__stat span {
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	color: var(--pos-text-secondary, #64748b);
}

.gift-card-entry__stat strong {
	font-size: 13px;
	color: var(--pos-text-primary, #0f172a);
}

.gift-card-entry__error {
	margin: 0;
	font-size: 11px;
	font-weight: 600;
	color: rgb(220, 38, 38);
}

@media (max-width: 599px) {
	.gift-card-entry__summary {
		flex-direction: column;
		align-items: stretch;
	}

	.gift-card-entry__editor-fields,
	.gift-card-entry__stats {
		grid-template-columns: 1fr;
	}
}
</style>
