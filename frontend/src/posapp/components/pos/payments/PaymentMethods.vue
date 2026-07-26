<template>
	<div v-if="payments && payments.length" class="payment-methods">
		<div v-for="payment in payments" :key="payment.name" class="payment-method-card">
			<div class="payment-method-card__header">
				<div class="payment-method-card__identity">
					<span class="payment-method-card__icon-box">
						<v-icon size="16">{{ getPaymentMethodIcon(payment) }}</v-icon>
					</span>
					<div>
						<p class="payment-method-card__label">{{ __("Method") }}</p>
						<h4 class="payment-method-card__title">{{ payment.mode_of_payment }}</h4>
					</div>
				</div>
				<div class="payment-method-card__badges">
					<span
						v-if="isReturn"
						class="payment-method-card__badge payment-method-card__badge--refund"
					>
						{{ __("Refund") }}
					</span>
					<span v-if="payment.default === 1" class="payment-method-card__badge">
						{{ __("Default") }}
					</span>
				</div>
			</div>

			<div class="payment-method-card__main" v-if="!isMpesaC2bPayment(payment)">
				<div class="payment-method-card__amount">
					<v-text-field
						data-pos-keyboard-target="payment-amount"
						density="compact"
						variant="outlined"
						:color="isReturn ? 'error' : 'primary'"
						:label="__('Amount')"
						:class="['sleek-field pos-themed-input', isReturn ? 'pos-themed-input--refund' : '']"
						hide-details
						:model-value="payment.amount"
						type="number"
						inputmode="decimal"
						@change="$emit('update-amount', payment, $event)"
						:rules="[isNumber]"
						:prefix="currencySymbol(currency)"
						@focus="$emit('set-rest-amount', payment, isReturn)"
						@keydown.enter="blurTarget"
						@keydown.esc="blurTarget"
						:readonly="isGiftCardPayment(payment)"
					></v-text-field>
				</div>

				<div class="payment-method-card__primary-action">
					<v-btn
						block
						color="primary"
						variant="flat"
						class="payment-method-action-btn"
						data-pos-keyboard-target="payment-action"
						:data-test="`payment-method-action-${payment.mode_of_payment}`"
						@click="handlePrimaryAction(payment)"
					>
						{{ isGiftCardPayment(payment) ? __("Redeem / Scan") : __("Set Remaining") }}
					</v-btn>
				</div>
			</div>

			<div
				v-if="
					payment.default === 1 &&
					isCashLikePayment(payment) &&
					getVisibleDenominations(payment).length
				"
				class="payment-denominations"
			>
				<v-btn
					v-for="d in getVisibleDenominations(payment)"
					:key="d"
					size="small"
					color="secondary"
					variant="tonal"
					class="payment-denominations__btn"
					data-pos-keyboard-target="payment-denomination"
					@click="$emit('set-denomination', payment, d)"
				>
					{{ formatCurrency(d) }}
				</v-btn>
			</div>

			<div v-if="isMpesaC2bPayment(payment)" class="payment-method-card__extra-action">
				<v-btn
					block
					color="success"
					variant="flat"
					class="payment-method-action-btn payment-method-action-btn--success"
					data-pos-keyboard-target="payment-action"
					@click="$emit('mpesa-dialog', payment)"
				>
					{{ __("Get Payments") }}
				</v-btn>
			</div>

			<div
				v-if="payment.type === 'Phone' && payment.amount > 0 && requestPaymentField"
				class="payment-method-card__extra-action"
			>
				<v-btn
					block
					color="success"
					variant="flat"
					class="payment-method-action-btn payment-method-action-btn--success"
					data-pos-keyboard-target="payment-action"
					@click="$emit('request-payment', payment)"
				>
					{{ __("Request Payment") }}
				</v-btn>
			</div>
		</div>
	</div>
</template>

<script setup>
const __ = (s) =>
	typeof window !== "undefined" && (window.__ || window.frappe?._)
		? (window.__ || window.frappe._)(s)
		: s;

function getPaymentMethodIcon(payment) {
	const type = String(payment?.type || payment?.mode_of_payment || "").toLowerCase();
	if (type.includes("cash")) return "mdi-cash";
	if (type.includes("card") || type.includes("credit")) return "mdi-credit-card-outline";
	if (type.includes("phone") || type.includes("mpesa") || type.includes("mobile")) return "mdi-cellphone";
	if (type.includes("bank")) return "mdi-bank-outline";
	if (type.includes("gift")) return "mdi-gift-outline";
	return "mdi-wallet-outline";
}

