export function parseBooleanSetting(val: any, defaultValue: boolean = true): boolean {
	if (val === undefined || val === null) return defaultValue;
	if (typeof val === "boolean") return val;
	if (typeof val === "number") return val !== 0;
	if (typeof val === "string") {
		const clean = val.trim().toLowerCase();
		if (clean === "0" || clean === "false" || clean === "off" || clean === "no" || clean === "") return false;
		if (clean === "1" || clean === "true" || clean === "on" || clean === "yes") return true;
		return defaultValue;
	}
	return Boolean(val);
}

export function isLockedPromotionLine(item: any): boolean {
	if (!item) return false;
	return Boolean(item.posa_is_offer || item.posa_is_replace || item.is_free_item);
}

export function isPricingLocked(item: any, isReturnInvoice?: boolean): boolean {
	if (!item) return false;
	return Boolean(
		isLockedPromotionLine(item) ||
		item.posa_offer_applied ||
		isReturnInvoice
	);
}

export function canEditRate(posProfile: any, item: any, isReturnInvoice?: boolean): boolean {
	if (!parseBooleanSetting(posProfile?.posa_allow_user_to_edit_rate)) return false;
	return !isPricingLocked(item, isReturnInvoice);
}

export function canEditItemDiscount(posProfile: any, item: any, isReturnInvoice?: boolean): boolean {
	if (!parseBooleanSetting(posProfile?.posa_allow_user_to_edit_item_discount)) return false;
	return !isPricingLocked(item, isReturnInvoice);
}

export function canChangePriceListRate(posProfile: any, item: any, isReturnInvoice?: boolean): boolean {
	if (!parseBooleanSetting(posProfile?.posa_allow_price_list_rate_change)) return false;
	return !isPricingLocked(item, isReturnInvoice);
}

export function canOverrideItemName(posProfile: any, item: any): boolean {
	if (!parseBooleanSetting(posProfile?.posa_allow_line_item_name_override)) return false;
	if (!item) return false;
	return !item.posa_is_replace;
}

export function canEditQty(item: any, isReturnInvoice?: boolean): boolean {
	if (!item) return false;
	if (isLockedPromotionLine(item) || item.posa_is_replace) return false;
	return true;
}

export function canChangeUom(item: any, isReturnInvoice?: boolean): boolean {
	if (!item) return false;
	if (isLockedPromotionLine(item) || isReturnInvoice) return false;
	return true;
}

export function canRemoveItem(item: any): boolean {
	if (!item) return false;
	if (isLockedPromotionLine(item) || item.posa_is_replace) return false;
	return true;
}

export function canToggleOffer(item: any, isReturnInvoice?: boolean): boolean {
	if (!item) return false;
	if (isReturnInvoice || isLockedPromotionLine(item)) return false;
	return true;
}

export interface ItemUiCapabilities {
	editQty: boolean;
	editRate: boolean;
	editDiscount: boolean;
	changeUom: boolean;
	changePriceListRate: boolean;
	overrideItemName: boolean;
	removeItem: boolean;
	toggleOffer: boolean;
	showAdditionalNotes: boolean;
	showDeliveryDate: boolean;
}

export function getItemUiCapabilities(
	posProfile: any,
	item: any,
	context: {
		isReturnInvoice?: boolean;
		invoiceType?: string;
	} = {},
): ItemUiCapabilities {
	const isReturnInvoice = Boolean(context.isReturnInvoice);

	return {
		editQty: canEditQty(item, isReturnInvoice),
		editRate: canEditRate(posProfile, item, isReturnInvoice),
		editDiscount: canEditItemDiscount(posProfile, item, isReturnInvoice),
		changeUom: canChangeUom(item, isReturnInvoice),
		changePriceListRate: canChangePriceListRate(posProfile, item, isReturnInvoice),
		overrideItemName: canOverrideItemName(posProfile, item),
		removeItem: canRemoveItem(item),
		toggleOffer: canToggleOffer(item, isReturnInvoice),
		showAdditionalNotes: parseBooleanSetting(posProfile?.posa_display_additional_notes),
		showDeliveryDate:
			parseBooleanSetting(posProfile?.posa_allow_sales_order) &&
			["Order", "Quotation"].includes(context.invoiceType || ""),
	};
}
