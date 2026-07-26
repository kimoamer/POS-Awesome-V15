<template>
	<div
		ref="paymentRoot"
		data-pos-keyboard-root="payment"
		:class="[
			'payment-shell',
			`payment-shell--${viewportMode}`,
			{
				'payment-shell--dialog': dialogMode,
			},
		]"
	>
		<!-- Fixed Header -->
		<PaymentScreenHeader
			:dialog-mode="dialogMode"
			:viewport-mode="viewportMode"
			:invoice-doc="invoice_doc"
			:customer-info="customer_info"
			:invoice-type="invoiceType"
			:loading="loading"
			@back="back_to_invoice"
		/>

		<!-- Fixed Overview Summary -->
		<section class="payment-shell__overview" aria-label="Payment overview">
			<PaymentSummary
				:viewport-mode="viewportMode"
				compact
				:invoice_doc="invoice_doc"
				:paid-amount="total_payments"
				:difference-amount="Math.abs(Number(diff_payment || 0))"
				:diff_label="diff_label"
				:currency="invoice_doc?.currency"
				:format-money="formatPaymentMoney"
				@show-paid-amount="showPaidAmount"
				@show-diff-payment="showDiffPayment"
				@show-paid-change="showPaidChange"
				@update-credit-change="handleCreditChangeUpdate"
			/>
		</section>

		<!-- Scrollable Body Container -->
		<main ref="paymentContainer" class="payment-shell__body">
			<v-progress-linear
				:active="loading"
				:indeterminate="loading"
				absolute
				location="top"
				color="info"
			></v-progress-linear>

			<div class="payment-layout">
				<!-- Primary Column: Payment Methods & Gift Cards -->
				<div class="payment-layout__primary">
					<PaymentSectionShell
						icon="mdi-credit-card-outline"
						:title="__('Payment Methods')"
					>
						<template v-if="capabilities.showImmediateSettlement.value">
							<PaymentMethods
								v-if="is_cashback && invoice_doc"
								:viewport-mode="viewportMode"
								:payments="visiblePaymentMethods"
								:currency="invoice_doc.currency"
								:isReturn="invoice_doc.is_return"
								:requestPaymentField="request_payment_field"
								:currencySymbol="currencySymbol"
								:formatCurrency="formatCurrency"
								:isNumber="isNumber"
								:getVisibleDenominations="getVisibleDenominations"
								:isCashLikePayment="isCashLikePayment"
								:isMpesaC2bPayment="is_mpesa_c2b_payment"
								:isGiftCardPayment="isGiftCardPayment"
								:total-paid="total_payments"
								:difference-amount="diff_payment"
								:diff-label="diff_label"
								:loading="loading"
								@update-amount="handlePaymentAmountChange"
								@set-full-amount="set_full_amount"
								@set-denomination="setPaymentToDenomination"
								@mpesa-dialog="mpesa_c2b_dialog"
								@request-payment="request_payment"
								@set-rest-amount="set_rest_amount"
								@open-gift-card="openGiftCardDialog"
							/>
							<PaymentGiftCardSection
								:enabled="capabilities.showGiftCards.value"
								:expanded="giftCardInlineExpanded"
								:applied-amount="giftCardAppliedAmount"
								:card-code="giftCardCode || giftCardRedemptions[0]?.gift_card_code || ''"
								:redeem-amount="giftCardAmount"
								:balance="giftCardBalance"
								:status="giftCardStatus"
								:loading="giftCardLoading"
								:error-message="giftCardError"
								:format-currency="(value) => formatCurrency(value, invoice_doc.currency)"
								@toggle="toggleGiftCardInline"
								@update:card-code="giftCardCode = $event"
								@update:redeem-amount="giftCardAmount = $event"
								@check-balance="checkGiftCardBalance"
								@apply="applyGiftCardRedemption"
								@clear="clearGiftCardRedemption"
							/>
						</template>
						<div v-else class="posa-credit-settlement-notice pa-4 text-center">
							<v-icon color="info" size="28" class="mb-2">mdi-information-outline</v-icon>
							<div class="text-subtitle-2 font-weight-bold">{{ __("Credit Settlement") }}</div>
							<div class="text-caption text-medium-emphasis">
								{{ __("No immediate payment method is required.") }}
							</div>
						</div>
					</PaymentSectionShell>
				</div>

				<!-- Secondary Column: Invoice Summary, Redemption, Settlement Options, Additional Info -->
				<div class="payment-layout__secondary">
					<PaymentSectionShell
						icon="mdi-receipt-text-outline"
						:title="__('Invoice Summary')"
						:collapsible="viewportMode === 'phone' || viewportMode === 'tablet-portrait'"
						v-model:expanded="invoiceSummaryExpanded"
					>
						<template #header-meta v-if="!invoiceSummaryExpanded && invoice_doc && invoice_doc.grand_total != null">
							<bdi class="payment-section-header-total">
								{{ formatPaymentMoney(invoice_doc.grand_total) }}
							</bdi>
						</template>
						<InvoiceTotals
							:invoice_doc="invoice_doc"
							:displayCurrency="displayCurrency"
							:diff_payment="diff_payment"
							:diff_label="diff_label"
							:item-discount-total="paymentItemDiscountTotal"
							:currencySymbol="currencySymbol"
							:formatCurrency="formatCurrency"
						/>
					</PaymentSectionShell>

					<PaymentSectionShell
						v-if="capabilities.showRedemptionSection.value"
						icon="mdi-star-circle-outline"
						:title="__('Redemption')"
					>
						<PaymentRedemption
							:invoice-doc="invoice_doc"
							:customer-info="customer_info"
							:pos-profile="pos_profile"
							:available-points-amount="available_points_amount"
							:loyalty-amount="loyalty_amount"
							:available-customer-credit="available_customer_credit"
							:redeem-customer-credit="redeem_customer_credit"
							:redeemed-customer-credit="redeemed_customer_credit"
							:format-currency="formatCurrency"
							:format-float="formatFloat"
							:currency-symbol="currencySymbol"
							@set-formatted-currency="handleRedemptionFormattedCurrency"
						/>
					</PaymentSectionShell>

					<PaymentSectionShell
						v-if="capabilities.showSettlementOptions.value"
						icon="mdi-tune-variant"
						:title="__('Settlement Options')"
					>
						<PaymentOptions
							:invoice-doc="invoice_doc"
							:pos-profile="pos_profile"
							:diff-payment="diff_payment"
							:credit-change="credit_change"
							:is-write-off-change="is_write_off_change"
							:is-credit-sale="is_credit_sale"
							:is-cashback="is_cashback"
							:is-credit-return="is_credit_return"
							:new-credit-due-date="new_credit_due_date"
							:credit-due-days="credit_due_days"
							:credit-due-presets="credit_due_presets"
							:write-off-amount="invoice_doc.write_off_amount || Math.max(diff_payment, 0)"
							:write-off-max-amount="writeOffProfileLimit"
							:redeem-customer-credit="redeem_customer_credit"
							:available-customer-credit="available_customer_credit"
							:redeemed-customer-credit="redeemed_customer_credit"
							:customer-credit-sources="customer_credit_dict.length"
							:format-currency="formatCurrency"
							@update:is-write-off-change="is_write_off_change = $event"
							@update:is-credit-sale="is_credit_sale = $event"
							@update:is-cashback="is_cashback = $event"
							@update:is-credit-return="is_credit_return = $event"
							@update:new-credit-due-date="
								(val) => {
									new_credit_due_date = val;
									update_credit_due_date();
								}
							"
							@update:credit-due-days="credit_due_days = $event"
							@update:write-off-amount="handleWriteOffAmountUpdate"
							@apply-due-preset="applyDuePreset"
							@update:redeem-customer-credit="redeem_customer_credit = $event"
							@get-available-credit="get_available_credit"
						/>
						<PaymentCustomerCreditDetails
							:invoice-doc="invoice_doc"
							:available-customer-credit="available_customer_credit"
							:redeem-customer-credit="redeem_customer_credit"
							:customer-credit-dict="customer_credit_dict"
							:credit-source-label="creditSourceLabel"
							:format-currency="formatCurrency"
							:currency-symbol="currencySymbol"
							@set-formatted-currency="
								(data) =>
									setFormatedCurrency(data.target, data.field, null, false, data.value)
							"
						/>
					</PaymentSectionShell>

					<PaymentSectionShell
						v-if="capabilities.showOrderDetails.value"
						icon="mdi-truck-outline"
						:title="__('Order & Fulfillment')"
						collapsible
						v-model:expanded="orderDetailsExpanded"
					>
						<PaymentAdditionalInfo
							:invoice-doc="invoice_doc"
							:pos-profile="pos_profile"
							:invoice-type="invoiceType"
							:return-validity-enabled="returnValidityEnabled"
							:return-validity-min-date="returnValidityMinDate"
							:addresses="addresses"
							:new-delivery-date="new_delivery_date"
							:return-valid-upto-date="return_valid_upto_date"
							:address-filter="addressFilter"
							@update:new-delivery-date="
								(val) => {
									new_delivery_date = val;
									update_delivery_date();
								}
							"
							@update:return-valid-upto-date="
								(val) => {
									return_valid_upto_date = val;
									updateReturnValidUpto();
								}
							"
							@new-address="new_address"
						/>
						<PaymentPurchaseOrder
							:invoice-doc="invoice_doc"
							:pos-profile="pos_profile"
							:new-po-date="new_po_date"
							@update:new-po-date="
								(val) => {
									new_po_date = val;
									update_po_date();
								}
							"
						/>
					</PaymentSectionShell>

					<PaymentSectionShell
						v-if="capabilities.showSalesAndReceiptDetails.value"
						icon="mdi-account-tie-outline"
						:title="__('Sales & Receipt')"
						collapsible
						v-model:expanded="salesReceiptExpanded"
					>
						<PaymentSelectionFields
							:sales-persons="sales_persons"
							:sales-person="sales_person"
							:readonly="readonly"
							:print-formats="print_formats"
							:print-format="print_format"
							:show-print-format="
								parseBooleanSetting(pos_profile?.posa_allow_select_print_format_in_payments)
							"
							@update:sales-person="sales_person = $event"
							@update:print-format="print_format = $event"
						/>
					</PaymentSectionShell>
				</div>
			</div>
		</main>

		<!-- Fixed Action Footer -->
		<footer :class="['payment-shell__footer', { 'payment-shell__footer--dialog': dialogMode }]">
			<PaymentActionButtons
				ref="submitButton"
				:viewport-mode="viewportMode"
				:loading="loading"
				:validatePayment="validatePayment"
				:highlightSubmit="highlightSubmit"
				:compact="dialogMode"
				@submit="submit"
				@submit-and-print="submit(undefined, false, true)"
				@cancel="back_to_invoice"
			/>
		</footer>

		<!-- Dialogs Section (Custom Days, Phone Payment) -->
		<PaymentDialogs
			:custom-days-dialog="custom_days_dialog"
			:custom-days-value="custom_days_value"
			:phone-dialog="phone_dialog"
			:invoice-doc="invoice_doc"
			@update:custom-days-dialog="custom_days_dialog = $event"
			@update:custom-days-value="custom_days_value = $event"
			@apply-custom-days="applyCustomDays"
			@update:phone-dialog="phone_dialog = $event"
			@request-payment="request_payment"
		/>
		<GiftCardDialog
			:model-value="giftCardDialogOpen"
			:card-code="giftCardCode"
			:redeem-amount="giftCardAmount"
			:balance="giftCardBalance"
			:status="giftCardStatus"
			:is-supervisor="capabilities.isSupervisor.value"
			:loading="giftCardLoading"
			:mode="giftCardMode"
			:error-message="giftCardError"
			@update:model-value="giftCardDialogOpen = $event"
			@update:card-code="giftCardCode = $event"
			@update:redeem-amount="giftCardAmount = $event"
			@set-mode="setGiftCardMode"
			@check-balance="checkGiftCardBalance"
			@apply-redemption="applyGiftCardRedemption"
			@issue-card="issueGiftCard"
			@top-up-card="topUpGiftCard"
		/>
	</div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, getCurrentInstance, nextTick } from "vue";
