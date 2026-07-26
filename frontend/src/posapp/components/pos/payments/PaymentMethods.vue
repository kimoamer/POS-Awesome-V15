<template>
	<div class="payment-methods-container">
		<!-- Compact Contextual Allocation Strip for Multiple Methods Only -->
		<div v-if="showSplitAllocationContext" class="payment-allocation-context" :class="allocationStatusClass">
			<span class="payment-allocation-context__text">
				{{ __("Allocated") }} <strong>{{ renderMoney(totalPaid) }}</strong>
				<span class="payment-allocation-context__separator">·</span>
				{{ diffLabel || __("Remaining") }} <strong>{{ renderMoney(differenceAmount) }}</strong>
			</span>
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
						<strong class="payment-method-card__title">{{ payment.mode_of_payment }}</strong>
						<span v-if="payment.default === 1" class="payment-method-card__badge payment-method-card__badge--default">
							<v-icon start size="10">mdi-star-outline</v-icon>
							{{ __("Default") }}
						</span>
						<span v-if="isReturn" class="payment-method-card__badge payment-method-card__badge--refund">
							<v-icon start size="10">mdi-cash-refund</v-icon>
							{{ __("Refund") }}
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
						<!-- Unified Icon Action on All Viewports -->
						<v-btn
							icon
							color="primary"
							variant="tonal"
							class="payment-use-remaining-btn"
							data-pos-keyboard-target="payment-action"
							:data-test="`payment-method-action-${payment.mode_of_payment}`"
							:aria-label="isGiftCardPayment(payment) ? __('Redeem / Scan') : __('Set Remaining')"
							:title="isGiftCardPayment(payment) ? __('Redeem / Scan') : __('Set Remaining')"
							:disabled="loading"
							@click="handlePrimaryAction(payment)"
						>
							<v-icon size="18">
								{{ isGiftCardPayment(payment) ? "mdi-qrcode-scan" : "mdi-calculator-variant-outline" }}
							</v-icon>
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
						variant="tonal"
						class="payment-method-action-btn"
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
						variant="tonal"
						class="payment-method-action-btn"
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

const showSplitAllocationContext = computed(() => props.payments && props.payments.length > 1);

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
	if (props.isReturn) return "payment-allocation-context--refund";
	const diff = Number(props.differenceAmount || 0);
	if (diff === 0) return "payment-allocation-context--balanced";
	if (diff < 0) return "payment-allocation-context--overpaid";
	return "payment-allocation-context--pending";
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
.payment-methods-container,
.payment-methods-list,
.payment-method-card,
.payment-method-card__main,
.payment-method-card__amount {
	min-width: 0;
	max-width: 100%;
}

.payment-methods-container {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2, 8px);
}

/* Compact Allocation Context for Multiple Methods */
.payment-allocation-context {
	padding: 4px 8px;
	border-radius: var(--payment-radius-sm, 8px);
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.03));
	font-size: 11px;
	color: var(--pos-text-secondary, #64748b);
	text-align: start;
}

.payment-allocation-context__text {
	font-variant-numeric: tabular-nums;
}

.payment-allocation-context__separator {
	margin-inline: var(--payment-space-1, 4px);
}

/* Payment Methods Flat List */
.payment-methods-list {
	display: flex;
	flex-direction: column;
}

.payment-method-card {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2, 8px);
	padding: 6px 0;
	background: transparent;
	border: none;
	box-shadow: none;
}

.payment-method-card + .payment-method-card {
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	padding-top: var(--payment-space-3, 12px);
	margin-top: var(--payment-space-2, 8px);
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

.payment-method-card__title {
	font-size: var(--payment-font-section, 13px);
	line-height: 1.25;
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.payment-method-card__badge {
	display: inline-flex;
	align-items: center;
	padding: 2px 6px;
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
	grid-template-columns: minmax(0, 1fr) 40px;
	gap: var(--payment-space-2, 8px);
	align-items: center;
	width: 100%;
}

:deep(.payment-shell--tablet-landscape) .payment-method-card__main,
:deep(.payment-shell--tablet-portrait) .payment-method-card__main {
	grid-template-columns: minmax(0, 1fr) 42px;
}

:deep(.payment-shell--phone) .payment-method-card__main {
	grid-template-columns: minmax(0, 1fr) 44px;
}

.payment-method-card__amount {
	min-width: 0;
}

.payment-method-card__amount :deep(.v-field__input) {
	font-size: 14px;
	font-weight: 650;
	font-variant-numeric: tabular-nums;
}

.payment-method-card__amount :deep(.v-field__prefix) {
	font-size: 13px;
	color: var(--pos-text-secondary, #64748b);
}

/* Hide browser input spinner controls */
.payment-method-card :deep(input[type="number"]) {
	appearance: textfield;
	-moz-appearance: textfield;
}

.payment-method-card :deep(input[type="number"]::-webkit-inner-spin-button),
.payment-method-card :deep(input[type="number"]::-webkit-outer-spin-button) {
	appearance: none;
	margin: 0;
}

.payment-clear-btn {
	color: var(--pos-text-secondary, #64748b) !important;
}

.payment-use-remaining-btn {
	width: 40px !important;
	min-width: 40px !important;
	height: 40px !important;
	min-height: 40px !important;
	align-self: stretch;
	border-radius: var(--payment-radius-sm, 8px) !important;
}

:deep(.payment-shell--tablet-landscape) .payment-use-remaining-btn,
:deep(.payment-shell--tablet-portrait) .payment-use-remaining-btn {
	width: 42px !important;
	min-width: 42px !important;
	height: 42px !important;
	min-height: 42px !important;
}

:deep(.payment-shell--phone) .payment-use-remaining-btn {
	width: 44px !important;
	min-width: 44px !important;
	height: 44px !important;
	min-height: 44px !important;
}

.payment-method-action-btn {
	min-height: var(--payment-control-desktop, 40px);
	border-radius: var(--payment-radius-sm, 8px);
	font-weight: 700;
	text-transform: none;
	letter-spacing: 0.01em;
}

/* Quick Denominations */
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
	min-width: 44px;
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
