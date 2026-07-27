import { computed, type Ref } from "vue";
import { parseBooleanSetting } from "../../utils/stock";

export interface PosRuntimeCapabilitiesParams {
	posProfile: Ref<any>;
	posSettings?: Ref<any>;
	invoiceDoc: Ref<any>;
	customerInfo?: Ref<any>;
	invoiceType?: Ref<string>;
	currentCashier?: Ref<any>;
	isCashback?: Ref<any>;
	isCreditSale?: Ref<any>;
	returnSettlementMode?: Ref<string>;
}

export function usePosRuntimeCapabilities(params: PosRuntimeCapabilitiesParams) {
	const {
		posProfile,
		posSettings,
		invoiceDoc,
		customerInfo,
		invoiceType,
		currentCashier,
		isCashback,
		isCreditSale,
		returnSettlementMode,
	} = params;

	const isReturn = computed(() => Boolean(invoiceDoc.value?.is_return));

	// ── Products & Browsing (Verified POS Profile fields) ──
	const products = {
		allowItemGroups: computed(() => parseBooleanSetting(posProfile.value?.posa_use_item_groups)),
		allowStockDisplay: computed(() => parseBooleanSetting(posProfile.value?.posa_display_items_in_stock)),
		allowWarehouseSelection: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_user_to_edit_warehouse)),
		allowRateChange: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_user_to_edit_rate) && !isReturn.value),
		allowDiscount: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_user_to_edit_discount) && !isReturn.value),
		allowAlternateUom: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_change_uom)),
	};

	// ── Cart & Discounts ──
	const cart = {
		allowQuantityEdit: computed(() => true),
		allowRateEdit: products.allowRateChange,
		allowItemDiscount: products.allowDiscount,
		allowOrderDiscount: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_discount_on_grand_total) && !isReturn.value),
		allowCoupon: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_coupon_code) && !isReturn.value),
		allowClearCart: computed(() => true),
	};

	// ── Customer & Credit ──
	const customer = {
		allowSelection: computed(() => true),
		allowCredit: computed(() => {
			const enabled = parseBooleanSetting(
				posProfile.value?.use_customer_credit ?? posProfile.value?.posa_use_customer_credit,
			);
			return !isReturn.value && enabled && Boolean(invoiceDoc.value?.customer);
		}),
		allowLoyalty: computed(() => {
			const points = Number(customerInfo?.value?.loyalty_points || 0);
			return !isReturn.value && Number.isFinite(points) && points > 0;
		}),
		allowAddress: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_sales_order)),
	};

	// ── Order & Fulfillment ──
	const fulfillment = {
		allowSalesOrder: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_sales_order)),
		allowDeliveryDate: computed(() => {
			return (
				parseBooleanSetting(posProfile.value?.posa_allow_sales_order) &&
				(invoiceType?.value === "Order" || Boolean(invoiceDoc.value?.posa_delivery_date))
			);
		}),
		allowShippingAddress: computed(() => {
			return parseBooleanSetting(posProfile.value?.posa_allow_sales_order) && Boolean(invoiceDoc.value?.posa_delivery_date);
		}),
		allowPurchaseOrder: computed(() => {
			return (
				parseBooleanSetting(posProfile.value?.posa_allow_customer_purchase_order) &&
				Boolean(invoiceDoc.value)
			);
		}),
		allowReturnValidity: computed(() => {
			return (
				!isReturn.value &&
				(parseBooleanSetting(posProfile.value?.posa_enable_return_validity) ||
					parseBooleanSetting(posSettings?.value?.posa_enable_return_validity))
			);
		}),
	};

	// ── Payment & Settlement Options ──
	const allowCreditSale = computed(() => parseBooleanSetting(posProfile.value?.posa_allow_credit_sale));
	const allowWriteOff = computed(() => parseBooleanSetting(posProfile.value?.posa_allow_write_off_change));
	const allowCashback = computed(() => parseBooleanSetting(posProfile.value?.use_cashback));
	const allowCustomerCredit = customer.allowCredit;
	const allowStoreAsCredit = computed(() => {
		const enabled = parseBooleanSetting(
			posProfile.value?.use_customer_credit ?? posProfile.value?.posa_use_customer_credit,
		);
		return isReturn.value && enabled && Boolean(invoiceDoc.value?.customer);
	});

	const allowNormalPaymentMethods = computed(() => {
		return Boolean(invoiceDoc.value) && !isReturn.value && !(isCreditSale?.value ?? false);
	});

	const allowReturnPaymentMethods = computed(() => {
		if (!isReturn.value) return false;
		if (returnSettlementMode?.value) {
			return returnSettlementMode.value === "cashback";
		}
		return Boolean(isCashback?.value ?? true);
	});

	const showPaymentMethods = computed(() => {
		return allowNormalPaymentMethods.value || allowReturnPaymentMethods.value;
	});

	const allowGiftCards = computed(() => {
		const enabled = parseBooleanSetting(posProfile.value?.posa_use_gift_cards);
		return showPaymentMethods.value && enabled && !isReturn.value;
	});

	const payment = {
		allowCreditSale,
		allowWriteOff,
		allowCashback,
		allowCustomerCredit,
		allowStoreAsCredit,
		allowLoyalty: customer.allowLoyalty,
		allowGiftCards,
		allowMpesa: computed(() => {
			const payments = Array.isArray(posProfile.value?.payments) ? posProfile.value.payments : [];
			return showPaymentMethods.value && payments.some((p: any) => p.is_mpesa_c2b || String(p.mode_of_payment || "").toLowerCase().includes("mpesa"));
		}),
		allowPhoneRequest: computed(() => {
			const payments = Array.isArray(posProfile.value?.payments) ? posProfile.value.payments : [];
			return showPaymentMethods.value && payments.some((p: any) => p.request_for_payment || String(p.mode_of_payment || "").toLowerCase().includes("phone"));
		}),
		allowDenominations: computed(() => showPaymentMethods.value),
		allowPrintFormat: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_select_print_format_in_payments)),
		showPaymentMethods,
	};

	// ── Actions & Permissions ──
	const actions = {
		allowSubmit: computed(() => Boolean(invoiceDoc.value)),
		allowSubmitAndPrint: computed(() => Boolean(invoiceDoc.value)),
		isSupervisor: computed(() => parseBooleanSetting(currentCashier?.value?.is_supervisor)),
	};

	return {
		isReturn,
		products,
		cart,
		customer,
		fulfillment,
		payment,
		actions,

		// Top-level aliases for direct component binding compatibility
		allowStockDisplay: products.allowStockDisplay,
		allowMultiCurrency: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_multi_currency)),
		allowAdditionalDiscount: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_user_to_edit_additional_discount)),
		usePercentageDiscount: computed(() => parseBooleanSetting(posProfile.value?.posa_use_percentage_discount)),
		allowDeliveryCharges: computed(() => parseBooleanSetting(posProfile.value?.posa_use_delivery_charges)),
		allowPostingDateChange: computed(() => parseBooleanSetting(posProfile.value?.posa_allow_change_posting_date)),
		showPaymentMethods,
		showImmediateSettlement: showPaymentMethods,
		allowCreditSale,
		allowWriteOff,
		allowCashback,
		allowCustomerCredit,
		allowStoreAsCredit,
		showCreditReturn: allowStoreAsCredit,
		allowGiftCards,
		showGiftCards: allowGiftCards,
		allowLoyaltyRedemption: customer.allowLoyalty,
		showLoyaltyRedemption: customer.allowLoyalty,
		allowSalesOrder: fulfillment.allowSalesOrder,
		allowDeliveryDate: fulfillment.allowDeliveryDate,
		allowShippingAddress: fulfillment.allowShippingAddress,
		allowReturnValidity: fulfillment.allowReturnValidity,
		allowPurchaseOrder: fulfillment.allowPurchaseOrder,
		allowSalesPerson: computed(() => true),
		allowPrintFormat: payment.allowPrintFormat,
		isSupervisor: actions.isSupervisor,
	};
}