import { storeToRefs } from "pinia";

// Component Shell Wrappers
import PaymentScreenHeader from "./payments/PaymentScreenHeader.vue";
import PaymentSectionShell from "./payments/PaymentSectionShell.vue";

// Stores
import { useInvoiceStore } from "../../stores/invoiceStore.js";
import { useCustomersStore } from "../../stores/customersStore.js";
import { useUIStore } from "../../stores/uiStore.js";
import { useToastStore } from "../../stores/toastStore.js";
import { useSyncStore } from "../../stores/syncStore.ts";
import { useSocketStore } from "../../stores/socketStore";
import { useEmployeeStore } from "../../stores/employeeStore";

// Composables
import { usePaymentUiCapabilities } from "../../composables/pos/payments/usePaymentUiCapabilities";
import { usePaymentCalculations } from "../../composables/pos/payments/usePaymentCalculations";
import { usePaymentSubmission } from "../../composables/pos/payments/usePaymentSubmission";
import { useRedemptionLogic } from "../../composables/pos/payments/useRedemptionLogic";
import { usePaymentPrinting } from "../../composables/pos/payments/usePaymentPrinting";
import { usePaymentMethods } from "../../composables/pos/payments/usePaymentMethods";
import { useInvoiceDetails } from "../../composables/pos/invoice/useInvoiceDetails";
import { useFormat } from "../../format";
import {
	isOffline,
	getStoredCustomer,
	getCachedGiftCardSnapshot,
	saveGiftCardSnapshot,
} from "../../../offline/index";
import GiftCardDialog from "./wallet/GiftCardDialog.vue";
import {
	applyPreferredPaymentAmount,
	initializePaymentLinesForDialog,
	rebalancePreferredPaymentLine,
	resolvePreferredPaymentLine,
	resolveReturnDefaultAmount,
	shouldApplyReturnRefundCap,
} from "../../utils/paymentInitialization";
import { resolvePaymentPrintFormatDoctypes } from "../../utils/paymentPrintDoctype";
import { resolvePaymentPrintFormat } from "../../utils/paymentPrintFormat";
import { parseBooleanSetting } from "../../utils/stock";
import { toCompanyCurrency } from "../../utils/erpnextCurrency";
import { focusFirstKeyboardTarget } from "../../utils/keyboardNavigation";

// Components
import PaymentSummary from "./payments/PaymentSummary.vue";
import InvoiceTotals from "./payments/InvoiceTotals.vue";
import PaymentActionButtons from "./payments/PaymentActionButtons.vue";
import PaymentMethods from "./payments/PaymentMethods.vue";
import PaymentGiftCardSection from "./payments/PaymentGiftCardSection.vue";
import PaymentRedemption from "./payments/PaymentRedemption.vue";
import PaymentAdditionalInfo from "./payments/PaymentAdditionalInfo.vue";
import PaymentPurchaseOrder from "./payments/PaymentPurchaseOrder.vue";
import PaymentCustomerCreditDetails from "./payments/PaymentCustomerCreditDetails.vue";
import PaymentOptions from "./payments/PaymentOptions.vue";
import PaymentSelectionFields from "./payments/PaymentSelectionFields.vue";
import PaymentDialogs from "./payments/PaymentDialogs.vue";

const props = defineProps({
	dialogMode: {
		type: Boolean,
		default: false,
	},
	viewportMode: {
		type: String,
		default: "desktop",
		validator: (value) =>
			["phone", "tablet-portrait", "tablet-landscape", "desktop"].includes(value),
	},
});

const { proxy } = getCurrentInstance();
const eventBus = proxy.eventBus;
const __ = window.__;
const frappe = window.frappe;

const invoiceStore = useInvoiceStore();
const customersStore = useCustomersStore();
const uiStore = useUIStore();
const toastStore = useToastStore();
const syncStore = useSyncStore();
const socketStore = useSocketStore();

// Destructure format utilities
const {
	currency_precision,
	formatCurrency,
	formatFloat,
	currencySymbol,
	isNumber,
	flt,
	setFormatedCurrency,
} = useFormat();

const { selectedCustomer, customerInfo } = storeToRefs(customersStore);
const { activeView, paymentDialogOpen } = storeToRefs(uiStore);
const { invoiceType } = storeToRefs(invoiceStore);
const employeeStore = useEmployeeStore();
const { currentCashier } = storeToRefs(employeeStore);

// Capability Matrix & Section Expanded State
const invoiceSummaryExpanded = ref(props.viewportMode !== "phone");
const orderDetailsExpanded = ref(false);
const salesReceiptExpanded = ref(false);

// State
const is_return = ref(false);
const is_credit_sale = ref(false);
const is_write_off_change = ref(false);
const redeem_customer_credit = ref(false);
const pos_profile = ref("");
const stock_settings = ref("");
const pos_settings = ref({});
const is_cashback = ref(true);
const paid_change = ref(0);
const credit_change = ref(0);
const loading = ref(false);
const show_change_dialog = ref(false);
const sales_person = ref("");
const is_credit_return = ref(false);
const customer_info = ref("");

const capabilities = usePaymentUiCapabilities({
	posProfile: pos_profile,
	posSettings: pos_settings,
	invoiceDoc: computed(() => invoiceStore.invoiceDoc || {}),
	customerInfo: customer_info,
	invoiceType,
	currentCashier,
	isCashback: is_cashback,
});
const print_format = ref("");
const print_formats = ref([]);
const paid_change_rules = ref([]);
const is_user_editing_paid_change = ref(false);
const highlightSubmit = ref(false);
const last_payment_change_was_cash = ref(null);
const backgroundStatusCheck = ref(null);
const paymentVisible = ref(false);
const paymentRoot = ref(null);
const paymentContainer = ref(null);
const submitButton = ref(null);
const _shortcutHandlers = ref({});
const readonly = ref(false); // Add missing readonly ref
const submissionInFlight = ref(false);
const queuedShortcutSubmit = ref(null);
const giftCardDialogOpen = ref(false);
const giftCardInlineExpanded = ref(false);
const activeGiftCardPayment = ref(null);
const giftCardCode = ref("");
const giftCardAmount = ref(0);
const giftCardBalance = ref(0);
const giftCardStatus = ref("");
const giftCardLoading = ref(false);
const giftCardMode = ref("redeem");
const giftCardError = ref("");
const giftCardRedemptions = ref([]);

// Computed Properties
const invoice_doc = computed({
	get: () => invoiceStore.invoiceDoc || {},
	set: (value) => invoiceStore.setInvoiceDoc(value),
});

const paymentItemDiscountTotal = computed(() => {
	const items = Array.isArray(invoice_doc.value?.items) ? invoice_doc.value.items : [];

	const total = items.reduce((sum, item) => {
		const qty = Math.abs(flt(item?.qty || 0, currency_precision.value));
		const explicitDiscount = Math.abs(flt(item?.discount_amount || 0, currency_precision.value));
		const rateDiscount =
			explicitDiscount > 0
				? explicitDiscount
				: Math.max(
						flt(item?.price_list_rate || 0, currency_precision.value) -
							flt(item?.rate || 0, currency_precision.value),
						0,
					);

		return sum + qty * rateDiscount;
	}, 0);

	return flt(total, currency_precision.value);
});

