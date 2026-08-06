<template>
	<v-dialog v-model="dialog" max-width="960" scrollable :fullscreen="$vuetify.display.smAndDown">
		<v-card class="purchase-drafts-modal rounded-2xl">
			<!-- Modal Header Title -->
			<div class="purchase-drafts-modal__header px-5 pt-4 pb-3 d-flex align-center justify-space-between">
				<div class="d-flex align-center ga-3">
					<div class="purchase-drafts-header-icon">
						<v-icon color="white" icon="mdi-file-document-edit-outline" size="22" />
					</div>
					<span class="text-h6 font-weight-bold text-slate-800">
						{{ __("Select Draft Purchase Order") }}
					</span>
				</div>
				<v-btn
					icon="mdi-close"
					variant="text"
					size="small"
					color="grey-darken-1"
					:aria-label="__('Close')"
					@click="dialog = false"
				/>
			</div>

			<v-card-text class="purchase-drafts-modal__body px-5 py-3">
				<!-- Search and Filter Bar -->
				<div class="purchase-filter-grid mb-4">
					<div class="purchase-filter-row purchase-filter-row--primary">
						<!-- Search Field -->
						<div class="purchase-filter-col search-col">
							<v-text-field
								v-model="filters.search"
								:placeholder="__('PO or Supplier')"
								prepend-inner-icon="mdi-magnify"
								density="compact"
								variant="outlined"
								hide-details
								clearable
								class="pos-themed-input purchase-input-rounded"
								@keydown.enter="searchDrafts"
							/>
						</div>

						<!-- Supplier Select -->
						<div class="purchase-filter-col supplier-col">
							<v-select
								v-model="filters.supplier"
								:items="supplierSelectOptions"
								item-title="label"
								item-value="value"
								:placeholder="__('Supplier')"
								prepend-inner-icon="mdi-account-outline"
								density="compact"
								variant="outlined"
								hide-details
								clearable
								class="pos-themed-input purchase-input-rounded"
							/>
						</div>

						<!-- Warehouse Select -->
						<div class="purchase-filter-col warehouse-col">
							<v-select
								v-model="filters.warehouse"
								:items="warehouseOptions"
								item-title="warehouse_name"
								item-value="name"
								:placeholder="__('Warehouse')"
								prepend-inner-icon="mdi-warehouse"
								density="compact"
								variant="outlined"
								hide-details
								clearable
								class="pos-themed-input purchase-input-rounded"
							/>
						</div>

						<!-- Search Button -->
						<div class="purchase-filter-col btn-col">
							<v-btn
								color="#00838f"
								variant="flat"
								class="purchase-search-btn font-weight-bold text-none text-white rounded-lg w-100"
								prepend-icon="mdi-refresh"
								:loading="loading"
								:disabled="loading"
								@click="searchDrafts"
							>
								{{ __("Search") }}
							</v-btn>
						</div>
					</div>

					<!-- Dates Row -->
					<div class="purchase-filter-row purchase-filter-row--dates mt-3">
						<div class="purchase-filter-col date-col">
							<VueDatePicker
								v-model="filters.fromDate"
								model-type="format"
								format="dd-MM-yyyy"
								:enable-time-picker="false"
								auto-apply
								:placeholder="__('From Date')"
								class="pos-themed-input purchase-input-rounded purchase-date-picker"
							/>
						</div>
						<div class="purchase-filter-col date-col">
							<VueDatePicker
								v-model="filters.toDate"
								model-type="format"
								format="dd-MM-yyyy"
								:enable-time-picker="false"
								auto-apply
								:placeholder="__('To Date')"
								class="pos-themed-input purchase-input-rounded purchase-date-picker"
							/>
						</div>
					</div>
				</div>

				<v-alert v-if="errorMessage" type="error" density="compact" class="mb-3">
					{{ errorMessage }}
				</v-alert>

				<!-- Data Table Container Box -->
				<div class="purchase-draft-table-wrapper">
					<v-data-table
						v-model:page="page"
						v-model:items-per-page="itemsPerPage"
						:headers="headers"
						:items="drafts"
						:loading="loading"
						item-key="name"
						density="compact"
						class="purchase-drafts-custom-table"
						hide-default-footer
						hover
					>
						<template #item.name="{ item }">
							<div class="d-flex align-center ga-2 py-1">
								<v-icon
									icon="mdi-information-outline"
									size="18"
									color="primary"
									class="cursor-pointer"
									:title="__('View details')"
									@click.stop="previewDraft(item)"
								/>
								<span
									class="text-primary font-weight-bold cursor-pointer hover-underline"
									@click="previewDraft(item)"
								>
									<bdi>{{ item.name }}</bdi>
								</span>
							</div>
						</template>

						<template #item.supplier_name="{ item }">
							<span class="text-slate-700 font-weight-medium">{{ item.supplier_name || item.supplier || "-" }}</span>
						</template>

						<template #item.transaction_date="{ item }">
							<span class="text-slate-600">{{ formatDate(item.transaction_date) }}</span>
						</template>

						<template #item.set_warehouse="{ item }">
							<span class="text-slate-600">{{ item.set_warehouse || "-" }}</span>
						</template>

						<template #item.grand_total="{ item }">
							<div class="d-inline-flex align-center justify-end ga-1 font-weight-bold">
								<span class="text-primary">{{ currencySymbol(item.currency) }}</span>
								<span class="text-slate-800">{{ formatAmount(item.grand_total) }}</span>
							</div>
						</template>

						<template #item.actions="{ item }">
							<v-btn
								size="small"
								variant="outlined"
								color="primary"
								prepend-icon="mdi-folder-outline"
								class="rounded-lg text-none px-3 font-weight-bold border-primary-light"
								:loading="selectedName === item.name"
								:disabled="loadingSelected"
								@click="selectDraft(item)"
							>
								{{ __("Load") }}
							</v-btn>
						</template>

						<template #no-data>
							<div class="purchase-drafts-empty py-8 text-center">
								<v-icon icon="mdi-file-search-outline" size="36" color="medium-emphasis" class="mb-2" />
								<div class="text-body-2 text-medium-emphasis font-weight-medium">
									{{ __("No draft purchase orders found") }}
								</div>
							</div>
						</template>
					</v-data-table>

					<!-- Table Pagination Footer -->
					<div class="purchase-table-footer px-4 py-2 border-t d-flex align-center justify-space-between flex-wrap ga-2">
						<div class="d-flex align-center ga-2">
							<span class="text-caption text-medium-emphasis">{{ __("Items per page:") }}</span>
							<v-select
								v-model="itemsPerPage"
								:items="[5, 10, 20, 50]"
								density="compact"
								variant="outlined"
								hide-details
								class="items-per-page-select"
							/>
						</div>

						<div class="d-flex align-center ga-3">
							<span class="text-caption text-medium-emphasis font-weight-medium">
								{{ pageRangeText }}
							</span>
							<div class="d-flex align-center ga-1">
								<v-btn
									icon="mdi-page-first"
									size="x-small"
									variant="text"
									color="grey-darken-1"
									:disabled="page <= 1"
									@click="page = 1"
								/>
								<v-btn
									icon="mdi-chevron-left"
									size="x-small"
									variant="text"
									color="grey-darken-1"
									:disabled="page <= 1"
									@click="page--"
								/>
								<span class="purchase-page-chip px-2 py-1 text-caption font-weight-bold rounded">
									{{ page }}
								</span>
								<v-btn
									icon="mdi-chevron-right"
									size="x-small"
									variant="text"
									color="grey-darken-1"
									:disabled="page >= pageCount"
									@click="page++"
								/>
								<v-btn
									icon="mdi-page-last"
									size="x-small"
									variant="text"
									color="grey-darken-1"
									:disabled="page >= pageCount"
									@click="page = pageCount"
								/>
							</div>
						</div>
					</div>
				</div>
			</v-card-text>

			<!-- Bottom Actions Footer -->
			<div class="purchase-drafts-modal__footer px-5 py-3 border-t d-flex align-center justify-space-between">
				<v-btn
					variant="text"
					color="primary"
					class="font-weight-bold text-none px-0"
					@click="clearFilters"
				>
					{{ __("Clear Filters") }}
				</v-btn>
				<v-btn
					variant="outlined"
					color="error"
					class="rounded-lg font-weight-bold text-none px-6 border-error-light"
					@click="dialog = false"
				>
					{{ __("Close") }}
				</v-btn>
			</div>
		</v-card>
	</v-dialog>

	<!-- Preview Order Dialog -->
	<v-dialog v-model="previewDialog" max-width="820" scrollable>
		<v-card class="purchase-preview-card rounded-2xl">
			<div class="purchase-preview-card__title px-5 pt-4 pb-3 border-b d-flex align-center justify-space-between">
				<div>
					<div class="text-h6 font-weight-bold text-primary">{{ previewDoc?.name || __("Purchase Order") }}</div>
					<div class="text-caption text-medium-emphasis">
						{{ previewDoc?.supplier_name || previewDoc?.supplier || "" }}
					</div>
				</div>
				<v-btn
					icon="mdi-close"
					variant="text"
					size="small"
					color="grey-darken-1"
					:aria-label="__('Close')"
					@click="previewDialog = false"
				/>
			</div>

			<v-card-text class="purchase-preview-card__body px-5 py-4">
				<div v-if="previewDoc" class="purchase-preview-summary mb-4">
					<div>
						<span>{{ __("Date") }}</span>
						<strong>{{ formatDate(previewDoc.transaction_date) }}</strong>
					</div>
					<div>
						<span>{{ __("Required By") }}</span>
						<strong>{{ formatDate(previewDoc.schedule_date) }}</strong>
					</div>
					<div>
						<span>{{ __("Warehouse") }}</span>
						<strong>{{ previewDoc.set_warehouse || "-" }}</strong>
					</div>
					<div>
						<span>{{ __("Total") }}</span>
						<strong class="text-success">
							{{ currencySymbol(previewDoc.currency) }} {{ formatAmount(previewDoc.grand_total) }}
						</strong>
					</div>
				</div>

				<v-data-table
					:headers="previewHeaders"
					:items="previewDoc?.items || []"
					density="compact"
					class="purchase-preview-table rounded-lg border"
					hide-default-footer
					:items-per-page="-1"
				>
					<template #item.item_name="{ item }">
						<div class="py-1">
							<div class="font-weight-bold">{{ item.item_name || item.item_code }}</div>
							<div class="text-caption text-medium-emphasis">SKU: {{ item.item_code }}</div>
						</div>
					</template>
					<template #item.rate="{ item }">
						{{ currencySymbol(previewDoc?.currency) }} {{ formatAmount(item.rate) }}
					</template>
					<template #item.amount="{ item }">
						<strong class="text-primary">
							{{ currencySymbol(previewDoc?.currency) }}
							{{ formatAmount((Number(item.qty) || 0) * (Number(item.rate) || 0)) }}
						</strong>
					</template>
				</v-data-table>
			</v-card-text>

			<div class="purchase-preview-card__footer px-5 py-3 border-t d-flex align-center justify-space-between">
				<v-btn variant="text" color="grey-darken-1" class="font-weight-bold" @click="previewDialog = false">
					{{ __("Close") }}
				</v-btn>
				<v-btn
					color="#00838f"
					variant="flat"
					class="text-white font-weight-bold rounded-lg px-6"
					prepend-icon="mdi-folder-outline"
					:loading="loadingSelected"
					:disabled="!previewDoc || loadingSelected"
					@click="loadPreviewDraft"
				>
					{{ __("Load Draft") }}
				</v-btn>
			</div>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { normalizeDateForBackend } from "../../../format";
