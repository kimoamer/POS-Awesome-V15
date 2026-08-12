<template>
	<v-dialog v-model="dialog" max-width="860" persistent :fullscreen="$vuetify.display.smAndDown">
		<v-card class="purchase-payment-modal rounded-xl">
			<!-- Modal Header Title & Total Due -->
			<div
				class="purchase-payment-modal__header px-4 pt-3 pb-2 border-b d-flex align-center justify-space-between"
			>
				<div class="purchase-payment-modal__title-group">
					<div class="purchase-payment-header-icon">
						<v-icon color="white" icon="mdi-wallet-outline" size="18" />
					</div>
					<span class="text-subtitle-1 font-weight-bold text-slate-800">
						{{ __("Payment") }}
					</span>
				</div>

				<div class="purchase-payment-modal__header-actions">
					<div class="text-end">
						<div
							class="text-caption text-medium-emphasis font-weight-medium"
							style="line-height: 1"
						>
							{{ __("Total Due") }}
						</div>
						<div class="text-subtitle-1 font-weight-bold text-teal-dark">
							<span class="text-caption font-weight-bold me-1">{{
								currencySymbol(currency)
							}}</span>
							<span>{{ formatAmount(resolvedTotalAmount) }}</span>
						</div>
					</div>

					<v-btn
						icon="mdi-close"
						variant="text"
						size="small"
						color="grey-darken-1"
						class="purchase-payment-icon-btn"
						:aria-label="__('Close')"
						@click="close"
					/>
				</div>
			</div>

			<v-card-text class="purchase-payment-modal__body px-4 py-3">
				<!-- Top Stat Cards: Paid Amount & Change / Remaining -->
				<div class="purchase-payment-stats-grid mb-3">
					<!-- Paid Amount Card -->
					<div class="pay-stat-card">
						<div class="pay-stat-icon pay-stat-icon--blue">
							<v-icon icon="mdi-wallet-outline" color="#0284c7" size="18" />
						</div>
						<div class="pay-stat-info">
							<span class="pay-stat-label">{{ __("Paid Amount") }}</span>
							<strong class="pay-stat-value text-blue-dark">
								<span class="text-caption font-weight-bold me-1">{{
									currencySymbol(currency)
								}}</span>
								<span>{{ formatAmount(paidAmount) }}</span>
							</strong>
						</div>
					</div>

					<!-- Change / To Be Paid Card -->
					<div class="pay-stat-card">
						<div
							class="pay-stat-icon"
							:class="remainingAmount > 0 ? 'pay-stat-icon--orange' : 'pay-stat-icon--green'"
						>
							<v-icon
								:icon="remainingAmount > 0 ? 'mdi-cash-clock' : 'mdi-swap-horizontal'"
								:color="remainingAmount > 0 ? '#ea580c' : '#16a34a'"
								size="18"
							/>
						</div>
						<div class="pay-stat-info">
							<span class="pay-stat-label">
								{{ remainingAmount > 0 ? __("To Be Paid") : __("Change") }}
							</span>
							<strong
								class="pay-stat-value"
								:class="remainingAmount > 0 ? 'text-orange-dark' : 'text-green-dark'"
							>
								<span class="text-caption font-weight-bold me-1">{{
									currencySymbol(currency)
								}}</span>
								<span>{{ formatAmount(Math.abs(remainingAmount)) }}</span>
							</strong>
						</div>
					</div>
				</div>

				<!-- Main Payment Columns Grid: Left Amounts Input | Right Payment Methods -->
				<div class="purchase-payment-methods-grid">
					<!-- Left Column: Amount Input Fields & Numpad Chips -->
					<div class="pay-column pay-column--amounts">
						<label class="pay-section-label mb-1">
							{{ __("Amount") }} ({{ currencySymbol(currency) }})
						</label>

						<div class="pay-lines-container">
							<div
								v-for="payment in paymentLines"
								:key="payment.mode_of_payment"
								class="pay-amount-line-wrapper mb-2"
							>
								<!-- Input Box with Currency Prefix -->
								<div
									class="pay-amount-input-box"
									:class="{
										'pay-amount-input-box--active':
											activeMode === payment.mode_of_payment,
									}"
									@click="setActivePayment(payment)"
								>
									<span class="pay-currency-prefix">{{ currencySymbol(currency) }}</span>
									<input
										type="number"
										min="0"
										step="any"
										class="pay-amount-input"
										:value="payment.amount"
										@focus="setActivePayment(payment)"
										@input="handlePaymentAmountChange(payment, $event.target.value)"
									/>
								</div>

								<!-- Numpad Chips (Displayed when this mode is active and suggestions exist) -->
								<div
									v-if="
										activeMode === payment.mode_of_payment &&
										getVisibleDenominations(payment).length
									"
									class="pay-numpad-chips mt-1 d-flex flex-wrap ga-1"
								>
									<button
										v-for="d in getVisibleDenominations(payment)"
										:key="d"
										type="button"
										class="pay-numpad-chip"
										:class="{
											'pay-numpad-chip--selected': Number(payment.amount) === Number(d),
										}"
										@click.stop="setPaymentToDenomination(payment, d)"
									>
										{{ formatAmount(d) }}
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Right Column: Payment Method Card Selectors -->
					<div class="pay-column pay-column--methods">
						<label class="pay-section-label mb-1">
							{{ __("Payment Method") }}
						</label>

						<div class="pay-method-cards-container d-flex flex-column ga-2">
							<div
								v-for="payment in paymentLines"
								:key="payment.mode_of_payment"
								class="pay-method-card px-3 py-2 border rounded-lg d-flex align-center justify-space-between cursor-pointer"
								:class="{ 'pay-method-card--active': activeMode === payment.mode_of_payment }"
								@click="selectPaymentMethodCard(payment)"
							>
								<div class="pay-method-card__identity">
									<v-icon
										:icon="getPaymentMethodIcon(payment.mode_of_payment, payment.type)"
										size="18"
										:color="
											activeMode === payment.mode_of_payment ? '#00838f' : '#64748b'
										"
									/>
									<span
										class="pay-method-name font-weight-bold text-caption"
										:class="
											activeMode === payment.mode_of_payment
												? 'text-teal-dark'
												: 'text-slate-700'
										"
									>
										{{ __(payment.mode_of_payment) }}
									</span>
								</div>

								<!-- Selection Checkmark Circle -->
								<div class="pay-method-radio">
									<v-icon
										v-if="activeMode === payment.mode_of_payment"
										icon="mdi-check-circle"
										color="#00838f"
										size="18"
									/>
									<div v-else class="pay-method-radio-unselected"></div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Optional Print Format & Invoice Toggle Section -->
				<div
					class="mt-3 pt-2 border-t d-flex flex-column ga-1"
					v-if="createInvoice || printFormats.length > 1"
				>
					<v-switch
						v-if="createInvoice"
						v-model="printInvoice"
						density="compact"
						color="primary"
						hide-details
						:label="__('Print Purchase Invoice instead of Order')"
						class="ma-0 scale-compact-switch"
					/>
					<v-select
						v-if="printFormats.length > 1"
						v-model="selectedPrintFormat"
						:items="printFormats"
						:label="printInvoice ? __('Print Format (Invoice)') : __('Print Format (Order)')"
						density="compact"
						variant="outlined"
						hide-details
						class="pos-themed-input compact-select"
					/>
				</div>
			</v-card-text>

			<!-- Bottom Actions Footer -->
			<div class="purchase-payment-modal__footer px-4 py-2 border-t">
				<v-btn
					variant="outlined"
					color="error"
					size="small"
					class="purchase-payment-footer-btn purchase-payment-cancel-btn rounded-lg font-weight-bold text-none px-4 border-error-light"
					@click="close"
				>
					{{ __("Cancel Payment") }}
				</v-btn>

				<div class="purchase-payment-modal__footer-actions">
					<v-btn
						variant="outlined"
						color="#00838f"
						size="small"
						class="purchase-payment-footer-btn purchase-payment-print-btn rounded-lg font-weight-bold text-none px-4 border-primary-light"
						prepend-icon="mdi-printer-outline"
						:loading="loading"
						:disabled="loading || !isPaymentValid"
						@click="submit(true)"
					>
						{{ __("Submit & Print") }}
					</v-btn>

					<v-btn
						color="#00838f"
						variant="flat"
						size="small"
						class="purchase-payment-footer-btn purchase-payment-submit-btn rounded-lg font-weight-bold text-none text-white px-5"
						append-icon="mdi-chevron-right"
						:loading="loading"
						:disabled="loading || !isPaymentValid"
						@click="submit(false)"
					>
						{{ __("Submit") }}
					</v-btn>
				</div>
			</div>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { getSmartTenderSuggestions } from "../../../../utils/smartTender";