const displayCurrency = computed(() => (invoice_doc.value ? invoice_doc.value.currency : ""));
const isPaymentOpen = computed(() => activeView.value === "payment" || paymentDialogOpen.value);
const netInvoiceSettlementAmount = computed(() => {
	if (!invoice_doc.value) return 0;

	const invoiceTotal = flt(
		invoice_doc.value.rounded_total || invoice_doc.value.grand_total,
		currency_precision.value,
	);
	const coveredAmount = flt(
		(invoice_doc.value?.loyalty_amount || loyalty_amount.value || 0) +
			(redeemed_customer_credit.value || 0),
		currency_precision.value,
	);

	const net = invoiceTotal - coveredAmount;
	return invoice_doc.value?.is_return ? Math.min(net, 0) : Math.max(net, 0);
});

const validatePayment = computed(() => {
	const profile = pos_profile.value;
	if (!profile || !parseBooleanSetting(profile.posa_allow_sales_order)) {
		return false;
	}
	if (invoiceType.value !== "Order") {
		return false;
	}
	const doc = invoice_doc.value;
	return !doc || !doc.posa_delivery_date;
});

const getWriteOffLimit = (profile) => {
	if (!profile) return null;

	const possibleLimitFields = [
		"write_off_limit",
		"posa_max_write_off_amount",
		"max_write_off_amount",
		"write_off_amount",
		"posa_write_off_limit",
	];

	for (const field of possibleLimitFields) {
		const rawValue = profile?.[field];
		if (rawValue === undefined || rawValue === null || rawValue === "") {
			continue;
		}

		const parsed = flt(rawValue, currency_precision.value);
		if (parsed > 0) {
			return parsed;
		}
	}

	return null;
};

const writeOffProfileLimit = computed(() => getWriteOffLimit(pos_profile.value));

const request_payment_field = computed(() => {
	return (
		pos_settings.value?.invoice_fields?.some(
			(el) => el.fieldtype === "Button" && el.fieldname === "request_for_payment",
		) || false
	);
});

const returnValidityEnabled = computed(() => {
	return (
		parseBooleanSetting(pos_profile.value?.posa_enable_return_validity) ||
		parseBooleanSetting(pos_settings.value?.posa_enable_return_validity)
	);
});

const paymentDisplayCurrency = computed(() =>
	String(invoice_doc.value?.currency || pos_profile.value?.currency || "").trim(),
);

const formatPaymentMoney = (value) => {
	const parsed = Number(value ?? 0);
	const amount = Number.isFinite(parsed) ? parsed : 0;
	return formatCurrency(amount, paymentDisplayCurrency.value);
};

const returnValidityMinDate = computed(() => {
	const postingDate = invoice_doc.value?.posting_date || frappe.datetime?.nowdate?.();
	if (!postingDate) {
		return new Date();
	}
	const parsed = new Date(postingDate);
	if (Number.isNaN(parsed.getTime())) {
		return new Date();
	}
	return parsed;
});

// Logic Composables
const {
	loyalty_amount,
	redeemed_customer_credit,
	customer_credit_dict,
	available_customer_credit,
	available_points_amount,
	get_available_credit,
} = useRedemptionLogic({
	invoiceDoc: computed(() => invoiceStore.invoiceDoc),
	posProfile: pos_profile,
	customerInfo: customer_info,
	currencyPrecision: currency_precision,
	formatFloat: (val, prec) => flt(val, prec),
	stores: { toastStore },
	onClearAmounts: () => {},
});

const { loadPrintPage, printOfflineInvoice } = usePaymentPrinting({
	invoiceDoc: computed(() => invoiceStore.invoiceDoc),
	posProfile: pos_profile,
	invoiceType: invoiceType,
	printFormat: print_format,
});

const paymentCalculations = usePaymentCalculations({
	invoiceDoc: computed(() => invoiceStore.invoiceDoc),
	posProfile: pos_profile,
	currencyPrecision: currency_precision,
	loyaltyAmount: loyalty_amount,
	redeemedCustomerCredit: redeemed_customer_credit,
	customerCreditDict: customer_credit_dict,
	customerInfo: customer_info,
	giftCardRedemptions,
	formatCurrency: (val, _curr) => formatCurrency(val, currency_precision.value),
});

const { diff_payment, total_payments, total_payments_display, diff_payment_display, diff_label, change_due } =
	paymentCalculations;

const {
	phone_dialog,
	get_mpesa_modes,
	is_mpesa_c2b_payment,
	mpesa_c2b_dialog,
	set_mpesa_payment,
	set_full_amount,
	set_rest_amount,
	clear_all_amounts,
	request_payment,
	getVisibleDenominations,
	isCashLikePayment,
} = usePaymentMethods({
	invoiceDoc: computed(() => invoiceStore.invoiceDoc),
	posProfile: pos_profile,
	diffPayment: diff_payment,
	getNetInvoiceAmount: () => netInvoiceSettlementAmount.value,
	formatFloat: (val) => flt(val, currency_precision.value),
	stores: {
		toastStore,
		uiStore,
	},
	eventBus: eventBus,
	onSubmit: (args, submitPrint) => {
		submitInvoiceWrapper(submitPrint, {
			onPrint: (doc, printOptions = {}) => {
				if (submitPrint) {
					if (printOptions.waitForPostSubmitPayments || printOptions.waitForInvoiceProcessing) {
						void runDeferredPrintWorkflow({
							name: printOptions.name || doc?.name,
							doctype: printOptions.doctype,
							waitForPostSubmitPayments: Boolean(printOptions.waitForPostSubmitPayments),
							waitForInvoiceProcessing: Boolean(printOptions.waitForInvoiceProcessing),
						});
					} else if (isOffline()) {
						printOfflineInvoice(doc);
					} else {
						loadPrintPage({
							doc,
							doctype: printOptions.doctype,
							name: printOptions.name,
						});
					}
				}
			},
			onSuccess: () => {
				eventBus.emit("focus_item_search");
			},
		});
	},
	setRedeemCustomerCredit: (val) => {
		redeem_customer_credit.value = val;
	},
	customerCreditDict: customer_credit_dict,
	redeemedCustomerCredit: redeemed_customer_credit,
	isCashback: is_cashback,
	getTotalChange: () => Math.max(-diff_payment.value, 0),
	getPaidChange: () => paid_change.value,
	getCreditChange: () => credit_change.value,
	onBackToInvoice: () => eventBus.emit("change_active_view", "Invoice"),
});

const {
	addresses,
	sales_persons,
	new_delivery_date,
	new_po_date,
	new_credit_due_date,
	credit_due_days,
	credit_due_presets,
	custom_days_dialog,
	custom_days_value,
	return_valid_upto_date,
	get_addresses,
	new_address,
	addressFilter,
	normalizeAddress,
	get_sales_person_names,
	update_delivery_date,
	update_po_date,
	update_credit_due_date,
	applyDuePreset,
	applyCustomDays,
	initializeReturnValidity,
	updateReturnValidUpto,
	formatDateDisplay,
} = useInvoiceDetails({
	invoiceDoc: computed(() => invoiceStore.invoiceDoc),
	posProfile: pos_profile,
	invoiceType: invoiceType,
	posSettings: pos_settings,
	stores: {
		toastStore,
		invoiceStore,
	},
	eventBus: eventBus,
});

const { ensureReturnPaymentsAreNegative, restoreReturnPayments, validateSubmission, submitInvoice } =
	usePaymentSubmission({
		invoiceDoc: computed(() => invoiceStore.invoiceDoc),
		posProfile: pos_profile,
		stockSettings: stock_settings,
		invoiceType: invoiceType,
		is_write_off_change: is_write_off_change,
		isCashback: is_cashback,
		paidChange: paid_change,
		creditChange: credit_change,
		redeemedCustomerCredit: redeemed_customer_credit,
		customerCreditDict: customer_credit_dict,
		giftCardRedemptions: giftCardRedemptions,
		diff_payment: diff_payment,
		is_credit_sale: is_credit_sale,
		loyaltyAmount: loyalty_amount,
		customerInfo: customer_info,
		formatFloat: (val, prec) => flt(val, prec),
		stores: {
			toastStore,
			syncStore,
			customersStore,
			uiStore,
			invoiceStore,
		},
		currencyPrecision: currency_precision,
	});

const isGiftCardPayment = (payment) => {
	if (!capabilities.showGiftCards.value) {
		return false;
	}
	return String(payment?.mode_of_payment || "")
		.trim()
		.toLowerCase()
		.includes("gift");
};

const visiblePaymentMethods = computed(() =>
	(Array.isArray(invoice_doc.value?.payments) ? invoice_doc.value.payments : []).filter(
		(payment) => !isGiftCardPayment(payment),
	),
);

const creditSaleAllowed = computed(() =>
	parseBooleanSetting(pos_profile.value?.posa_allow_credit_sale),
);

const giftCardAppliedAmount = computed(() =>
	(Array.isArray(giftCardRedemptions.value) ? giftCardRedemptions.value : []).reduce(
		(sum, row) => sum + flt(row?.amount || 0, currency_precision.value),
		0,
	),
);

const resetGiftCardState = ({ clearPayment = false } = {}) => {
	giftCardDialogOpen.value = false;
	giftCardInlineExpanded.value = false;
	giftCardCode.value = "";
	giftCardAmount.value = 0;
	giftCardBalance.value = 0;
	giftCardStatus.value = "";
	giftCardLoading.value = false;
	giftCardMode.value = "redeem";
	giftCardError.value = "";
	giftCardRedemptions.value = [];
	if (clearPayment && activeGiftCardPayment.value) {
		activeGiftCardPayment.value.amount = 0;
		if (activeGiftCardPayment.value.base_amount !== undefined) {
			activeGiftCardPayment.value.base_amount = 0;
		}
	}
	activeGiftCardPayment.value = null;
};

