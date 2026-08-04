<!-- eslint-disable vue/multi-word-component-names -->
<template>
	<div class="pay-invoices-section mb-3">
		<div class="d-flex flex-wrap align-center justify-space-between mb-2">
			<div>
				<h3 class="text-body-2 font-weight-bold mb-0 text-primary d-flex align-center gap-1">
					<v-icon size="15" color="primary">mdi-file-document-outline</v-icon>
					{{ resolvedSectionTitle }}
				</h3>
			</div>
			<div v-if="totalSelected">
				<v-chip color="primary" variant="flat" size="small" class="font-weight-bold">
					{{ __("Total Selected") }}: {{ currencySymbol(posProfile.currency) }}{{ formatCurrency(totalSelected) }}
					<span class="ml-1 opacity-70">({{ selectedCount }} {{ __("invoice(s)") }})</span>
				</v-chip>
			</div>
		</div>

		<div class="invoices-filter-row mb-3">
			<div class="filter-field filter-field--profile">
				<v-select
					density="compact"
					variant="outlined"
					hide-details
					clearable
					class="pos-themed-input"
					v-model="internalPosProfileSearch"
					:items="normalizedPosProfiles"
					item-title="label"
					item-value="value"
					:label="__('POS Profile')"
				></v-select>
			</div>
			<div class="filter-field filter-field--currency">
				<v-select
					density="compact"
					variant="outlined"
					hide-details
					clearable
					v-model="internalCurrencyFilter"
					:items="['ALL', ...currencies]"
					:label="__('Currency')"
					class="pos-themed-input"
				></v-select>
			</div>
			<div class="filter-action-icons">
				<v-btn
					icon="mdi-magnify"
					size="small"
					class="table-filter-icon-btn btn-navy-search"
					:title="__('Search')"
					@click="$emit('search', internalPosProfileSearch)"
				/>
				<v-btn
					v-if="selectedCount"
					icon="mdi-close-circle-outline"
					size="small"
					color="error"
					variant="tonal"
					class="table-filter-icon-btn"
					:title="__('Clear')"
					@click="$emit('clear-selection')"
				/>
				<v-btn
					v-if="posProfile.posa_allow_reconcile_payments && invoices.length && partyName"
					icon="mdi-auto-fix"
					size="small"
					color="secondary"
					variant="tonal"
					class="table-filter-icon-btn"
					:title="__('Auto Reconcile')"
					:loading="autoReconcileLoading"
					:disabled="autoReconcileLoading"
					@click="$emit('auto-reconcile', internalPosProfileSearch)"
				/>
			</div>
		</div>

		<div v-if="outstandingByCurrency && Object.keys(outstandingByCurrency).length" class="currency-chips-row mb-2">
			<span
				v-for="(data, key) in outstandingByCurrency"
				:key="key"
				class="currency-summary-chip"
			>
				{{ data.symbol }} {{ formatCurrency(data.amount) }} {{ data.party_currency }}
				<span v-if="data.party_currency !== data.invoice_currency" class="opacity-75 ml-1">
					({{ data.invoice_currency }})
				</span>
			</span>
		</div>

		<div class="pos-table-card">
			<v-data-table
				:headers="headers"
				:items="filteredInvoices"
				item-key="voucher_no"
				density="compact"
				class="pos-invoices-data-table"
				:loading="loading"
				@click:row="(e, { item }) => $emit('select-row', item)"
				:row-props="invoiceRowProps"
			>
				<template v-slot:item.actions="{ item }">
					<v-checkbox
						:model-value="isInvoiceSelected(item)"
						color="primary"
						hide-details
						density="compact"
						@click.stop="$emit('select-row', item)"
					>
					</v-checkbox>
				</template>
				<template v-slot:item.voucher_no="{ item }">
					<span class="text-primary font-weight-bold">
						{{ item.voucher_no || item.name }}
					</span>
				</template>
				<template v-slot:item.type="{ item }">
					<span
						class="invoice-type-badge"
						:class="item?.type === 'Wholesale' ? 'type-badge--wholesale' : 'type-badge--retail'"
					>
						{{ item?.type || __("Retail") }}
					</span>
				</template>
				<template v-slot:item.due_date="{ item }">
					<span :class="{ 'due-date-overdue': isOverdue(item.due_date) }">
						{{ item.due_date }}
					</span>
				</template>
				<template v-slot:item.invoice_amount="{ item }">
					<span class="font-weight-medium">
						{{ currencySymbol(item.currency) }}
						{{ formatCurrency(item.invoice_amount) }}
					</span>
				</template>
				<template v-slot:item.outstanding_amount="{ item }">
					<span class="text-primary font-weight-bold">
						{{ currencySymbol(item?.currency || posProfile.currency) }}
						{{ formatCurrency(item?.outstanding_amount_in_invoice_currency ?? item?.outstanding_amount ?? 0) }}
					</span>
				</template>
			</v-data-table>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";

const __ = (text) => (window.__ ? window.__(text) : text);

const props = defineProps({
	invoices: Array,
	filteredInvoices: Array,
	posProfile: Object,
	posProfilesList: Array,
	posProfileSearch: String,
	currencyFilter: String,
	currencies: Array,
	outstandingByCurrency: Object,
	totalOutstanding: Number,
	totalSelected: Number,
	selectedCount: Number,
	loading: Boolean,
	autoReconcileLoading: Boolean,
	autoReconcileSummary: String,
	partyName: String,
	sectionTitle: String,
	isInvoiceSelected: Function,
	itemClass: Function,
	currencySymbol: Function,
	formatCurrency: Function,
	headers: Array,
});

const emit = defineEmits([
	"update:posProfileSearch",
	"update:currencyFilter",
	"search",
	"clear-selection",
	"auto-reconcile",
	"select-row",
]);

