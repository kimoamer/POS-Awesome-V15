declare const frappe: any;

export const resolveDraftInvoiceDoctype = (
	draft: any,
	posProfile: any,
) => {
	if (draft?.doctype) {
		return draft.doctype;
	}

	return posProfile?.create_pos_invoice_instead_of_sales_invoice
		? "POS Invoice"
		: "Sales Invoice";
};

export const fetchDraftInvoices = async ({
	posOpeningShift,
	posProfile,
}: {
	posOpeningShift: any;
	posProfile: any;
}) => {
	const doctype = posProfile?.create_pos_invoice_instead_of_sales_invoice
		? "POS Invoice"
		: "Sales Invoice";

	const { message } = await frappe.call({
		method: "posawesome.posawesome.api.invoices.get_draft_invoices",
		args: {
			pos_opening_shift: posOpeningShift?.name,
			doctype,
			company: posProfile?.company,
			pos_profile: posProfile?.name,
		},
	});

	return Array.isArray(message) ? message : [];
};

export const fetchDraftInvoiceDoc = async ({
	draft,
	posProfile,
}: {
	draft: any;
	posProfile: any;
}) => {
	if (!draft?.name) {
		return null;
	}

	const { message } = await frappe.call({
		method: "posawesome.posawesome.api.invoices.get_draft_invoice_doc",
		args: {
			invoice_name: draft.name,
			doctype: resolveDraftInvoiceDoctype(draft, posProfile),
			pos_profile: posProfile?.name,
			pos_opening_shift: draft?.posa_pos_opening_shift,
		},
	});

	return message || null;
};