const setGiftCardMode = (mode) => {
	giftCardMode.value = mode || "redeem";
	giftCardError.value = "";
};

const getGiftCardRemainingAmount = () => {
	const flexiblePayment =
		activeGiftCardPayment.value || resolvePreferredPaymentLine(invoice_doc.value, isCashLikePayment);
	const payments = Array.isArray(invoice_doc.value?.payments) ? invoice_doc.value.payments : [];
	const otherPaymentsTotal = payments.reduce((sum, payment) => {
		if (!payment || payment === flexiblePayment) {
			return sum;
		}
		return sum + flt(payment.amount || 0, currency_precision.value);
	}, 0);
	return Math.max(flt(netInvoiceSettlementAmount.value - otherPaymentsTotal, currency_precision.value), 0);
};

const clearGiftCardRedemption = () => {
	if (activeGiftCardPayment.value) {
		activeGiftCardPayment.value.amount = 0;
		if (activeGiftCardPayment.value.base_amount !== undefined) {
			activeGiftCardPayment.value.base_amount = 0;
		}
	}
	giftCardRedemptions.value = [];
	giftCardCode.value = "";
	giftCardAmount.value = 0;
	giftCardBalance.value = 0;
	giftCardStatus.value = "";
	giftCardError.value = "";
	giftCardInlineExpanded.value = false;
	rebalancePreferredPaymentCoverage(0);
};

const toggleGiftCardInline = () => {
	giftCardInlineExpanded.value = !giftCardInlineExpanded.value;
	activeGiftCardPayment.value = null;
	if (giftCardInlineExpanded.value) {
		giftCardCode.value = giftCardRedemptions.value[0]?.gift_card_code || giftCardCode.value || "";
		giftCardAmount.value = flt(
			giftCardRedemptions.value[0]?.amount || giftCardAmount.value || 0,
			currency_precision.value,
		);
	} else {
		giftCardError.value = "";
	}
};

const openGiftCardDialog = (payment = null) => {
	activeGiftCardPayment.value = payment;
	giftCardDialogOpen.value = true;
	giftCardCode.value = giftCardRedemptions.value[0]?.gift_card_code || "";
	giftCardAmount.value = flt(
		giftCardRedemptions.value[0]?.amount || payment?.amount || 0,
		currency_precision.value,
	);
	giftCardBalance.value = flt(giftCardBalance.value || 0, currency_precision.value);
	giftCardStatus.value = giftCardStatus.value || "";
	giftCardMode.value = "redeem";
	giftCardError.value = "";
};

const checkGiftCardBalance = async () => {
	if (!giftCardCode.value || !pos_profile.value?.company) {
		giftCardError.value = __("Gift card code is required.");
		return;
	}

	if (isOffline()) {
		const cached = getCachedGiftCardSnapshot(giftCardCode.value);
		if (!cached) {
			giftCardError.value = __("No cached gift card balance is available offline.");
			return;
		}
		giftCardBalance.value = flt(cached.current_balance || 0, currency_precision.value);
		giftCardStatus.value = cached.status || "";
		return;
	}

	giftCardLoading.value = true;
	giftCardError.value = "";
	try {
		const response = await frappe.call({
			method: "posawesome.posawesome.api.gift_cards.check_gift_card_balance",
			args: {
				gift_card_code: giftCardCode.value,
				company: pos_profile.value.company,
			},
		});
		const card = response?.message || {};
		giftCardBalance.value = flt(card.current_balance || 0, currency_precision.value);
		giftCardStatus.value = card.status || "";
		saveGiftCardSnapshot(giftCardCode.value, card);
		if (!giftCardAmount.value && giftCardMode.value === "redeem") {
			giftCardAmount.value = Math.min(giftCardBalance.value, getGiftCardRemainingAmount());
		}
	} catch (error) {
		giftCardError.value = error?.message || __("Unable to load gift card balance.");
	}
	giftCardLoading.value = false;
};

const applyGiftCardRedemption = async () => {
	if (!giftCardBalance.value || !giftCardStatus.value) {
		await checkGiftCardBalance();
		if (!giftCardBalance.value || giftCardError.value) {
			return;
		}
	}

	const nextAmount = Math.min(
		flt(giftCardAmount.value || 0, currency_precision.value),
		giftCardBalance.value,
		getGiftCardRemainingAmount(),
	);

	if (nextAmount <= 0) {
		giftCardError.value = __("Gift card amount must be greater than zero.");
		return;
	}

	if (activeGiftCardPayment.value) {
		activeGiftCardPayment.value.amount = 0;
		if (activeGiftCardPayment.value.base_amount !== undefined) {
			activeGiftCardPayment.value.base_amount = 0;
		}
	}
	giftCardRedemptions.value = [
		{
			gift_card_code: giftCardCode.value,
			amount: nextAmount,
			cashier: currentCashier.value?.user || null,
		},
	];
	rebalancePreferredPaymentCoverage(nextAmount);
	giftCardInlineExpanded.value = false;
	giftCardDialogOpen.value = false;
};

const issueGiftCard = async () => {
	if (!currentCashier.value?.is_supervisor) {
		giftCardError.value = __("A POS supervisor is required for this action.");
		return;
	}
	giftCardLoading.value = true;
	giftCardError.value = "";
	try {
		const response = await frappe.call({
			method: "posawesome.posawesome.api.gift_cards.issue_gift_card",
			args: {
				pos_profile: pos_profile.value?.name,
				cashier: currentCashier.value?.user,
				company: pos_profile.value?.company,
				initial_amount: flt(giftCardAmount.value || 0, currency_precision.value),
				gift_card_code: giftCardCode.value || null,
				currency: invoice_doc.value?.currency || pos_profile.value?.currency,
			},
		});
		const card = response?.message || {};
		giftCardCode.value = card.gift_card_code || giftCardCode.value;
		giftCardBalance.value = flt(card.current_balance || 0, currency_precision.value);
		giftCardStatus.value = card.status || "Active";
		giftCardMode.value = "redeem";
	} catch (error) {
		giftCardError.value = error?.message || __("Unable to issue gift card.");
	}
	giftCardLoading.value = false;
};

const topUpGiftCard = async () => {
	if (!currentCashier.value?.is_supervisor) {
		giftCardError.value = __("A POS supervisor is required for this action.");
		return;
	}
	giftCardLoading.value = true;
	giftCardError.value = "";
	try {
		const response = await frappe.call({
			method: "posawesome.posawesome.api.gift_cards.top_up_gift_card",
			args: {
				pos_profile: pos_profile.value?.name,
				cashier: currentCashier.value?.user,
				gift_card_code: giftCardCode.value,
				amount: flt(giftCardAmount.value || 0, currency_precision.value),
			},
		});
		const card = response?.message || {};
		giftCardBalance.value = flt(card.current_balance || 0, currency_precision.value);
		giftCardStatus.value = card.status || "Active";
		giftCardMode.value = "redeem";
	} catch (error) {
		giftCardError.value = error?.message || __("Unable to top up gift card.");
	}
	giftCardLoading.value = false;
};

// Methods

const get_print_formats = async () => {
	const doctypes = resolvePaymentPrintFormatDoctypes({
		profile: pos_profile.value,
		invoiceType: invoiceType.value,
	});

	try {
		const responses = await Promise.all(
			doctypes.map((doctype) =>
				frappe.call({
					method: "posawesome.posawesome.api.print_formats.get_print_formats",
					args: { doctype },
				}),
			),
		);

		const mergedFormats = responses
			.flatMap((response) => response?.message || [])
			.map((pf) => (typeof pf === "object" && pf.name ? pf.name : pf))
			.filter(Boolean);

		print_formats.value = Array.from(new Set(mergedFormats));
		set_print_format();
	} catch (error) {
		console.error("Failed to fetch payment print formats", error);
		print_formats.value = [];
		set_print_format();
	}
};

const set_print_format = () => {
	print_format.value = resolvePaymentPrintFormat({
		profile: pos_profile.value,
		customerInfo: customer_info.value,
		availableFormats: print_formats.value,
	});
};

const releaseActiveFocus = () => {
	if (typeof document === "undefined") {
		return;
	}
	const active = document.activeElement;
	if (active instanceof HTMLElement && active !== document.body) {
		active.blur();
	}
};

const triggerSearchFocusRecovery = () => {
	nextTick(() => {
		uiStore.triggerItemSearchFocus();
		if (eventBus && typeof eventBus.emit === "function") {
			eventBus.emit("focus_item_search");
		}
	});
};

const queueSearchRefocusRecovery = () => {
	if (typeof window === "undefined") {
		triggerSearchFocusRecovery();
		return;
	}

	let fallbackTimer = null;
	let cleanupTimer = null;
	const recover = () => {
		triggerSearchFocusRecovery();
	};

	const cleanup = () => {
		window.removeEventListener("focus", onWindowFocus);
		if (fallbackTimer) {
			clearTimeout(fallbackTimer);
			fallbackTimer = null;
		}
		if (cleanupTimer) {
			clearTimeout(cleanupTimer);
			cleanupTimer = null;
		}
	};

	const onWindowFocus = () => {
		recover();
		cleanup();
	};

	window.addEventListener("focus", onWindowFocus);
	if (fallbackTimer) {
		clearTimeout(fallbackTimer);
		fallbackTimer = null;
	}
	fallbackTimer = setTimeout(() => {
		recover();
		cleanup();
	}, 900);
	if (cleanupTimer) {
		clearTimeout(cleanupTimer);
		cleanupTimer = null;
	}
	cleanupTimer = setTimeout(() => {
		cleanup();
	}, 10000);
};

