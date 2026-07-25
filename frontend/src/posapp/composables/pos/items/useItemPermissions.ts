export function parseBooleanSetting(val: any): boolean {
	if (val === undefined || val === null) return false;
	if (typeof val === "boolean") return val;
	if (typeof val === "number") return val !== 0;
	if (typeof val === "string") {
		const clean = val.trim().toLowerCase();
		return clean !== "0" && clean !== "false" && clean !== "";
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