const props = defineProps({
	payments: Array,
	currency: String,
	isReturn: Boolean,
	requestPaymentField: Boolean,
	currencySymbol: Function,
	formatCurrency: Function,
	isNumber: Function,
	getVisibleDenominations: Function,
	isCashLikePayment: Function,
	isMpesaC2bPayment: Function,
	isGiftCardPayment: {
		type: Function,
		default: () => false,
	},
	viewportMode: {
		type: String,
		default: "desktop",
	},
});

const emit = defineEmits([
	"update-amount",
	"set-full-amount",
	"set-denomination",
	"mpesa-dialog",
	"request-payment",
	"set-rest-amount",
	"open-gift-card",
]);

const blurTarget = (event) => {
	const target = event?.target;
	if (target && typeof target.blur === "function") {
		target.blur();
	}
};

const handlePrimaryAction = (payment) => {
	if (props.isGiftCardPayment(payment)) {
		emit("open-gift-card", payment);
		return;
	}
	emit("set-full-amount", payment);
};
</script>

<style scoped>
.payment-methods {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2, 8px);
}

.payment-method-card {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-2, 8px);
	background: var(--pos-card-bg, var(--pos-surface-raised, #ffffff));
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	border-radius: var(--payment-radius-md, 10px);
	box-shadow: none;
}

.payment-method-card__header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: var(--payment-space-2, 8px);
}

.payment-method-card__identity {
	display: flex;
	align-items: center;
	gap: var(--payment-space-2, 8px);
}

.payment-method-card__icon-box {
	width: 28px;
	height: 28px;
	flex: 0 0 28px;
	display: grid;
	place-items: center;
	border-radius: var(--payment-radius-sm, 8px);
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 9%, transparent);
	color: var(--pos-primary, #2563eb);
}

.payment-method-card__label {
	margin: 0 0 2px;
	font-size: var(--payment-font-caption, 11px);
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--pos-text-secondary, #64748b);
}

.payment-method-card__title {
	margin: 0;
	font-size: var(--payment-font-section, 13px);
	line-height: 1.2;
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
}

.payment-method-card__badges {
	display: flex;
	gap: 4px;
	align-items: center;
	flex-wrap: wrap;
	justify-content: flex-end;
}

.payment-method-card__badge {
	padding: 3px 7px;
	border-radius: 999px;
	background: rgba(var(--v-theme-primary, 37, 99, 235), 0.12);
	color: rgb(var(--v-theme-primary, 37, 99, 235));
	font-size: 10px;
	font-weight: 700;
	white-space: nowrap;
}

.payment-method-card__badge--refund {
	background: rgba(var(--v-theme-error, 220, 38, 38), 0.12);
	color: rgb(var(--v-theme-error, 220, 38, 38));
}

.payment-method-card__main {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(128px, 0.34fr);
	gap: var(--payment-space-2, 8px);
	align-items: center;
}

:deep(.payment-shell--phone) .payment-method-card__main,
:deep(.payment-shell--tablet-portrait) .payment-method-card__main {
	grid-template-columns: 1fr;
}

.payment-method-card__amount {
	min-width: 0;
}

.payment-method-card__primary-action,
.payment-method-card__extra-action {
	width: 100%;
}

.payment-method-action-btn {
	--v-theme-overlay-multiplier: 0 !important;
	min-height: 40px;
	border-radius: var(--payment-radius-sm, 8px);
	font-weight: 700;
	text-transform: none;
	letter-spacing: 0.01em;
	background-color: rgb(var(--v-theme-primary, 37, 99, 235)) !important;
	color: #ffffff !important;
}

.payment-method-action-btn--success {
	background-color: rgb(var(--v-theme-success, 22, 163, 74)) !important;
}

.payment-denominations {
	display: flex;
	flex-wrap: wrap;
	gap: var(--payment-space-1, 4px);
	padding-top: var(--payment-space-1, 4px);
}

.payment-denominations__btn {
	min-height: 32px;
	font-size: 11px;
	font-weight: 600;
	border-radius: var(--payment-radius-sm, 8px);
}
</style>