import { formatPurchaseAmount, purchaseCurrencySymbol } from "./purchaseFormatting";

defineOptions({
	name: "PurchasePaymentDialog",
});

const __ = window.__ || ((text) => text);

const props = defineProps({
	modelValue: Boolean,
	totalAmount: {
		type: Number,
		default: 0,
	},
	currency: {
		type: String,
		default: "",
	},
	posProfile: {
		type: Object,
		required: true,
	},
	createInvoice: {
		type: Boolean,
		default: false,
	},
	order: {
		type: Object,
		default: null,
	},
});

const emit = defineEmits(["update:modelValue", "submit"]);
const currency_precision = ref(2);

const paymentLines = ref([]);
const activeMode = ref("");
const printFormats = ref([]);
const selectedPrintFormat = ref(null);
const printInvoice = ref(props.createInvoice);
const loading = ref(false);

const dialog = computed({
	get() {
		return props.modelValue;
	},
	set(val) {
		emit("update:modelValue", val);
	},
});

const paidAmount = computed(() =>
	paymentLines.value.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
);

const resolvedTotalAmount = computed(() =>
	Number(props.totalAmount || props.order?.payable_amount || props.order?.grand_total || 0),
);

const remainingAmount = computed(() => resolvedTotalAmount.value - paidAmount.value);

