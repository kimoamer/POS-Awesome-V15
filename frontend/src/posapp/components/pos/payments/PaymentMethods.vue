<template>
	<div class="payment-methods-container">
		<!-- Contextual Allocation Feedback Strip -->
		<div v-if="payments && payments.length" class="payment-allocation-strip" :class="allocationStatusClass">
			<div class="payment-allocation-strip__item">
				<span class="payment-allocation-strip__label">{{ __("Paid") }}</span>
				<span class="payment-allocation-strip__value">
					{{ renderMoney(totalPaid) }}
				</span>
			</div>
			<div class="payment-allocation-strip__divider"></div>
			<div class="payment-allocation-strip__item">
				<span class="payment-allocation-strip__label">{{ diffLabel || __("Remaining") }}</span>
				<span class="payment-allocation-strip__value font-weight-bold">
					{{ renderMoney(differenceAmount) }}
				</span>
			</div>
		</div>

		<!-- Payment Methods Panel List -->
		<div v-if="payments && payments.length" class="payment-methods-list">
			<article
				v-for="payment in payments"
				:key="payment.name"
				class="payment-method-card"
				:class="getPaymentMethodClasses(payment)"
			>
				<header class="payment-method-card__header">
					<div class="payment-method-card__identity">
						<span class="payment-method-card__icon-box">
							<v-icon size="16">{{ getPaymentMethodIcon(payment) }}</v-icon>
						</span>
						<div class="payment-method-card__copy">
							<span class="payment-method-card__eyebrow">{{ __("Payment Method") }}</span>
							<strong class="payment-method-card__title">{{ payment.mode_of_payment }}</strong>
						</div>
					</div>

					<div class="payment-method-card__badges">
						<span v-if="isReturn" class="payment-method-card__badge payment-method-card__badge--refund">
							<v-icon start size="10">mdi-cash-refund</v-icon>
							{{ __("Refund") }}
						</span>
						<span v-if="payment.default === 1" class="payment-method-card__badge payment-method-card__badge--default">
							<v-icon start size="10">mdi-star-outline</v-icon>
							{{ __("Default") }}
						</span>
					</div>
				</header>

				<!-- Main Input and Primary Action Row -->
				<div class="payment-method-card__main" v-if="!isMpesaC2bPayment(payment)">
					<div class="payment-method-card__amount">
						<v-text-field
							data-pos-keyboard-target="payment-amount"
							density="compact"
							variant="outlined"
							:color="isReturn ? 'error' : 'primary'"
							:placeholder="__('Amount')"
							:class="['sleek-field pos-themed-input', isReturn ? 'pos-themed-input--refund' : '']"
							hide-details
							:model-value="payment.amount"
							type="number"
							inputmode="decimal"
							:disabled="loading"
							:readonly="isGiftCardPayment(payment)"
							:prefix="currencySymbol(currency)"
							@change="$emit('update-amount', payment, $event)"
							:rules="[isNumber]"
							@focus="$emit('set-rest-amount', payment, isReturn)"
							@keydown.enter="blurTarget"
							@keydown.esc="blurTarget"
						>
							<template v-slot:append-inner v-if="payment.amount > 0 && !isGiftCardPayment(payment) && !loading">
								<v-btn
									icon
									variant="text"
									size="x-small"
									class="payment-clear-btn"
									:title="__('Clear Amount')"
									@click.stop="clearPaymentAmount(payment)"
								>
									<v-icon size="14">mdi-backspace-outline</v-icon>
								</v-btn>
							</template>
						</v-text-field>
					</div>

					<div class="payment-method-card__primary-action">
						<v-btn
							block
							color="primary"
							variant="flat"
							class="payment-method-action-btn"
							data-pos-keyboard-target="payment-action"
							:data-test="`payment-method-action-${payment.mode_of_payment}`"
							:disabled="loading"
							@click="handlePrimaryAction(payment)"
						>
							<v-icon start size="16">
								{{ isGiftCardPayment(payment) ? "mdi-qrcode-scan" : "mdi-calculator-variant-outline" }}
							</v-icon>
							{{ isGiftCardPayment(payment) ? __("Redeem / Scan") : __("Set Remaining") }}
						</v-btn>
					</div>
				</div>

				<!-- Quick Denomination Quick Buttons -->
				<div
					v-if="
						payment.default === 1 &&
						isCashLikePayment(payment) &&
						getVisibleDenominations(payment).length
					"
					class="payment-denominations"
				>
					<span class="payment-denominations__label">{{ __("Quick Add") }}:</span>
					<div class="payment-denominations__group">
						<v-btn
							v-for="d in getVisibleDenominations(payment)"
							:key="d"
							size="small"
							color="secondary"
							variant="tonal"
							class="payment-denominations__btn"
							data-pos-keyboard-target="payment-denomination"
							:disabled="loading"
							@click="$emit('set-denomination', payment, d)"
						>
							{{ d }}
						</v-btn>
					</div>
				</div>

				<!-- M-Pesa Mobile C2B Action -->
				<div v-if="isMpesaC2bPayment(payment)" class="payment-method-card__extra-action">
					<v-btn
						block
						color="success"
						variant="flat"
						class="payment-method-action-btn payment-method-action-btn--success"
						data-pos-keyboard-target="payment-action"
						:disabled="loading"
						@click="$emit('mpesa-dialog', payment)"
					>
						<v-icon start size="16">mdi-download-circle-outline</v-icon>
						{{ __("Get Payments") }}
					</v-btn>
				</div>

				<!-- Phone Request Payment Action -->
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
						:disabled="loading"
						@click="$emit('request-payment', payment)"
					>
						<v-icon start size="16">mdi-cellphone-arrow-down</v-icon>
						{{ __("Request Payment") }}
					</v-btn>
				</div>
			</article>
		</div>

		<!-- Premium Empty State -->
		<div v-else class="payment-methods-empty pa-6 text-center">
			<div class="payment-methods-empty__icon-box mb-2">
				<v-icon size="28" color="medium-emphasis">mdi-wallet-outline</v-icon>
			</div>
			<div class="text-subtitle-2 font-weight-bold text-high-emphasis">
				{{ __("No payment methods available") }}
			</div>
			<div class="text-caption text-medium-emphasis">
				{{ __("Check the active POS Profile payment methods.") }}
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";