import {
	formatPurchaseAmount,
	formatPurchaseDate,
	purchaseCurrencySymbol,
} from "./purchaseFormatting";

const __ = window.__ || ((text) => text);

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	posProfile: {
		type: Object,
		default: () => ({}),
	},
	warehouseOptions: {
		type: Array,
		default: () => [],
	},
});

const emit = defineEmits(["update:modelValue", "select"]);

const dialog = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const filters = reactive({
	search: "",
	supplier: "",
	warehouse: null,
	fromDate: null,
	toDate: null,
});

const drafts = ref([]);
const loading = ref(false);
const loadingSelected = ref(false);
const previewLoading = ref(false);
const selectedName = ref("");
const previewName = ref("");
const previewDialog = ref(false);
const previewDoc = ref(null);
const errorMessage = ref("");

// Pagination state
const page = ref(1);
const itemsPerPage = ref(10);

const pageCount = computed(() => {
	if (!drafts.value.length) return 1;
	return Math.ceil(drafts.value.length / itemsPerPage.value);
});

const pageRangeText = computed(() => {
	const total = drafts.value.length;
	if (!total) return "0-0 of 0";
	const start = (page.value - 1) * itemsPerPage.value + 1;
	const end = Math.min(page.value * itemsPerPage.value, total);
	return `${start}–${end} of ${total}`;
});