const isPaymentValid = computed(() => {
	const hasNegativePayment = paymentLines.value.some((p) => (parseFloat(p.amount) || 0) < 0);
	if (hasNegativePayment) return false;

	if (paidAmount.value <= 0) return true;
	return remainingAmount.value <= 0;
});

watch(
	() => props.modelValue,
	(val) => {
		if (val) {
			printInvoice.value = props.createInvoice;
			initializePayments();
			fetchPrintFormats();
			loading.value = false;
		}
	},
);

watch(printInvoice, () => {
	fetchPrintFormats();
});

const flt = (value, precision, number_format, rounding_method) => {
	if (!precision && precision != 0) {
		precision = currency_precision.value || 2;
	}
	if (!rounding_method) {
		rounding_method = "Banker's Rounding (legacy)";
	}
	return window.flt(value, precision, number_format, rounding_method);
};

function formatAmount(value) {
	return formatPurchaseAmount(value);
}

function currencySymbol(curr) {
	return purchaseCurrencySymbol(curr) || curr || "";
}

function initializePayments() {
	const modes = props.posProfile.payments || [];
	paymentLines.value = modes.map((m) => ({
		mode_of_payment: m.mode_of_payment,
		amount: 0,
		default: m.default,
		type: m.type,
	}));

	const defaultMode = paymentLines.value.find((p) => p.default) || paymentLines.value[0];
	if (defaultMode) {
		defaultMode.amount = resolvedTotalAmount.value;
		activeMode.value = defaultMode.mode_of_payment;
	} else if (paymentLines.value.length) {
		activeMode.value = paymentLines.value[0].mode_of_payment;
	}
}

function setActivePayment(payment) {
	if (!payment) return;
	activeMode.value = payment.mode_of_payment;
}

function selectPaymentMethodCard(payment) {
	if (!payment) return;
	activeMode.value = payment.mode_of_payment;

	if (payment.amount === 0 && remainingAmount.value > 0) {
		payment.amount = remainingAmount.value;
	} else if (paymentLines.value.length > 1 && paidAmount.value <= 0) {
		payment.amount = resolvedTotalAmount.value;
	}
}

function handlePaymentAmountChange(payment, valStr) {
	const val = parseFloat(valStr) || 0;
	payment.amount = val;
	activeMode.value = payment.mode_of_payment;

	if (remainingAmount.value < 0) {
		autoBalancePayments(payment);
	}
}

function setPaymentToDenomination(payment, amount) {
	payment.amount = amount;
	activeMode.value = payment.mode_of_payment;

	if (remainingAmount.value < 0) {
		autoBalancePayments(payment);
	}
}