const __ = (s) =>
	typeof window !== "undefined" && (window.__ || window.frappe?._)
		? (window.__ || window.frappe._)(s)
		: s;

const props = defineProps({
	payments: {
		type: Array,
		default: () => [],
	},
	currency: {
		type: String,
		default: "",
	},
	isReturn: {
		type: Boolean,
		default: false,
	},
	requestPaymentField: {
		type: Boolean,
		default: false,
	},
	currencySymbol: {
		type: Function,
		default: () => "$",
	},
	formatCurrency: {
		type: Function,
		default: (v) => v,
	},
	formatMoney: {
		type: Function,
		default: null,
	},
	isNumber: {
		type: Function,
		default: () => true,
	},
	getVisibleDenominations: {
		type: Function,
		default: () => [],
	},
	isCashLikePayment: {
		type: Function,
		default: () => false,
	},
	isMpesaC2bPayment: {
		type: Function,
		default: () => false,
	},
	isGiftCardPayment: {
		type: Function,
		default: () => false,
	},
	viewportMode: {
		type: String,
		default: "desktop",
	},
	totalPaid: {
		type: Number,
		default: 0,
	},
	differenceAmount: {
		type: Number,
		default: 0,
	},
	diffLabel: {
		type: String,
		default: "",
	},
	loading: {
		type: Boolean,
		default: false,
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

function getPaymentMethodIcon(payment) {
	const type = String(payment?.type || payment?.mode_of_payment || "").toLowerCase();
	if (type.includes("cash")) return "mdi-cash";
	if (type.includes("card") || type.includes("credit")) return "mdi-credit-card-outline";
	if (type.includes("phone") || type.includes("mpesa") || type.includes("mobile")) return "mdi-cellphone";
	if (type.includes("bank")) return "mdi-bank-outline";
	if (type.includes("gift")) return "mdi-gift-outline";
	return "mdi-wallet-outline";
}

function getPaymentMethodClasses(payment) {
	return {
		"payment-method-card--default": payment.default === 1,
		"payment-method-card--active": Math.abs(Number(payment.amount || 0)) > 0,
		"payment-method-card--refund": props.isReturn,
		"payment-method-card--gift": props.isGiftCardPayment(payment),
		"payment-method-card--mobile": props.isMpesaC2bPayment(payment),
	};
}

const allocationStatusClass = computed(() => {
	if (props.isReturn) return "payment-allocation-strip--refund";
	const diff = Number(props.differenceAmount || 0);
	if (diff === 0) return "payment-allocation-strip--balanced";
	if (diff < 0) return "payment-allocation-strip--overpaid";
	return "payment-allocation-strip--pending";
});

const renderMoney = (val) => {
	const num = Number(val || 0);
	const safeNum = Number.isFinite(num) ? num : 0;
	if (props.formatMoney) {
		return props.formatMoney(safeNum);
	}
	if (props.formatCurrency) {
		return props.formatCurrency(safeNum, props.currency);
	}
	return safeNum.toFixed(2);
};

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
	emit("set-full-amount", payment, props.isReturn);
};

const clearPaymentAmount = (payment) => {
	emit("update-amount", payment, 0);
};
</script>

<style scoped>
.payment-methods-container {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2, 8px);
}

/* Contextual Allocation Feedback Strip */
.payment-allocation-strip {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 10px;
	border-radius: var(--payment-radius-sm, 8px);
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
	font-size: 11px;
	transition: all 0.15s ease;
}

.payment-allocation-strip__item {
	display: flex;
	align-items: center;
	gap: 6px;
}

.payment-allocation-strip__label {
	color: var(--pos-text-secondary, #64748b);
	text-transform: uppercase;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.04em;
}

.payment-allocation-strip__value {
	font-variant-numeric: tabular-nums;
	color: var(--pos-text-primary, #0f172a);
}

.payment-allocation-strip__divider {
	width: 1px;
	height: 12px;
	background: var(--pos-border-light, rgba(0, 0, 0, 0.12));
}

.payment-allocation-strip--balanced {
	background: color-mix(in srgb, var(--v-theme-success, #16a34a) 8%, transparent);
	border-color: color-mix(in srgb, var(--v-theme-success, #16a34a) 25%, transparent);
}

.payment-allocation-strip--overpaid {
	background: color-mix(in srgb, var(--v-theme-info, #0284c7) 8%, transparent);
	border-color: color-mix(in srgb, var(--v-theme-info, #0284c7) 25%, transparent);
}

.payment-allocation-strip--refund {
	background: color-mix(in srgb, var(--v-theme-error, #dc2626) 8%, transparent);
	border-color: color-mix(in srgb, var(--v-theme-error, #dc2626) 25%, transparent);
}

/* Payment Methods List */
.payment-methods-list {
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
	transition: border-color 150ms ease, background-color 150ms ease;
}

.payment-method-card--active {
	border-color: color-mix(in srgb, var(--pos-primary, #2563eb) 30%, var(--pos-border-light, rgba(0, 0, 0, 0.08)));
}

.payment-method-card--refund {
	border-color: color-mix(in srgb, var(--v-theme-error, #dc2626) 30%, var(--pos-border-light, rgba(0, 0, 0, 0.08)));
}

.payment-method-card__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--payment-space-2, 8px);
}

.payment-method-card__identity {
	display: flex;
	align-items: center;
	gap: var(--payment-space-2, 8px);
	min-width: 0;
}

.payment-method-card__icon-box {
	width: var(--payment-icon-box, 28px);
	height: var(--payment-icon-box, 28px);
	flex: 0 0 var(--payment-icon-box, 28px);
	display: grid;
	place-items: center;
	border-radius: var(--payment-radius-sm, 8px);
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 9%, transparent);
	color: var(--pos-primary, #2563eb);
}

.payment-method-card__copy {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.payment-method-card__eyebrow {
	display: block;
	font-size: var(--payment-font-caption, 11px);
	line-height: 1.1;
	color: var(--pos-text-secondary, #64748b);
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.payment-method-card__title {
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: var(--payment-font-section, 13px);
	line-height: 1.25;
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
	display: inline-flex;
	align-items: center;
	padding: 2px 7px;
	border-radius: 999px;
	font-size: 10px;
	font-weight: 700;
	white-space: nowrap;
}

.payment-method-card__badge--default {
	background: rgba(var(--v-theme-primary, 37, 99, 235), 0.12);
	color: rgb(var(--v-theme-primary, 37, 99, 235));
}

.payment-method-card__badge--refund {
	background: rgba(var(--v-theme-error, 220, 38, 38), 0.12);
	color: rgb(var(--v-theme-error, 220, 38, 38));
}

.payment-method-card__main {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(132px, 0.34fr);
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

.payment-clear-btn {
	color: var(--pos-text-secondary, #64748b) !important;
}

.payment-method-card__primary-action,
.payment-method-card__extra-action {
	width: 100%;
}

.payment-method-action-btn {
	--v-theme-overlay-multiplier: 0 !important;
	min-height: var(--payment-control-desktop, 40px);
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

/* Quick Denomination Quick Buttons */
.payment-denominations {
	display: flex;
	align-items: center;
	gap: var(--payment-space-2, 8px);
	padding-top: var(--payment-space-1, 4px);
}

.payment-denominations__label {
	font-size: 11px;
	font-weight: 600;
	color: var(--pos-text-secondary, #64748b);
	white-space: nowrap;
}

.payment-denominations__group {
	display: flex;
	flex-wrap: wrap;
	gap: var(--payment-space-1, 4px);
}

.payment-denominations__btn {
	min-width: 48px;
	min-height: 32px;
	padding-inline: var(--payment-space-2, 8px);
	border-radius: var(--payment-radius-sm, 8px);
	font-size: var(--payment-font-label, 12px);
	font-weight: 650;
	font-variant-numeric: tabular-nums;
}

:deep(.payment-shell--phone) .payment-denominations__btn {
	min-height: 40px;
}

/* Empty State */
.payment-methods-empty {
	border: 1px dashed var(--pos-border-light, rgba(0, 0, 0, 0.12));
	border-radius: var(--payment-radius-md, 10px);
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
}

.payment-methods-empty__icon-box {
	display: inline-grid;
	place-items: center;
	width: 44px;
	height: 44px;
	border-radius: 50%;
	background: var(--pos-surface-raised, #ffffff);
}
</style>
