import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { parseBooleanSetting } from "../items/useItemPermissions";

export interface InvoiceFooterAction {
	key: string;
	label: string;
	icon: string;
	visible: boolean;
	loading: boolean;
	danger?: boolean;
	direct?: boolean;
}

export interface InvoiceFooterActionOptions {
	posProfile: MaybeRefOrGetter<any>;
	saveLoading?: MaybeRefOrGetter<boolean>;
	loadDraftsLoading?: MaybeRefOrGetter<boolean>;
	selectOrderLoading?: MaybeRefOrGetter<boolean>;
	cancelLoading?: MaybeRefOrGetter<boolean>;
	invoiceManagementLoading?: MaybeRefOrGetter<boolean>;
	returnsLoading?: MaybeRefOrGetter<boolean>;
	printLoading?: MaybeRefOrGetter<boolean>;
	customerDisplayLoading?: MaybeRefOrGetter<boolean>;
}

export function useInvoiceFooterActions(options: InvoiceFooterActionOptions) {
	const __ = (window as any).__ || ((s: string) => s);

	const footerActions = computed<InvoiceFooterAction[]>(() => {
		const profile = toValue(options.posProfile) || {};
		const saveLoading = Boolean(toValue(options.saveLoading));
		const loadDraftsLoading = Boolean(toValue(options.loadDraftsLoading));
		const selectOrderLoading = Boolean(toValue(options.selectOrderLoading));
		const cancelLoading = Boolean(toValue(options.cancelLoading));
		const invoiceManagementLoading = Boolean(toValue(options.invoiceManagementLoading));
		const returnsLoading = Boolean(toValue(options.returnsLoading));
		const printLoading = Boolean(toValue(options.printLoading));
		const customerDisplayLoading = Boolean(toValue(options.customerDisplayLoading));

		return [
			{
				key: "save",
				label: __("Save & Clear"),
				icon: "mdi-content-save-outline",
				visible: true,
				loading: saveLoading,
				direct: true,
			},
			{
				key: "drafts",
				label: __("Drafts"),
				icon: "mdi-tray-full",
				visible: true,
				loading: loadDraftsLoading,
				direct: true,
			},
			{
				key: "select-order",
				label: __("Select S.O"),
				icon: "mdi-book-search-outline",
				visible: parseBooleanSetting(profile?.custom_allow_select_sales_order),
				loading: selectOrderLoading,
			},
			{
				key: "invoice-management",
				label: __("Invoice Mgmt"),
				icon: "mdi-folder-search-outline",
				visible: true,
				loading: invoiceManagementLoading,
			},
			{
				key: "return",
				label: __("Sales Return"),
				icon: "mdi-backup-restore",
				visible: parseBooleanSetting(
					profile?.posa_allow_return ?? profile?.posa_allow_returns,
				),
				loading: returnsLoading,
			},
			{
				key: "print",
				label: __("Print Draft"),
				icon: "mdi-printer-outline",
				visible: parseBooleanSetting(profile?.posa_allow_print_draft_invoices),
				loading: printLoading,
			},
			{
				key: "customer-display",
				label: __("Customer Screen"),
				icon: "mdi-monitor",
				visible: parseBooleanSetting(
					profile?.posa_enable_customer_display ?? profile?.posa_allow_customer_display,
				),
				loading: customerDisplayLoading,
			},
			{
				key: "cancel",
				label: __("Cancel Sale"),
				icon: "mdi-close-circle-outline",
				visible: true,
				loading: cancelLoading,
				danger: true,
			},
		];
	});

	const directActions = computed(() => footerActions.value.filter((action) => action.visible && action.direct));
	const menuActions = computed(() => footerActions.value.filter((action) => action.visible && !action.direct));

	return {
		footerActions,
		directActions,
		menuActions,
	};
}
