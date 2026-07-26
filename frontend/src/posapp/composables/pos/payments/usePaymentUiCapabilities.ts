import { computed, type Ref } from "vue";
import { parseBooleanSetting } from "../../../utils/stock";

export interface PaymentUiCapabilitiesParams {
	posProfile: Ref<any>;
	posSettings?: Ref<any>;
	invoiceDoc: Ref<any>;
	customerInfo?: Ref<any>;
	invoiceType?: Ref<string>;
	currentCashier?: Ref<any>;
}

export function usePaymentUiCapabilities(params: PaymentUiCapabilitiesParams) {
	const {
		posProfile,
		posSettings,
		invoiceDoc,
		customerInfo,
		invoiceType,
		currentCashier,
	} = params;

	const isReturn = computed(() => Boolean(invoiceDoc.value?.is_return));

	// Gift Cards Capability
	const showGiftCards = computed(() => {
		const enabled = parseBooleanSetting(posProfile.value?.posa_use_gift_cards);
		return enabled && !isReturn.value;
	});

	// Redemption Capabilities
	const showLoyaltyRedemption = computed(() => {
		const points = Number(customerInfo?.value?.loyalty_points || 0);
		return !isReturn.value && Number.isFinite(points) && points > 0;
	});

	const showCustomerCreditRedemption = computed(() => {
		const creditEnabled = parseBooleanSetting(
			posProfile.value?.use_customer_credit ?? posProfile.value?.posa_use_customer_credit,
		);
		const hasCustomer = Boolean(invoiceDoc.value?.customer);
		return !isReturn.value && creditEnabled && hasCustomer;
	});

	const showRedemptionSection = computed(() => {
		return showLoyaltyRedemption.value || showCustomerCreditRedemption.value;
	});

	// Settlement Capabilities
	const showCreditSale = computed(() => {
		return parseBooleanSetting(posProfile.value?.posa_allow_credit_sale);
	});

	const showWriteOff = computed(() => {
		return parseBooleanSetting(posProfile.value?.posa_allow_write_off_change);
	});

	const showCashback = computed(() => {
		return parseBooleanSetting(posProfile.value?.use_cashback);
	});

	const showCreditReturn = computed(() => {
		return isReturn.value;
	});

	const showStoreAsCredit = computed(() => {
		return (
			parseBooleanSetting(
				posProfile.value?.use_customer_credit ?? posProfile.value?.posa_use_customer_credit,
			) && Boolean(invoiceDoc.value?.customer)
		);
	});

	const showCustomerCreditDetails = computed(() => {
		return showCustomerCreditRedemption.value;
	});

	const showSettlementOptions = computed(() => {
		return (
			showCreditSale.value ||
			showWriteOff.value ||
			showCashback.value ||
			showCreditReturn.value ||
			showStoreAsCredit.value ||
			showCustomerCreditDetails.value
		);
	});

	// Order & Fulfillment Capabilities
	const showDeliveryDate = computed(() => {
		return (
			parseBooleanSetting(posProfile.value?.posa_allow_sales_order) &&
			(invoiceType?.value === "Order" || Boolean(invoiceDoc.value?.posa_delivery_date))
		);
	});

	const showReturnValidity = computed(() => {
		return (
			!isReturn.value &&
			(parseBooleanSetting(posProfile.value?.posa_enable_return_validity) ||
				parseBooleanSetting(posSettings?.value?.posa_enable_return_validity))
		);
	});

	const showShippingAddress = computed(() => {
		return Boolean(invoiceDoc.value?.posa_delivery_date);
	});

	const showAdditionalNotes = computed(() => {
		return parseBooleanSetting(posProfile.value?.posa_display_additional_notes);
	});

	const showAuthorizationCode = computed(() => {
		return parseBooleanSetting(posProfile.value?.posa_display_authorization_code);
	});

	const showPurchaseOrder = computed(() => {
		return (
			parseBooleanSetting(posProfile.value?.posa_allow_customer_purchase_order) &&
			Boolean(invoiceDoc.value)
		);
	});

	const showSalesPerson = computed(() => {
		return true; // Sales Person selector is standard unless cashier is restricted
	});

	const showPrintFormat = computed(() => {
		return parseBooleanSetting(posProfile.value?.posa_allow_select_print_format_in_payments);
	});

	const showOrderDetails = computed(() => {
		return (
			showDeliveryDate.value ||
			showReturnValidity.value ||
			showShippingAddress.value ||
			showAdditionalNotes.value ||
			showAuthorizationCode.value ||
			showPurchaseOrder.value
		);
	});

	const showSalesAndReceiptDetails = computed(() => {
		return showSalesPerson.value || showPrintFormat.value;
	});

	const isSupervisor = computed(() => {
		return parseBooleanSetting(currentCashier?.value?.is_supervisor);
	});

	return {
		isReturn,
		showGiftCards,
		showLoyaltyRedemption,
		showCustomerCreditRedemption,
		showRedemptionSection,
		showCreditSale,
		showWriteOff,
		showCashback,
		showCreditReturn,
		showStoreAsCredit,
		showCustomerCreditDetails,
		showSettlementOptions,
		showDeliveryDate,
		showReturnValidity,
		showShippingAddress,
		showAdditionalNotes,
		showAuthorizationCode,
		showPurchaseOrder,
		showSalesPerson,
		showPrintFormat,
		showOrderDetails,
		showSalesAndReceiptDetails,
		isSupervisor,
	};
}