const internalPosProfileSearch = computed({
	get: () => props.posProfileSearch,
	set: (val) => emit("update:posProfileSearch", val),
});

const internalCurrencyFilter = computed({
	get: () => props.currencyFilter,
	set: (val) => emit("update:currencyFilter", val),
});

const normalizedPosProfiles = computed(() =>
	(props.posProfilesList || [])
		.map((profile) => {
			if (typeof profile === "string") {
				return { label: profile, value: profile };
			}

			const name = typeof profile?.name === "string" ? profile.name.trim() : "";
			if (!name) {
				return null;
			}

			return { label: name, value: name };
		})
		.filter(Boolean),
);

const resolvedSectionTitle = computed(() => props.sectionTitle || __("Invoices"));

const isOverdue = (dateStr) => {
	if (!dateStr) return false;
	try {
		const due = new Date(dateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return due < today;
	} catch (e) {
		return false;
	}
};

const invoiceRowProps = ({ item }) => {
	if (!props.itemClass) {
		return {};
	}
	const rowClass = props.itemClass(item);
	return rowClass ? { class: rowClass } : {};
};
</script>

<style scoped>
.invoices-filter-row {
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: nowrap;
}

.filter-field--profile {
	flex: 2 1 140px;
	min-width: 90px;
}

.filter-field--currency {
	flex: 1 1 80px;
	min-width: 65px;
}

.filter-action-icons {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-shrink: 0;
}

.table-filter-icon-btn {
	width: 32px !important;
	height: 32px !important;
	min-width: 32px !important;
	border-radius: var(--pos-radius-control, 8px) !important;
}

.filter-field :deep(.v-field) {
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	min-height: 32px !important;
	height: 32px !important;
}

.filter-field :deep(.v-field__input) {
	min-height: 32px !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
	font-size: 12px !important;
	font-weight: 600 !important;
}

.btn-navy-search {
	background: #0f2942 !important;
	color: #ffffff !important;
}

.btn-filters-toggle {
	border-color: #e2e8f0 !important;
	color: #475569 !important;
	background: #ffffff !important;
	border-radius: 8px !important;
}

.invoice-type-badge {
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 750;
}

.type-badge--retail {
	background: #e0f2fe !important;
	color: #0284c7 !important;
}

.type-badge--wholesale {
	background: #dcfce7 !important;
	color: #16a34a !important;
}

.due-date-overdue {
	color: #dc2626 !important;
	font-weight: 700 !important;
}

.currency-chips-row {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	align-items: center;
}

.pos-table-card {
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	border-radius: var(--pos-radius-section, 12px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	overflow: hidden;
}

:deep(.v-data-table) {
	background: transparent !important;
}

:deep(.v-data-table-header th) {
	background: var(--pos-surface-muted, #f8fafc) !important;
	font-size: 11px !important;
	font-weight: 800 !important;
	text-transform: uppercase !important;
	letter-spacing: 0.04em !important;
	color: var(--pos-text-muted, #64748b) !important;
	border-bottom: 1px solid var(--pos-border-light, #e2e8f0) !important;
}

:deep(.v-data-table__tr) {
	transition: background-color 0.16s ease !important;
	cursor: pointer;
}

:deep(.v-data-table__tr td) {
	font-size: 12px !important;
	padding-top: 4px !important;
	padding-bottom: 4px !important;
	height: 36px !important;
}

:deep(.v-data-table__tr:hover) {
	background: color-mix(in srgb, var(--pos-primary, #0284c7) 6%, var(--pos-surface-raised, #ffffff)) !important;
}

/* Block Vuetify's ::before hover overlay on selected rows */
:deep(.v-data-table__tr.selected-row::before) {
	display: none !important;
}

/* Preserve selected background on hover */
:deep(.v-data-table__tr.selected-row),
:deep(.v-data-table__tr.selected-row:hover),
:deep(.v-data-table__tr.selected-row:hover td) {
	background: rgba(var(--v-theme-primary), 0.12) !important;
}

:deep(.v-data-table__tr.selected-row:hover) {
	background: rgba(var(--v-theme-primary), 0.18) !important;
}

.table-filter-btn {
	height: 32px !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	font-weight: 700 !important;
	font-size: 12px !important;
	text-transform: none !important;
}

.currency-summary-chip {
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	background: color-mix(in srgb, var(--pos-primary, #0284c7) 10%, var(--pos-surface-raised, #ffffff));
	color: var(--pos-primary, #0284c7);
	font-size: 12px;
	font-weight: 750;
	border: 1px solid color-mix(in srgb, var(--pos-primary, #0284c7) 20%, transparent);
}

/* Mobile & Tablet Responsive Enhancements */
@media (max-width: 768px) {
	.invoices-filter-row {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-wrap: nowrap;
	}

	.filter-field--profile {
		flex: 1 1 55%;
		min-width: 0;
	}

	.filter-field--currency {
		flex: 1 1 35%;
		min-width: 0;
	}

	:deep(.v-data-table th),
	:deep(.v-data-table td) {
		padding-inline: 6px !important;
		font-size: 11.5px !important;
		white-space: nowrap;
	}
}

@media (max-width: 600px) {
	/* On mobile screens (<600px), hide non-critical columns (Type, Customer, Date, Due Date) to prevent horizontal overflow */
	:deep(.v-data-table th:nth-child(3)),
	:deep(.v-data-table td:nth-child(3)),
	:deep(.v-data-table th:nth-child(4)),
	:deep(.v-data-table td:nth-child(4)),
	:deep(.v-data-table th:nth-child(5)),
	:deep(.v-data-table td:nth-child(5)),
	:deep(.v-data-table th:nth-child(6)),
	:deep(.v-data-table td:nth-child(6)) {
		display: none !important;
	}
}
</style>