const supplierSelectOptions = computed(() => {
	const set = new Set();
	drafts.value.forEach((d) => {
		const val = d.supplier_name || d.supplier;
		if (val) set.add(val);
	});
	return Array.from(set).map((val) => ({ label: val, value: val }));
});

const headers = [
	{ title: __("Purchase Order"), key: "name", align: "start", sortable: true },
	{ title: __("Supplier"), key: "supplier_name", align: "start", sortable: true },
	{ title: __("Date"), key: "transaction_date", align: "start", sortable: true },
	{ title: __("Warehouse"), key: "set_warehouse", align: "start", sortable: true },
	{ title: __("Amount"), key: "grand_total", align: "end", sortable: true },
	{ title: __("Action"), key: "actions", align: "center", sortable: false },
];

const previewHeaders = [
	{ title: __("Item"), key: "item_name", align: "start", sortable: false },
	{ title: __("UOM"), key: "uom", align: "center", sortable: false },
	{ title: __("Qty"), key: "qty", align: "center", sortable: false },
	{ title: __("Rate"), key: "rate", align: "end", sortable: false },
	{ title: __("Amount"), key: "amount", align: "end", sortable: false },
];

watch(dialog, (value) => {
	if (value) {
		searchDrafts();
	} else {
		errorMessage.value = "";
		selectedName.value = "";
	}
});

