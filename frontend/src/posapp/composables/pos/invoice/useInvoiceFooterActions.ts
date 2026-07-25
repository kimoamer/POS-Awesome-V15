import { computed } from "vue";
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

export function useInvoiceFooterActions(props: {
	posProfile: any;
	saveLoading?: boolean;
	loadDraftsLoading?: boolean;
	selectOrderLoading?: boolean;
	cancelLoading?: boolean;
	invoiceManagementLoading?: boolean;
	returnsLoading?: boolean;
	printLoading?: boolean;
	customerDisplayLoading?: boolean;
}) {
	const __ = (window as any).__ || ((s: string) => s);

	const footerActions = computed<InvoiceFooterAction[]>(() => [
		{
			key: "save",
			label: __("Save & Clear"),
			icon: "mdi-content-save-outline",
			visible: true,
			loading: Boolean(props.saveLoading),
			direct: true,
		},
		{
			key: "drafts",
			label: __("Drafts"),
			icon: "mdi-tray-full",
			visible: true,
			loading: Boolean(props.loadDraftsLoading),
			direct: true,
		},
		{
			key: "select-order",
			label: __("Select S.O"),
			icon: "mdi-book-search-outline",
			visible: parseBooleanSetting(props.posProfile?.custom_allow_select_sales_order),
			loading: Boolean(props.selectOrderLoading),
		},
		{
			key: "invoice-management",
			label: __("Invoice Mgmt"),
			icon: "mdi-folder-search-outline",
			visible: true,
			loading: Boolean(props.invoiceManagementLoading),
		},
		{
			key: "return",
			label: __("Sales Return"),
			icon: "mdi-backup-restore",
			visible: parseBooleanSetting(props.posProfile?.posa_allow_return),
			loading: Boolean(props.returnsLoading),
		},
		{
			key: "print",
			label: __("Print Draft"),
			icon: "mdi-printer-outline",
			visible: parseBooleanSetting(props.posProfile?.posa_allow_print_draft_invoices),
			loading: Boolean(props.printLoading),
		},
		{
			key: "customer-display",
			label: __("Customer Screen"),
			icon: "mdi-monitor",
			visible: parseBooleanSetting(props.posProfile?.posa_enable_customer_display),
			loading: Boolean(props.customerDisplayLoading),
		},
		{
			key: "cancel",
			label: __("Cancel Sale"),
			icon: "mdi-close-circle-outline",
			visible: true,
			loading: Boolean(props.cancelLoading),
			danger: true,
		},
	]);

	const directActions = computed(() => footerActions.value.filter((action) => action.visible && action.direct));
	const menuActions = computed(() => footerActions.value.filter((action) => action.visible && !action.direct));

	return {
		footerActions,
		directActions,
		menuActions,
	};
}