function autoBalancePayments(excludePayment) {
	const excess = Math.abs(remainingAmount.value);
	if (excess <= 0) return;

	const otherPayments = paymentLines.value.filter((p) => p !== excludePayment && parseFloat(p.amount) > 0);
	otherPayments.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

	let remainingExcess = excess;

	for (const other of otherPayments) {
		if (remainingExcess <= 0) break;

		const otherAmount = parseFloat(other.amount) || 0;
		const reduction = Math.min(otherAmount, remainingExcess);

		other.amount = flt(otherAmount - reduction, currency_precision.value);
		remainingExcess = flt(remainingExcess - reduction, currency_precision.value);
	}
}

function isCashLikePayment(payment) {
	if (!payment) return false;

	const configuredCashMOP = String(props.posProfile?.posa_cash_mode_of_payment || "").toLowerCase();
	const mode = String(payment.mode_of_payment || "").toLowerCase();
	const type = String(payment.type || "").toLowerCase();

	if (type === "cash") return true;
	if (configuredCashMOP && mode === configuredCashMOP) return true;
	return mode.includes("cash");
}

function getVisibleDenominations(payment) {
	if (!isCashLikePayment(payment)) return [];

	const currentTotalPaid = paidAmount.value;
	const currentPaymentAmount = parseFloat(payment.amount) || 0;
	const otherPayments = currentTotalPaid - currentPaymentAmount;
	const amountToPay = resolvedTotalAmount.value - otherPayments;

	if (amountToPay <= 0) return [];

	return getSmartTenderSuggestions(amountToPay, props.currency);
}

function getPaymentMethodIcon(modeName, type) {
	const mode = String(modeName || "").toLowerCase();
	const t = String(type || "").toLowerCase();

	if (t === "cash" || mode.includes("cash")) return "mdi-cash-multiple";
	if (mode.includes("credit") || mode.includes("card")) return "mdi-credit-card-outline";
	if (mode.includes("cheque") || mode.includes("check")) return "mdi-text-box-outline";
	if (mode.includes("wire") || mode.includes("transfer") || mode.includes("bank"))
		return "mdi-bank-outline";
	if (mode.includes("draft")) return "mdi-file-document-outline";
	return "mdi-credit-card-outline";
}

function close() {
	dialog.value = false;
}

function submit(doPrint) {
	loading.value = true;
	const payments = paymentLines.value
		.filter((p) => p.amount > 0)
		.map((p) => ({
			mode_of_payment: p.mode_of_payment,
			amount: p.amount,
		}));

	emit("submit", {
		payments,
		print: doPrint,
		print_format: selectedPrintFormat.value,
		print_invoice: printInvoice.value,
	});
}

async function fetchPrintFormats() {
	try {
		const doctype = printInvoice.value ? "Purchase Invoice" : "Purchase Order";
		const { message } = await frappe.call({
			method: "posawesome.posawesome.api.print_formats.get_print_formats",
			args: {
				doctype: doctype,
			},
		});
		printFormats.value = message || [];
		selectedPrintFormat.value = null;

		if (printFormats.value.length) {
			if (props.posProfile.print_format && printFormats.value.includes(props.posProfile.print_format)) {
				selectedPrintFormat.value = props.posProfile.print_format;
			} else {
				selectedPrintFormat.value = printFormats.value[0];
			}
		}
	} catch (e) {
		console.error("Failed to fetch print formats", e);
	}
}
</script>

