import { computed, type Ref } from "vue";
import { parseBooleanSetting } from "../../../utils/stock";

export interface PaymentUiCapabilitiesParams {
	posProfile: Ref<any>;
	posSettings?: Ref<any>;
	invoiceDoc: Ref<any>;
	customerInfo?: Ref<any>;
	invoiceType?: Ref<string>;
	currentCashier?: Ref<any>;
	isCashback?: Ref<any>;
}

export function usePaymentUiCapabilities(params: PaymentUiCapabilitiesParams) {
	const {
		posProfile,
		posSettings,
		invoiceDoc,
		customerInfo,
		invoiceType,
		currentCashier,
		isCashback,
	} = params;

	const isReturn = computed(() => Boolean(invoiceDoc.value?.is_return));

	// ── Credit Sale ──
	const allowCreditSale = computed(() =>
		parseBooleanSetting(posProfile.value?.posa_allow_credit_sale),
	);

	const allowCreditDueDate = computed(() => allowCreditSale.value);

	// ── Write Off ──
	const allowWriteOff = computed(() =>
		parseBooleanSetting(posProfile.value?.posa_allow_write_off_change),
	);

	// ── Cashback (Return settlement via payment methods) ──
	const allowCashback = computed(() =>
		parseBooleanSetting(posProfile.value?.use_cashback),
	);

	// ── Customer Credit ──
	const customerCreditEnabled = computed(() =>
		parseBooleanSetting(
			posProfile.value?.use_customer_credit ?? posProfile.value?.posa_use_customer_credit,
		),
	);

	const allowCustomerCredit = computed(() => {
		const hasCustomer = Boolean(invoiceDoc.value?.customer);
		return !isReturn.value && customerCreditEnabled.value && hasCustomer;
	});

	// ── Store Return as Credit ──
	const allowStoreAsCredit = computed(() => {
		return isReturn.value && customerCreditEnabled.value && Boolean(invoiceDoc.value?.customer);
	});

	// ── Credit Return (alias for section visibility) ──
	const showCreditReturn = computed(() => allowStoreAsCredit.value);

	// ── Immediate Settlement (Payment Methods visible) ──
	const showImmediateSettlement = computed(() => {
		return Boolean((isCashback?.value ?? true) && invoiceDoc.value);
	});

	// ── Gift Cards ──
	const allowGiftCards = computed(() => {
		const enabled = parseBooleanSetting(posProfile.value?.posa_use_gift_cards);
		return showImmediateSettlement.value && enabled && !isReturn.value;
	});

	// ── Loyalty ──
	// No POS Profile field exists for loyalty. Controlled entirely by
	// ERPNext Loyalty Program + Customer eligibility (points > 0).
	const allowLoyaltyRedemption = computed(() => {
		const points = Number(customerInfo?.value?.loyalty_points || 0);
		return !isReturn.value && Number.isFinite(points) && points > 0;
	});

	// ── Customer Credit Details (within Settlement section) ──
	const showCustomerCreditDetails = computed(() => allowCustomerCredit.value);

	// ── Redemption Section (Loyalty) ──
	const showRedemptionSection = computed(() => allowLoyaltyRedemption.value);

	// ── Settlement Options Section ──
	const showSettlementOptions = computed(() => {
		return (
			allowCreditSale.value ||
			allowWriteOff.value ||
			allowCashback.value ||
			showCreditReturn.value ||
			allowStoreAsCredit.value ||
			showCustomerCreditDetails.value
		);
	});

	// ── Sales Order / Delivery ──
	const allowSalesOrder = computed(() =>
		parseBooleanSetting(posProfile.value?.posa_allow_sales_order),
	);

	const allowDeliveryDate = computed(() => {
		return (
			allowSalesOrder.value &&
			(invoiceType?.value === "Order" || Boolean(invoiceDoc.value?.posa_delivery_date))
		);
	});

	const allowShippingAddress = computed(() => {
		return allowSalesOrder.value && Boolean(invoiceDoc.value?.posa_delivery_date);
	});

	// ── Return Validity ──
	const allowReturnValidity = computed(() => {
		return (
			!isReturn.value &&
			(parseBooleanSetting(posProfile.value?.posa_enable_return_validity) ||
				parseBooleanSetting(posSettings?.value?.posa_enable_return_validity))
		);
	});

	// ── Additional Notes ──
	const allowAdditionalNotes = computed(() =>
		parseBooleanSetting(posProfile.value?.posa_display_additional_notes),
	);

	// ── Authorization Code ──
	const allowAuthorizationCode = computed(() =>
		parseBooleanSetting(posProfile.value?.posa_display_authorization_code),
	);

	// ── Purchase Order ──
	const allowPurchaseOrder = computed(() => {
		return (
			parseBooleanSetting(posProfile.value?.posa_allow_customer_purchase_order) &&
			Boolean(invoiceDoc.value)
		);
	});

	// ── Sales Person (always available — no POS Profile field) ──
	const allowSalesPerson = computed(() => true);

	// ── Print Format ──
	const allowPrintFormat = computed(() =>
		parseBooleanSetting(posProfile.value?.posa_allow_select_print_format_in_payments),
	);

	// ── Order & Fulfillment Section ──
	const showOrderDetails = computed(() => {
		return (
			allowDeliveryDate.value ||
			allowReturnValidity.value ||
			allowShippingAddress.value ||
			allowAdditionalNotes.value ||
			allowAuthorizationCode.value ||
			allowPurchaseOrder.value
		);
	});

	// ── Sales & Receipt Section ──
	const showSalesAndReceiptDetails = computed(() => {
		return allowSalesPerson.value || allowPrintFormat.value;
	});

	// ── Supervisor ──
	const isSupervisor = computed(() =>
		parseBooleanSetting(currentCashier?.value?.is_supervisor),
	);

	// ── Snapshot for profile-switch diffing ──
	const snapshotCapabilities = () => ({
		allowCreditSale: allowCreditSale.value,
		allowWriteOff: allowWriteOff.value,
		allowCashback: allowCashback.value,
		allowCustomerCredit: allowCustomerCredit.value,
		allowStoreAsCredit: allowStoreAsCredit.value,
		allowLoyaltyRedemption: allowLoyaltyRedemption.value,
		allowGiftCards: allowGiftCards.value,
		allowSalesOrder: allowSalesOrder.value,
		allowDeliveryDate: allowDeliveryDate.value,
		allowShippingAddress: allowShippingAddress.value,
		allowReturnValidity: allowReturnValidity.value,
		allowAdditionalNotes: allowAdditionalNotes.value,
		allowAuthorizationCode: allowAuthorizationCode.value,
		allowPurchaseOrder: allowPurchaseOrder.value,
		allowSalesPerson: allowSalesPerson.value,
		allowPrintFormat: allowPrintFormat.value,
		isSupervisor: isSupervisor.value,
	});

	return {
		isReturn,
		// Settlement & Payment
		showImmediateSettlement,
		allowCreditSale,
		allowCreditDueDate,
		allowWriteOff,
		allowCashback,
		allowCustomerCredit,
		allowStoreAsCredit,
		showCreditReturn,
		showCustomerCreditDetails,
		showSettlementOptions,
		// Gift Cards
		allowGiftCards,
		// Loyalty & Redemption
		allowLoyaltyRedemption,
		showRedemptionSection,
		// Order & Fulfillment
		allowSalesOrder,
		allowDeliveryDate,
		allowShippingAddress,
		allowReturnValidity,
		allowAdditionalNotes,
		allowAuthorizationCode,
		allowPurchaseOrder,
		// Sales & Receipt
		allowSalesPerson,
		allowPrintFormat,
		// Sections
		showOrderDetails,
		showSalesAndReceiptDetails,
		// Permissions
		isSupervisor,
		// Utility
		snapshotCapabilities,

		// Backward-compatible aliases (old show* names → new allow* names)
		showGiftCards: allowGiftCards,
		showLoyaltyRedemption: allowLoyaltyRedemption,
		showCreditSale: allowCreditSale,
		showWriteOff: allowWriteOff,
		showCashback: allowCashback,
		showStoreAsCredit: allowStoreAsCredit,
		showCustomerCreditRedemption: allowCustomerCredit,
		showDeliveryDate: allowDeliveryDate,
		showReturnValidity: allowReturnValidity,
		showShippingAddress: allowShippingAddress,
		showAdditionalNotes: allowAdditionalNotes,
		showAuthorizationCode: allowAuthorizationCode,
		showPurchaseOrder: allowPurchaseOrder,
		showSalesPerson: allowSalesPerson,
		showPrintFormat: allowPrintFormat,
	};
}