const back_to_invoice = () => {
	releaseActiveFocus();
	paymentVisible.value = false;
	if (paymentDialogOpen.value) {
		uiStore.closePaymentDialog();
	}
	if (activeView.value === "payment") {
		uiStore.setActiveView("items");
	}
	queueSearchRefocusRecovery();
};

const finishSubmissionNavigation = (clearInvoice = false) => {
	const submittedType = invoiceType.value;
	back_to_invoice();
	if (clearInvoice) {
		addresses.value = [];
		invoiceStore.clear();
		invoiceStore.resetPostingDate();
		if (eventBus && typeof eventBus.emit === "function") {
			eventBus.emit("clear_invoice");
		}

		if (submittedType !== "Invoice") {
			invoiceType.value = "Invoice";
			if (eventBus && typeof eventBus.emit === "function") {
				eventBus.emit("reset_invoice_type_to_invoice");
			}
		}
	}
};

const buildProfilePaymentLines = () => {
	const profilePayments = Array.isArray(pos_profile.value?.payments) ? pos_profile.value.payments : [];

	return profilePayments
		.filter((payment) => payment?.mode_of_payment)
		.map((payment, index) => ({
			mode_of_payment: payment.mode_of_payment,
			amount: 0,
			base_amount: 0,
			account: payment.account,
			type: payment.type,
			default: payment.default === 1 || payment.default === true || index === 0 ? 1 : 0,
		}));
};

const paymentCurrencyContext = (doc = invoice_doc.value) => ({
	...(doc || {}),
	pos_profile: pos_profile.value,
});

const syncPreferredPaymentToCurrentTotal = (doc = invoice_doc.value) => {
	if (
		!doc ||
		!Array.isArray(doc.payments) ||
		!doc.payments.length ||
		is_credit_sale.value ||
		is_credit_return.value
	) {
		return null;
	}

	const payments = doc.payments.filter((payment) => payment?.mode_of_payment);
	if (!payments.length) {
		return null;
	}

	const preferredPayment = resolvePreferredPaymentLine(doc, isCashLikePayment);
	if (!preferredPayment) {
		return null;
	}

	const otherMeaningfulPayments = payments.filter((payment) => {
		if (payment === preferredPayment) {
			return false;
		}
		return Math.abs(flt(payment.amount || 0, currency_precision.value)) > 0.0001;
	});

	if (otherMeaningfulPayments.length) {
		return preferredPayment;
	}

	const total = netInvoiceSettlementAmount.value;
	// For returns, cap the auto-filled refund at what was paid on the original
	// invoice (0 for an unpaid/credit invoice → recorded as a credit note).
	const normalizedTotal = resolveReturnDefaultAmount(doc, total);
	payments.forEach((payment) => {
		if (payment !== preferredPayment) {
			payment.amount = 0;
			if (payment.base_amount !== undefined) {
				payment.base_amount = 0;
			}
		}
	});

	preferredPayment.amount = normalizedTotal;
	if (preferredPayment.base_amount !== undefined) {
		preferredPayment.base_amount = flt(
			toCompanyCurrency(paymentCurrencyContext(doc), normalizedTotal),
			currency_precision.value,
		);
	}

	return preferredPayment;
};

const rebalancePreferredPaymentCoverage = (giftCardAmount = giftCardAppliedAmount.value) => {
	const doc = invoice_doc.value;
	if (
		!doc ||
		doc.is_return ||
		is_credit_sale.value ||
		!Array.isArray(doc.payments) ||
		!doc.payments.length
	) {
		return null;
	}

	return rebalancePreferredPaymentLine(doc, {
		precision: currency_precision.value,
		isCashLikePayment,
		loyaltyAmount: invoice_doc.value?.loyalty_amount || loyalty_amount.value,
		redeemedCustomerCredit: redeemed_customer_credit.value,
		giftCardAmount,
	});
};

const mergeProfilePaymentsIntoReturn = (doc) => {
	const profilePayments = buildProfilePaymentLines();
	if (!profilePayments.length) return;

	if (!Array.isArray(doc.payments)) {
		doc.payments = [];
	}

	const existingModes = new Set(doc.payments.map((p) => p?.mode_of_payment).filter(Boolean));

	profilePayments.forEach((pp) => {
		if (!existingModes.has(pp.mode_of_payment)) {
			doc.payments.push({
				mode_of_payment: pp.mode_of_payment,
				amount: 0,
				base_amount: 0,
				default: pp.default,
				account: pp.account,
				type: pp.type,
			});
		}
	});
};

const ensurePaymentLinesInitialized = (doc = invoice_doc.value) => {
	if (!doc) {
		return null;
	}

	if (!Array.isArray(doc.payments) || !doc.payments.length) {
		const fallbackPayments = buildProfilePaymentLines();
		if (fallbackPayments.length) {
			doc.payments = fallbackPayments;
		}
	}

	// For returns, always show all profile payment methods so user can split refund
	// NOTE: the is_credit_return default is decided once when the return is loaded
	// (send_invoice_doc_payment handler), NOT here — so reopening the dialog or a
	// failed submit never overrides the cashier's manual toggle. Here we only
	// honour the current toggle state.
	if (doc.is_return) {
		mergeProfilePaymentsIntoReturn(doc);
		if (is_credit_return.value) {
			// Credit return: keep every payment row at 0 so it is recorded as a
			// credit note that reduces the customer's balance (no cash refund).
			doc.payments.forEach((payment) => {
				payment.amount = 0;
				if (payment.base_amount !== undefined) {
					payment.base_amount = 0;
				}
			});
			return null;
		}
	}

	const initializedPayment = initializePaymentLinesForDialog(
		doc,
		currency_precision.value,
		isCashLikePayment,
	);

	if (doc.is_return) {
		ensureReturnPaymentsAreNegative();
	}

	syncPreferredPaymentToCurrentTotal(doc);

	return initializedPayment;
};

// Default a return to "Store as Credit?" (is_credit_return) when the original
// invoice was not fully paid. For an unpaid (credit) invoice this avoids paying
// out cash that was never collected and instead reduces the customer's balance,
// while the toggle is visibly ON; a fully paid invoice keeps the normal cash
// refund. The cap comes from posa_refundable_amount (= amount paid on the
// original) set when the return is loaded; if unknown we leave behaviour as is.
const applyReturnCreditDefault = (doc) => {
	if (!doc || !doc.is_return) {
		return;
	}
	if (!shouldApplyReturnRefundCap(doc)) {
		is_credit_return.value = false;
		is_cashback.value = true;
		return;
	}
	const refundable = doc.posa_refundable_amount;
	const returnTotal = Math.abs(flt(doc.rounded_total || doc.grand_total, currency_precision.value));
	const shouldCredit = flt(refundable, currency_precision.value) < returnTotal - 0.0001;
	is_credit_return.value = shouldCredit;
	is_cashback.value = !shouldCredit;
};

const restorePaymentLinesAfterFailedSubmit = () => {
	const doc = invoice_doc.value;
	if (!doc) {
		return;
	}

	ensurePaymentLinesInitialized(doc);
	is_credit_sale.value = false;
};

const enableShortcutCreditSale = () => {
	if (invoice_doc.value?.is_return) {
		return false;
	}

	if (!creditSaleAllowed.value) {
		toastStore.show({
			title: __("Credit Sale is not enabled in POS Profile"),
			color: "error",
		});
		frappe.utils.play_sound("error");
		return false;
	}

	clear_all_amounts();
	is_credit_sale.value = true;
	return true;
};

const focusSubmitButton = () => {
	const btn = submitButton.value;
	const el = btn && btn.$el ? btn.$el : btn;
	if (!el) {
		return false;
	}
	el.scrollIntoView?.({ behavior: "smooth", block: "center" });
	el.focus?.();
	highlightSubmit.value = true;
	return true;
};

const focusFirstPaymentTarget = () => {
	const root = paymentRoot.value;
	if (
		focusFirstKeyboardTarget(
			root,
			"[data-pos-keyboard-target='payment-amount'], [data-pos-keyboard-target='payment-action']",
		)
	) {
		highlightSubmit.value = false;
		return true;
	}

	return focusSubmitButton();
};

const handleShowPayment = () => {
	paymentVisible.value = true;
	nextTick(() => {
		setTimeout(() => {
			focusFirstPaymentTarget();
			if (eventBus && typeof eventBus.emit === "function") {
				eventBus.emit("payment_ui_ready");
			}
			if (queuedShortcutSubmit.value) {
				const payload = queuedShortcutSubmit.value;
				queuedShortcutSubmit.value = null;
				handleSubmitPaymentShortcut(payload || {});
			}
		}, 100);
	});
};

const handleCreditChangeUpdate = (value) => {
	setFormatedCurrency(credit_change, "value", null, false, value);
	updateCreditChange(credit_change.value);
};

const handleWriteOffAmountUpdate = (value) => {
	if (!invoice_doc.value) return;

	let nextAmount = flt(value || 0, currency_precision.value);
	const profileCap = writeOffProfileLimit.value;
	const diffCap = Math.max(diff_payment.value || 0, 0);
	const maxAmount = profileCap && profileCap > 0 ? Math.min(diffCap, profileCap) : diffCap;

	if (nextAmount < 0) {
		nextAmount = 0;
	}
	if (profileCap && profileCap > 0 && nextAmount > profileCap) {
		toastStore.show({
			title: __("Write off amount cannot exceed the POS profile maximum of {0}", [
				formatCurrency(profileCap),
			]),
			color: "error",
		});
		nextAmount = maxAmount;
	}
	if (nextAmount > maxAmount) {
		nextAmount = maxAmount;
	}

	invoice_doc.value.write_off_amount = nextAmount;
};