<style scoped>
.purchase-payment-modal {
	background: var(--pos-dialog-bg, #ffffff) !important;
	color: var(--pos-text-primary, #212121);
	display: flex;
	flex-direction: column;
	width: 100%;
	max-height: min(760px, calc(100dvh - 24px));
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	overflow: hidden;
}

.purchase-payment-modal__header {
	min-height: 60px;
	gap: 16px;
	background: var(--pos-surface-raised, #ffffff);
	border-color: var(--pos-divider, rgba(0, 0, 0, 0.06)) !important;
}

.purchase-payment-modal__title-group,
.purchase-payment-modal__header-actions,
.pay-method-card__identity {
	display: flex;
	align-items: center;
	min-width: 0;
}

.purchase-payment-modal__title-group,
.pay-method-card__identity {
	gap: 8px;
}

.purchase-payment-modal__header-actions {
	gap: 12px;
}

.purchase-payment-modal__body {
	flex: 1 1 auto;
	min-height: 0;
	max-height: min(66dvh, 590px);
	overflow-y: auto;
	overscroll-behavior: contain;
	scrollbar-gutter: stable;
	background: var(--pos-surface-container, #fafafa);
}

.purchase-payment-header-icon {
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: #00838f;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.text-teal-dark {
	color: #00838f !important;
}

.purchase-payment-stats-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}

.pay-stat-card {
	padding: 8px 12px;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	background: var(--pos-surface-raised, #ffffff);
	display: flex;
	align-items: center;
	gap: 10px;
	transition: box-shadow 0.15s ease;
}

.pay-stat-card:hover {
	border-color: color-mix(in srgb, var(--pos-primary, #007681) 30%, var(--pos-border, #d6dde5));
	box-shadow: 0 2px 8px var(--pos-shadow-light, rgba(15, 23, 42, 0.04));
}

.pay-stat-icon {
	width: 34px;
	height: 34px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.pay-stat-icon--blue {
	background: #e0f2fe;
}

.pay-stat-icon--green {
	background: #dcfce7;
}

.pay-stat-icon--orange {
	background: #ffedd5;
}

.pay-stat-info {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.pay-stat-label {
	font-size: 10px;
	color: #64748b;
	font-weight: 600;
	line-height: 1.1;
}

.pay-stat-value {
	font-size: 15px;
	font-weight: 800;
	line-height: 1.15;
}

.text-blue-dark {
	color: #0284c7 !important;
}

.text-green-dark {
	color: #16a34a !important;
}

.text-orange-dark {
	color: #ea580c !important;
}

.purchase-payment-methods-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
}

.pay-section-label {
	display: block;
	font-size: 11px;
	font-weight: 700;
	color: #64748b;
}

.pay-amount-input-box {
	display: flex;
	align-items: center;
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	background: var(--pos-input-bg, #ffffff);
	padding: 4px 10px;
	height: 36px;
	transition:
		border-color 0.15s ease,
		box-shadow 0.15s ease;
}

.pay-amount-input-box--active {
	border-color: var(--pos-primary, #007681);
	box-shadow: var(--pos-focus-ring, 0 0 0 3px rgba(0, 118, 129, 0.2));
}

.pay-currency-prefix {
	font-size: 12px;
	font-weight: 700;
	color: #64748b;
	margin-inline-end: 6px;
}

.pay-amount-input {
	border: 0;
	outline: 0;
	width: 100%;
	text-align: end;
	font-size: 13px;
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
	background: transparent;
}

.pay-numpad-chip {
	padding: 2px 8px;
	font-size: 11px;
	font-weight: 700;
	border-radius: 6px;
	border: 1px solid #bae6fd;
	background: #f0f9ff;
	color: #0284c7;
	cursor: pointer;
	min-height: 36px;
	transition:
		background-color 0.15s ease,
		border-color 0.15s ease,
		color 0.15s ease,
		transform 0.1s ease;
}

.pay-numpad-chip--selected {
	background: var(--pos-primary, #007681);
	color: var(--pos-on-primary, #ffffff);
	border-color: var(--pos-primary, #007681);
}

.pay-numpad-chip:hover,
.pay-numpad-chip:focus-visible {
	background: var(--pos-action-hover-bg, #f0fafa);
	color: var(--pos-action-active-fg, #006d77);
	border-color: var(--pos-primary, #007681);
}

.pay-numpad-chip:active {
	background: var(--pos-action-pressed-bg, #d8f0f2);
	color: var(--pos-action-pressed-fg, #005f68);
	transform: translateY(1px);
}

.pay-method-card {
	border: 1px solid #e2e8f0;
	background: var(--pos-surface-raised, #ffffff);
	min-height: 44px;
	transition:
		border-color 0.15s ease,
		background-color 0.15s ease;
}

.pay-method-card:hover {
	border-color: var(--pos-primary, #007681);
	background: var(--pos-action-hover-bg, #f0fafa);
}

.pay-method-card--active {
	border-color: var(--pos-primary, #007681) !important;
	background: var(--pos-action-active-bg, #e6f7f8) !important;
	color: var(--pos-action-active-fg, #006d77) !important;
}

.pay-method-card:active {
	background: var(--pos-action-pressed-bg, #d8f0f2) !important;
	color: var(--pos-action-pressed-fg, #005f68) !important;
}

.pay-method-card__identity .pay-method-name {
	color: inherit !important;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.pay-method-radio-unselected {
	width: 16px;
	height: 16px;
	border-radius: 50%;
	border: 2px solid #cbd5e1;
}

.scale-compact-switch :deep(.v-switch__track) {
	height: 14px !important;
}

.compact-select :deep(.v-field) {
	min-height: 32px !important;
	border-radius: 6px !important;
}

.compact-select :deep(.v-field__input) {
	min-height: 32px !important;
	padding-block: 0 !important;
	font-size: 12px !important;
}

.border-primary-light {
	border-color: #00838f !important;
}

.border-error-light {
	border-color: #fca5a5 !important;
}

.purchase-payment-modal__footer {
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	background: var(--pos-surface-raised, #ffffff);
	border-color: var(--pos-divider, rgba(0, 0, 0, 0.06)) !important;
}

.purchase-payment-modal__footer-actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
}

.purchase-payment-footer-btn {
	min-width: 156px;
	min-height: 44px !important;
	transition:
		background-color 0.15s ease,
		border-color 0.15s ease,
		color 0.15s ease,
		transform 0.1s ease !important;
}

.purchase-payment-submit-btn {
	background: var(--pos-primary, #007681) !important;
	color: var(--pos-on-primary, #ffffff) !important;
}

.purchase-payment-submit-btn:hover,
.purchase-payment-submit-btn:focus-visible {
	background: var(--pos-primary-variant, #005f68) !important;
	color: var(--pos-on-primary, #ffffff) !important;
}

.purchase-payment-submit-btn:active {
	background: color-mix(in srgb, var(--pos-primary-variant, #005f68) 88%, #000000) !important;
	color: var(--pos-on-primary, #ffffff) !important;
	transform: translateY(1px);
}

.purchase-payment-print-btn {
	color: var(--pos-primary, #007681) !important;
	border-color: var(--pos-primary, #007681) !important;
}

.purchase-payment-print-btn:hover,
.purchase-payment-print-btn:focus-visible,
.purchase-payment-print-btn:active {
	background: var(--pos-action-pressed-bg, #d8f0f2) !important;
	color: var(--pos-action-pressed-fg, #005f68) !important;
}

.purchase-payment-cancel-btn:hover,
.purchase-payment-cancel-btn:focus-visible,
.purchase-payment-cancel-btn:active {
	background: var(--pos-error-container, #fdeaea) !important;
	color: var(--pos-error, #e86674) !important;
}

.purchase-payment-icon-btn:hover,
.purchase-payment-icon-btn:focus-visible,
.purchase-payment-icon-btn:active {
	background: var(--pos-action-pressed-bg, #d8f0f2) !important;
	color: var(--pos-action-pressed-fg, #005f68) !important;
}

.purchase-payment-footer-btn :deep(.v-btn__content),
.purchase-payment-footer-btn :deep(.v-icon),
.purchase-payment-icon-btn :deep(.v-btn__content),
.purchase-payment-icon-btn :deep(.v-icon) {
	position: relative;
	z-index: 1;
	color: inherit !important;
	opacity: 1 !important;
}

.purchase-payment-modal :deep(.v-btn__overlay),
.purchase-payment-modal :deep(.v-btn__underlay),
.purchase-payment-modal :deep(.v-ripple__container) {
	opacity: 0 !important;
	display: none !important;
}

@media (max-width: 640px) {
	.purchase-payment-modal {
		max-height: 100dvh;
		min-height: 100dvh;
		border-radius: 0 !important;
	}

	.purchase-payment-modal__header {
		padding-inline: 12px !important;
	}

	.purchase-payment-modal__header-actions {
		gap: 6px;
	}

	.purchase-payment-modal__body {
		max-height: none;
		padding-inline: 12px !important;
	}

	.purchase-payment-stats-grid,
	.purchase-payment-methods-grid {
		grid-template-columns: 1fr;
	}

	.purchase-payment-modal__footer {
		display: grid;
		grid-template-columns: 1fr;
		padding-inline: 12px !important;
	}

	.purchase-payment-modal__footer-actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.purchase-payment-footer-btn {
		width: 100%;
		min-width: 0;
	}
}
</style>