async function fetchDraftDoc(name) {
	const { message } = await frappe.call({
		method: "posawesome.posawesome.api.purchase_orders.get_draft_purchase_order",
		args: {
			purchase_order: name,
			pos_profile: props.posProfile,
			company: props.posProfile?.company,
		},
	});
	return message;
}

async function searchDrafts() {
	if (loading.value) return;

	loading.value = true;
	errorMessage.value = "";
	page.value = 1;
	try {
		const { message } = await frappe.call({
			method: "posawesome.posawesome.api.purchase_orders.search_draft_purchase_orders",
			args: {
				pos_profile: props.posProfile,
				company: props.posProfile?.company,
				search_text: filters.search || null,
				supplier: filters.supplier || null,
				warehouse: filters.warehouse || null,
				from_date: normalizeDateForBackend(filters.fromDate),
				to_date: normalizeDateForBackend(filters.toDate),
				limit: 100,
			},
		});
		drafts.value = Array.isArray(message) ? message : [];
	} catch (error) {
		console.error("Failed to search draft purchase orders", error);
		errorMessage.value = __("Unable to fetch draft purchase orders");
		drafts.value = [];
	} finally {
		loading.value = false;
	}
}

async function selectDraft(row) {
	if (!row?.name || loadingSelected.value) return;

	loadingSelected.value = true;
	selectedName.value = row.name;
	errorMessage.value = "";
	try {
		const draftDoc = await fetchDraftDoc(row.name);
		emit("select", draftDoc);
		dialog.value = false;
	} catch (error) {
		console.error("Failed to load draft purchase order", error);
		errorMessage.value = __("Unable to load the selected draft");
	} finally {
		loadingSelected.value = false;
		selectedName.value = "";
	}
}