const handleRedemptionFormattedCurrency = (data) => {
	if (!data?.field) return;

	if (data.field === "loyalty_amount") {
		setFormatedCurrency(loyalty_amount, "value", null, false, data.value);
		return;
	}

	if (data.field === "redeemed_customer_credit") {
		setFormatedCurrency(redeemed_customer_credit, "value", null, false, data.value);
	}
};

const updateCreditChange = (rawValue) => {
	const changeLimit = Math.max(-diff_payment.value, 0);
	let requestedCredit = flt(Math.abs(rawValue) || 0, currency_precision.value);

	if (requestedCredit > changeLimit) {
		requestedCredit = changeLimit;
	}

	const remainingPaidChange = flt(changeLimit - requestedCredit, currency_precision.value);

	credit_change.value = requestedCredit;
	paid_change.value = remainingPaidChange;

	if (invoice_doc.value) {
		invoice_doc.value.credit_change = requestedCredit;
		invoice_doc.value.paid_change = remainingPaidChange;
	}
};

const handlePaymentAmountChange = (payment, event) => {
	last_payment_change_was_cash.value = isCashLikePayment(payment);
	setFormatedCurrency(payment, "amount", null, false, event);

	// For return invoices: user enters a positive number but we store it as negative (refund)
	if (invoice_doc.value?.is_return && payment.amount > 0) {
		payment.amount = -payment.amount;
	}
	if (payment.base_amount !== undefined) {
		payment.base_amount = flt(
			toCompanyCurrency(paymentCurrencyContext(), payment.amount),
			currency_precision.value,
		);
	}
};

const setPaymentToDenomination = (payment, amount) => {
	payment.amount = amount;
	if (payment.base_amount !== undefined) {
		payment.base_amount = flt(
			toCompanyCurrency(paymentCurrencyContext(), amount),
			currency_precision.value,
		);
	}
	last_payment_change_was_cash.value = isCashLikePayment(payment);
};

// UI Feedback Methods
const showPaidAmount = () => {
	toastStore.show({
		title: `Total Paid Amount: ${formatCurrency(total_payments.value)}`,
		color: "info",
	});
};

const creditSourceLabel = (row) => {
	if (!row) return "";
	const sourceLabel = row.source_type ? __(row.source_type) : null;
	if (sourceLabel) return `${sourceLabel}: ${row.credit_origin}`;
	return row.credit_origin;
};

const applyPaymentCustomerInfo = (info, customer) => {
	if (!info) return;
	const nextInfo = {
		...info,
		name: info.name || info.customer || customer,
		customer: info.customer || info.name || customer,
	};
	customer_info.value = nextInfo;
	customersStore.setCustomerInfo(nextInfo);
};

const refreshPaymentCustomerInfo = async (doc) => {
	const customer = typeof doc?.customer === "string" ? doc.customer.trim() : "";
	if (!customer) {
		return;
	}

	const cachedCustomer = await getStoredCustomer(customer);
	if (cachedCustomer?.name) {
		applyPaymentCustomerInfo(cachedCustomer, customer);
	}

	if (isOffline()) {
		return;
	}

	try {
		const result = await frappe.call({
			method: "posawesome.posawesome.api.customers.get_customer_info",
			args: {
				customer,
				company: pos_profile.value?.company || doc.company || null,
			},
		});
		if (result?.message && !result.exc) {
			applyPaymentCustomerInfo(result.message, customer);
		}
	} catch (error) {
		console.error("Failed to refresh payment customer loyalty details", error);
	}
};

const showDiffPayment = () => {
	if (!invoice_doc.value) return;
	toastStore.show({
		title: `To Be Paid: ${formatCurrency(
			diff_payment.value < 0 ? -diff_payment.value : diff_payment.value,
		)}`,
		color: "info",
	});
};

const showPaidChange = () => {
	toastStore.show({
		title: `Paid Change: ${formatCurrency(paid_change.value)}`,
		color: "info",
	});
};

// Background Check
const clearBackgroundStatusCheck = () => {
	if (backgroundStatusCheck.value) {
		clearTimeout(backgroundStatusCheck.value);
		backgroundStatusCheck.value = null;
	}
};

const resolveSubmittedDoctype = (doctype) => {
	if (doctype) return doctype;
	if (invoice_doc.value?.doctype) return invoice_doc.value.doctype;
	return pos_profile.value?.create_pos_invoice_instead_of_sales_invoice ? "POS Invoice" : "Sales Invoice";
};

const fetchSubmittedInvoiceDoc = async (invoiceName, doctype) => {
	const resolvedDoctype = resolveSubmittedDoctype(doctype);
	return frappe.db.get_doc(resolvedDoctype, invoiceName);
};

const waitForInvoiceSubmission = async (invoiceName, doctype) => {
	try {
		return await socketStore.waitForInvoiceProcessed(invoiceName, 45000);
	} catch (error) {
		const result = await frappe.call({
			method: "frappe.client.get_value",
			args: {
				doctype: resolveSubmittedDoctype(doctype),
				filters: { name: invoiceName },
				fieldname: ["docstatus"],
			},
		});
		if (result?.message?.docstatus === 1) {
			return {
				status: "processed",
				doctype: resolveSubmittedDoctype(doctype),
			};
		}
		throw error;
	}
};

const runDeferredPrintWorkflow = async ({
	name,
	doctype,
	waitForPostSubmitPayments = false,
	waitForInvoiceProcessing = false,
}) => {
	if (!name) return;

	let resolvedDoctype = resolveSubmittedDoctype(doctype);

	try {
		if (waitForInvoiceProcessing) {
			const processedState = await waitForInvoiceSubmission(name, resolvedDoctype);
			resolvedDoctype = processedState?.doctype || resolvedDoctype;
		}

		if (waitForPostSubmitPayments) {
			await socketStore.waitForPostSubmitPayments(name, 45000);
		}

		const freshDoc = await fetchSubmittedInvoiceDoc(name, resolvedDoctype);

		if (isOffline()) {
			await printOfflineInvoice(freshDoc);
			return;
		}

		await loadPrintPage({ doc: freshDoc, doctype: resolvedDoctype });
	} catch (error) {
		console.error("Deferred print failed", error);
		toastStore.show({
			title: __("Unable to print submitted invoice"),
			color: "error",
			detail: error?.message || __("Background processing did not finish in time."),
		});
	}
};

const scheduleBackgroundStatusCheck = ({
	name,
	doctype,
	print = false,
	waitForPostSubmitPayments = false,
	waitForInvoiceProcessing = false,
} = {}) => {
	clearBackgroundStatusCheck();

	if (!name) {
		return;
	}

	if (print && (waitForInvoiceProcessing || waitForPostSubmitPayments)) {
		void runDeferredPrintWorkflow({
			name,
			doctype,
			waitForPostSubmitPayments,
			waitForInvoiceProcessing,
		});
	}

	if (waitForInvoiceProcessing) {
		return;
	}

	backgroundStatusCheck.value = setTimeout(async () => {
		try {
			const result = await frappe.call({
				method: "frappe.client.get_value",
				args: {
					doctype: resolveSubmittedDoctype(doctype),
					filters: { name },
					fieldname: ["docstatus"],
				},
			});
			const status = result?.message?.docstatus;
			if (status === 1) {
				return;
			}
			const reason = __("Invoice is still in draft after background submission.");
			if (eventBus && typeof eventBus.emit === "function") {
				eventBus.emit("invoice_submission_failed", {
					invoice: name,
					reason,
				});
			}
			toastStore.show({
				title: __("Error submitting invoice: {0}", [name]),
				color: "error",
				detail: reason,
			});
		} catch (err) {
			console.error("Background status check failed", err);
		} finally {
			clearBackgroundStatusCheck();
		}
	}, 10000);
};

// Submission Wrapper
const submit = async (_event, payment_received = false, print = false) => {
	await submitInvoiceWrapper(print, undefined, {
		paymentReceived: payment_received,
	});
};

const submitInvoiceWrapper = async (print, callbackOverrides = {}, options = {}) => {
	if (submissionInFlight.value) {
		return;
	}

	submissionInFlight.value = true;
	loading.value = true;
	try {
		await validateSubmission(options.paymentReceived || false);
		await submitInvoice(print, {
			onPrint: (doc, printOptions = {}) => {
				if (print) {
					if (printOptions.waitForPostSubmitPayments || printOptions.waitForInvoiceProcessing) {
						void runDeferredPrintWorkflow({
							name: printOptions.name || doc?.name,
							doctype: printOptions.doctype,
							waitForPostSubmitPayments: Boolean(printOptions.waitForPostSubmitPayments),
							waitForInvoiceProcessing: Boolean(printOptions.waitForInvoiceProcessing),
						});
					} else if (isOffline()) {
						printOfflineInvoice(doc);
					} else {
						loadPrintPage({
							doc,
							doctype: printOptions.doctype,
							name: printOptions.name,
						});
					}
				}
			},
			onSuccess: () => {
				customer_credit_dict.value = [];
				redeem_customer_credit.value = false;
				is_cashback.value = true;
				show_change_dialog.value = true;
				is_credit_return.value = false;
				sales_person.value = "";
			},
			onFinishNavigation: (clearInvoice) => {
				finishSubmissionNavigation(clearInvoice);
			},
			onScheduleBackgroundCheck: (payload) => {
				scheduleBackgroundStatusCheck(payload);
			},
			...callbackOverrides,
		});
	} catch (error) {
		console.error("Submission failed propagate:", error);
		restorePaymentLinesAfterFailedSubmit();

		if (error?.message) {
			toastStore.show({
				title: error.message,
				color: "error",
			});
			frappe.utils.play_sound("error");
		}
	} finally {
		loading.value = false;
		submissionInFlight.value = false;
	}
};

// Keyboard Shortcuts
const handlePaymentShortcut = (event) => {
	if (event.defaultPrevented || submissionInFlight.value || loading.value) return;
	if (event.repeat) return;
	if (!paymentVisible.value) return;

	const isAltOnly = event.altKey && !event.ctrlKey && !event.metaKey;
	const key = event.key.toLowerCase();

	if (isAltOnly && key === "p") {
		event.preventDefault();
		event.stopPropagation();
		submit(null, false, true);
		return;
	}

	if ((isAltOnly || event.ctrlKey || event.metaKey) && key === "x") {
		event.preventDefault();
		event.stopPropagation();
		submit(null, false, false);
	}
};

const handleSubmitPaymentShortcut = ({ print = false, amount = null } = {}) => {
	if (!paymentVisible.value || submissionInFlight.value || loading.value) return;
	const submitShortcut = () => {
		nextTick(() => {
			submit(null, false, print);
		});
	};

	if (amount !== null) {
		const shortcutAmount = Number(amount);
		if (
			!invoice_doc.value?.is_return &&
			Number.isFinite(shortcutAmount) &&
			shortcutAmount === 0
		) {
			if (!enableShortcutCreditSale()) {
				return;
			}
			submitShortcut();
			return;
		}

		const applyShortcutAmount = () => {
			applyPreferredPaymentAmount(
				invoice_doc.value,
				shortcutAmount,
				currency_precision.value,
				isCashLikePayment,
			);
			submitShortcut();
		};

		if (is_credit_sale.value) {
			is_credit_sale.value = false;
			nextTick(applyShortcutAmount);
		} else {
			applyShortcutAmount();
		}
		return;
	}

	submitShortcut();
};

const queueShortcutSubmit = (payload = {}) => {
	queuedShortcutSubmit.value = payload;
	if (isPaymentOpen.value) {
		nextTick(() => {
			setTimeout(() => {
				if (!queuedShortcutSubmit.value) {
					return;
				}
				const pendingPayload = queuedShortcutSubmit.value;
				queuedShortcutSubmit.value = null;
				handleSubmitPaymentShortcut(pendingPayload || {});
			}, 150);
		});
	}
};

// Watchers
watch(
	() => uiStore.posProfile,
	(p) => {
		if (p) {
			pos_profile.value = p;
			stock_settings.value = uiStore.stockSettings || {};
			get_mpesa_modes();
			get_print_formats();
			resetGiftCardState({ clearPayment: true });
		}
	},
	{ immediate: true },
);

watch(
	invoiceType,
	(data) => {
		get_print_formats();
		if (invoice_doc.value && data !== "Order") {
			invoice_doc.value.posa_delivery_date = null;
			invoice_doc.value.posa_notes = null;
			invoice_doc.value.posa_authorization_code = null;
			invoice_doc.value.shipping_address_name = null;
		} else if (invoice_doc.value && data === "Order") {
			new_delivery_date.value = formatDateDisplay(frappe.datetime.now_date());
			update_delivery_date();
		}
		if (invoice_doc.value && data === "Return") {
			invoice_doc.value.is_return = 1;
			ensureReturnPaymentsAreNegative();
			is_return.value = true;
			is_credit_return.value = false;
			return_valid_upto_date.value = null;
		} else if (invoice_doc.value) {
			invoice_doc.value.is_return = 0;
			is_return.value = false;
			is_credit_return.value = false;
			return_valid_upto_date.value = null;
			restoreReturnPayments();
		}
	},
	{ immediate: true },
);

watch(diff_payment, (newVal) => {
	if (is_user_editing_paid_change.value) return;

	const lastEditWasCash = last_payment_change_was_cash.value;

	if (newVal < 0) {
		const changeDue = -newVal;
		if (lastEditWasCash === false) {
			paid_change.value = flt(changeDue, currency_precision.value);
			credit_change.value = 0;
		} else {
			paid_change.value = changeDue;
		}
	} else {
		updateCreditChange(0);
	}

	last_payment_change_was_cash.value = null;
});

watch(paid_change, (newVal) => {
	const changeLimit = Math.max(-diff_payment.value, 0);
	if (newVal > changeLimit) {
		paid_change.value = changeLimit;
		credit_change.value = 0;
		paid_change_rules.value = ["Paid change can not be greater than total change!"];
	} else {
		paid_change_rules.value = [];
		credit_change.value = flt(changeLimit - newVal, currency_precision.value);
	}

	const effectivePaid = Math.min(paid_change.value, changeLimit);
	const creditAmount = flt(changeLimit - effectivePaid, currency_precision.value);

	if (invoice_doc.value) {
		invoice_doc.value.paid_change = effectivePaid;
		invoice_doc.value.credit_change = creditAmount > 0 ? creditAmount : 0;
	}
});

watch(loyalty_amount, (value) => {
	if (!invoice_doc.value) return;
	const amount = parseFloat(value) || 0;
	if (amount <= 0) {
		invoice_doc.value.loyalty_amount = 0;
		invoice_doc.value.redeem_loyalty_points = 0;
		invoice_doc.value.loyalty_points = 0;
		if (flt(loyalty_amount.value) !== 0) {
			loyalty_amount.value = 0;
		}
		rebalancePreferredPaymentCoverage();
		return;
	}
	if (amount > available_points_amount.value + 0.001) {
		invoice_doc.value.loyalty_amount = 0;
		invoice_doc.value.redeem_loyalty_points = 0;
		invoice_doc.value.loyalty_points = 0;
		loyalty_amount.value = 0;
		toastStore.show({
			title: `Loyalty Amount can not be more than ${available_points_amount.value}`,
			color: "error",
		});
	} else {
		invoice_doc.value.loyalty_amount = flt(loyalty_amount.value);
		invoice_doc.value.redeem_loyalty_points = 1;

		let baseAmount = amount;

		baseAmount = toCompanyCurrency(paymentCurrencyContext(), amount);

		invoice_doc.value.loyalty_points = parseInt(
			baseAmount / (customer_info.value.conversion_factor || 1),
		);

		rebalancePreferredPaymentCoverage();
	}
});

watch(redeemed_customer_credit, () => {
	rebalancePreferredPaymentCoverage();
});

watch(sales_person, (newVal) => {
	if (!invoice_doc.value) return;
	if (newVal) {
		invoice_doc.value.sales_team = [
			{
				sales_person: newVal,
				allocated_percentage: 100,
			},
		];
	} else {
		invoice_doc.value.sales_team = [];
	}
});

watch(is_credit_sale, (newVal) => {
	if (!invoice_doc.value || !Array.isArray(invoice_doc.value.payments)) return;

	const doc = invoice_doc.value;

	// Always clear all payment methods first to prevent stale paid amounts.
	clear_all_amounts();

	if (!newVal && doc.payments.length) {
		const amount = flt(doc.rounded_total || doc.grand_total, currency_precision.value);
		const defaultPayment =
			doc.payments.find((payment) => payment.default === 1) ||
			doc.payments.find((payment) => isCashLikePayment(payment)) ||
			doc.payments[0];

		if (defaultPayment) {
			defaultPayment.amount = amount;
			if (defaultPayment.base_amount !== undefined) {
				defaultPayment.base_amount = flt(
					toCompanyCurrency(paymentCurrencyContext(doc), amount),
					currency_precision.value,
				);
			}
		}
	}
});

watch(is_credit_return, (newVal) => {
	if (!invoice_doc.value) return;
	if (newVal) {
		is_cashback.value = false;
		invoice_doc.value.payments.forEach((payment) => {
			payment.amount = 0;
			if (payment.base_amount !== undefined) {
				payment.base_amount = 0;
			}
		});
	} else {
		is_cashback.value = true;
		ensureReturnPaymentsAreNegative();
	}
});

// Keep "Cashback?" and "Store as Credit?" mutually exclusive for a return.
// The is_credit_return watch already flips is_cashback; this mirrors the other
// direction so toggling cashback also updates credit (you can't enable both).
// The reciprocal set lands on a value that is already correct, so the watches
// settle without looping.
watch(is_cashback, (newVal) => {
	if (!invoice_doc.value || !invoice_doc.value.is_return) return;
	const shouldCredit = !newVal;
	if (is_credit_return.value !== shouldCredit) {
		is_credit_return.value = shouldCredit;
	}
});

watch(
	() => invoice_doc.value.customer,
	(customer, previous) => {
		if (customer && customer !== previous) {
			get_addresses();
			set_print_format();
		} else if (!customer) {
			addresses.value = [];
			set_print_format();
		}
	},
);

watch(isPaymentOpen, (isOpen) => {
	if (isOpen) {
		ensurePaymentLinesInitialized();
		handleShowPayment();
	} else {
		releaseActiveFocus();
		paymentVisible.value = false;
		highlightSubmit.value = false;
		queuedShortcutSubmit.value = null;
		giftCardDialogOpen.value = false;
	}
});

watch(
	() => invoice_doc.value.posa_delivery_date,
	(date) => {
		if (!date) {
			if (invoice_doc.value) {
				invoice_doc.value.shipping_address_name = null;
			}
			addresses.value = [];
			return;
		}
		if (invoice_doc.value && invoice_doc.value.customer) {
			get_addresses();
		}
	},
);

watch(
	customerInfo,
	(newInfo) => {
		customer_info.value = newInfo || "";
		set_print_format();
	},
	{ immediate: true },
);