async function previewDraft(row) {
	if (!row?.name || previewLoading.value) return;

	previewLoading.value = true;
	previewName.value = row.name;
	errorMessage.value = "";
	try {
		previewDoc.value = await fetchDraftDoc(row.name);
		previewDialog.value = true;
	} catch (error) {
		console.error("Failed to preview draft purchase order", error);
		errorMessage.value = __("Unable to show the selected draft details");
	} finally {
		previewLoading.value = false;
		previewName.value = "";
	}
}

function loadPreviewDraft() {
	if (!previewDoc.value || loadingSelected.value) return;

	emit("select", previewDoc.value);
	previewDialog.value = false;
	dialog.value = false;
}

function clearFilters() {
	filters.search = "";
	filters.supplier = "";
	filters.warehouse = null;
	filters.fromDate = null;
	filters.toDate = null;
	searchDrafts();
}

function formatDate(value) {
	return formatPurchaseDate(value);
}

function formatAmount(value) {
	return formatPurchaseAmount(value);
}

function currencySymbol(currency) {
	return purchaseCurrencySymbol(currency);
}
</script>

<style scoped>
.purchase-drafts-modal {
	background: #ffffff !important;
	overflow: hidden;
}

.purchase-drafts-header-icon {
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: #00838f;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.purchase-filter-grid {
	width: 100%;
}

.purchase-filter-row--primary {
	display: grid;
	grid-template-columns: minmax(200px, 1.2fr) minmax(170px, 1fr) minmax(170px, 1fr) 110px;
	gap: 10px;
	align-items: center;
}

.purchase-filter-row--dates {
	display: grid;
	grid-template-columns: repeat(2, minmax(180px, 220px));
	gap: 10px;
}

.purchase-input-rounded :deep(.v-field) {
	border-radius: 9px !important;
	min-height: 42px !important;
}

.purchase-input-rounded :deep(.v-field__input) {
	min-height: 42px !important;
	padding-block: 2px !important;
	font-size: 13px !important;
}

.purchase-search-btn {
	height: 42px !important;
	min-height: 42px !important;
}

.purchase-date-picker :deep(.dp__input) {
	min-height: 42px;
	height: 42px;
	border-radius: 9px;
	font-size: 13px;
	padding-inline-start: 34px !important;
}

.purchase-draft-table-wrapper {
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: #ffffff;
	overflow: hidden;
}

.purchase-drafts-custom-table :deep(.v-table) {
	background: #ffffff !important;
}

.purchase-drafts-custom-table :deep(th) {
	background: #f8fafc !important;
	font-size: 12px !important;
	font-weight: 700 !important;
	color: #64748b !important;
	border-bottom: 1px solid #e2e8f0 !important;
}

.purchase-drafts-custom-table :deep(td) {
	border-bottom: 1px solid #f1f5f9 !important;
	font-size: 13px !important;
}

.purchase-drafts-custom-table :deep(tr:hover) {
	background: #f8fafc !important;
}

.hover-underline:hover {
	text-decoration: underline;
}

.items-per-page-select {
	max-width: 90px;
}

.items-per-page-select :deep(.v-field) {
	min-height: 32px !important;
	border-radius: 6px !important;
}

.items-per-page-select :deep(.v-field__input) {
	min-height: 32px !important;
	padding-block: 0 !important;
	font-size: 12px !important;
}

.purchase-page-chip {
	background: #e0f2fe;
	color: #0284c7;
	min-width: 28px;
	text-align: center;
}

.border-primary-light {
	border-color: #bae6fd !important;
	background-color: #f0f9ff !important;
}

.border-error-light {
	border-color: #fca5a5 !important;
}

.purchase-preview-summary {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 10px;
}

.purchase-preview-summary > div {
	display: grid;
	gap: 2px;
	padding: 8px 12px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
}

@media (max-width: 820px) {
	.purchase-filter-row--primary {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 540px) {
	.purchase-filter-row--primary,
	.purchase-filter-row--dates {
		grid-template-columns: 1fr;
	}
}
</style>