watch(selectedCustomer, (newCustomer, oldCustomer) => {
	if (newCustomer === oldCustomer) return;
	customer_credit_dict.value = [];
	redeem_customer_credit.value = false;
	is_cashback.value = true;
	is_credit_return.value = false;
	loyalty_amount.value = 0;
	resetGiftCardState({ clearPayment: true });

	if (invoice_doc.value) {
		invoice_doc.value.loyalty_amount = 0;
		invoice_doc.value.redeem_loyalty_points = 0;
		invoice_doc.value.loyalty_points = 0;
	}
});

// Lifecycle
onMounted(() => {
	_shortcutHandlers.value.handlePaymentShortcut = handlePaymentShortcut.bind(this);
	document.addEventListener("keydown", _shortcutHandlers.value.handlePaymentShortcut);

	syncStore.syncPendingInvoices();
	eventBus.on("network-online", () => syncStore.syncPendingInvoices());
	eventBus.on("server-online", () => syncStore.syncPendingInvoices());

	if (eventBus) {
		eventBus.on("send_invoice_doc_payment", (doc) => {
			invoiceStore.setInvoiceDoc(doc);
			void refreshPaymentCustomerInfo(doc);
			paid_change.value = flt(doc.paid_change || 0, currency_precision.value);
			credit_change.value = flt(doc.credit_change || 0, currency_precision.value);
			last_payment_change_was_cash.value = null;
			is_credit_sale.value = false;
			is_write_off_change.value = false;

			// Decide the credit-return default ONCE, when the return is first
			// loaded, so reopening the dialog / a failed submit never overrides a
			// manual toggle change by the cashier.
			if (doc.is_return) {
				applyReturnCreditDefault(doc);
			}

			const initializedPayment = ensurePaymentLinesInitialized(doc);

			if (doc.is_return) {
				is_return.value = true;
				// is_credit_return default was applied above on load; don't override.
			} else if (initializedPayment) {
				is_credit_return.value = false;
			}
			initializeReturnValidity(doc);
			loyalty_amount.value = 0;
			redeemed_customer_credit.value = 0;
			resetGiftCardState({ clearPayment: true });
			if (doc.customer) {
				get_addresses();
			}
			get_sales_person_names();
		});

		eventBus.on("register_pos_profile", (data) => {
			pos_profile.value = data.pos_profile;
			stock_settings.value = data.stock_settings;
		});
		eventBus.on("add_the_new_address", (data) => {
			const normalized = normalizeAddress(data);
			if (normalized) {
				const existing = addresses.value.filter((addr) => addr.name !== normalized.name);
				addresses.value = [...existing, normalized];
				if (invoice_doc.value) {
					invoice_doc.value.shipping_address_name = normalized.name;
				}
			}
		});
		eventBus.on("set_pos_settings", (data) => {
			pos_settings.value = data || {};
			if (invoice_doc.value && !invoice_doc.value.is_return) {
				initializeReturnValidity(invoice_doc.value);
			}
		});
		eventBus.on("set_mpesa_payment", (data) => {
			set_mpesa_payment(data);
		});
		eventBus.on("queue_submit_payment_shortcut", queueShortcutSubmit);
		eventBus.on("submit_payment_shortcut", handleSubmitPaymentShortcut);
		eventBus.on("clear_invoice", () => {
			invoiceStore.clear();
			invoiceStore.resetPostingDate();
			is_return.value = false;
			is_credit_return.value = false;
			return_valid_upto_date.value = null;
			resetGiftCardState({ clearPayment: true });
		});
	}

	if (isPaymentOpen.value) {
		handleShowPayment("true");
	}
});

onBeforeUnmount(() => {
	eventBus.off("send_invoice_doc_payment");
	eventBus.off("register_pos_profile");
	eventBus.off("add_the_new_address");
	eventBus.off("set_pos_settings");
	eventBus.off("set_mpesa_payment");
	eventBus.off("queue_submit_payment_shortcut", queueShortcutSubmit);
	eventBus.off("submit_payment_shortcut", handleSubmitPaymentShortcut);
	eventBus.off("clear_invoice");
	eventBus.off("network-online");
	eventBus.off("server-online");
	clearBackgroundStatusCheck();

	if (_shortcutHandlers.value.handlePaymentShortcut) {
		document.removeEventListener("keydown", _shortcutHandlers.value.handlePaymentShortcut);
	}
});

defineExpose({
	focusFirstPaymentTarget,
});
</script>

<style scoped>
/* POS Payment Shell Layout Rules */

.payment-shell {
	--payment-space-1: 4px;
	--payment-space-2: 8px;
	--payment-space-3: 12px;
	--payment-space-4: 16px;

	--payment-radius-sm: 8px;
	--payment-radius-md: 10px;
	--payment-radius-lg: 14px;

	--payment-font-caption: 11px;
	--payment-font-body: 13px;
	--payment-font-label: 12px;
	--payment-font-section: 13px;
	--payment-font-title: 18px;
	--payment-font-total: 21px;

	--payment-icon-sm: 16px;
	--payment-icon-md: 18px;
	--payment-icon-box: 28px;

	--payment-control-desktop: 40px;
	--payment-control-tablet: 42px;
	--payment-control-phone: 44px;

	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
	display: grid;
	grid-template-rows: 64px 76px minmax(0, 1fr) 60px;
	overflow: hidden;
	background: var(--pos-bg-primary, var(--pos-surface, #f8fafc));
	color: var(--pos-text-primary, #0f172a);
}

.payment-shell--dialog {
	border-radius: inherit;
}

/* Explicit Viewport Mode Grid Rules */
.payment-shell--desktop {
	grid-template-rows: 64px 76px minmax(0, 1fr) 60px;
}

.payment-shell--desktop .payment-layout {
	display: grid;
	grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
	gap: var(--payment-space-3);
	align-items: start;
}

.payment-shell--tablet-landscape {
	grid-template-rows: 58px 72px minmax(0, 1fr) 60px;
}

.payment-shell--tablet-landscape .payment-shell__body {
	padding: var(--payment-space-2);
}

.payment-shell--tablet-landscape .payment-layout {
	display: grid;
	grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
	gap: var(--payment-space-2);
	align-items: start;
}

.payment-shell--tablet-portrait {
	grid-template-rows: 56px 72px minmax(0, 1fr) auto;
}

.payment-shell--tablet-portrait .payment-layout {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2);
	width: 100%;
	min-width: 0;
	align-items: stretch;
}

.payment-shell--phone {
	height: 100dvh;
	min-height: 0;
	grid-template-rows: 52px 60px minmax(0, 1fr) auto;
}

.payment-shell--phone .payment-shell__body {
	padding: 6px;
	scroll-padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
}

.payment-shell--phone .payment-layout {
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: 100%;
	min-width: 0;
	align-items: stretch;
}

.payment-shell--phone .payment-layout__primary,
.payment-shell--phone .payment-layout__secondary,
.payment-shell--tablet-portrait .payment-layout__primary,
.payment-shell--tablet-portrait .payment-layout__secondary {
	width: 100%;
	min-width: 0;
	align-items: stretch;
}

.payment-section-header-total {
	margin-inline-start: auto;
	font-size: var(--payment-font-label, 12px);
	font-weight: 750;
	font-variant-numeric: tabular-nums;
	color: var(--pos-primary, #2563eb);
	white-space: nowrap;
}

/* Header Region */
.payment-screen-header {
	height: 100%;
	min-height: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-inline: 14px;
	background: var(--pos-card-bg, var(--pos-surface-raised, #ffffff));
	border-bottom: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
}

/* Compact Overview Region */
.payment-shell__overview {
	height: 100%;
	min-height: 0;
	padding: var(--payment-space-2);
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
	border-bottom: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	overflow: hidden;
}

.payment-overview-grid {
	height: 100%;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--payment-space-2);
}

.payment-overview-metric {
	min-height: 0;
	height: 100%;
	padding: 6px 10px;
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	border-radius: var(--payment-radius-sm, 8px);
	background: var(--pos-card-bg, var(--pos-surface-raised, #ffffff));
	text-align: start;
}

/* Body Scroll Container */
.payment-shell__body {
	min-width: 0;
	min-height: 0;
	padding: var(--payment-space-3);
	overflow-y: auto;
	overflow-x: hidden;
	overscroll-behavior: contain;
}

.payment-layout {
	display: grid;
	grid-template-columns: minmax(0, 1.12fr) minmax(350px, 0.88fr);
	gap: var(--payment-space-3);
	width: 100%;
	min-width: 0;
	align-items: start;
}

.payment-layout__primary,
.payment-layout__secondary {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-2);
	min-width: 0;
}

/* Control Density Inheritance */
.payment-shell--desktop :deep(.v-field) {
	min-height: var(--payment-control-desktop);
}

.payment-shell--tablet-landscape :deep(.v-field),
.payment-shell--tablet-portrait :deep(.v-field) {
	min-height: var(--payment-control-tablet);
}

.payment-shell--phone :deep(.v-field) {
	min-height: var(--payment-control-phone);
}

.payment-shell :deep(.v-field__input) {
	min-height: inherit;
	padding-block: 4px;
	font-size: var(--payment-font-body);
}

/* Fixed Action Footer (Row 4) */
.payment-shell__footer {
	height: 100%;
	min-height: 60px;
	display: flex;
	align-items: center;
	padding: var(--payment-space-2) var(--payment-space-3);
	background: var(--pos-card-bg, var(--pos-surface-raised, #ffffff));
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	box-shadow: 0 -4px 12px var(--pos-shadow-light, rgba(0, 0, 0, 0.03));
	overflow: hidden;
}

.submit-highlight {
	box-shadow: 0 0 0 4px rgb(var(--v-theme-primary));
	transition: box-shadow 0.3s ease-in-out;
}
</style>
