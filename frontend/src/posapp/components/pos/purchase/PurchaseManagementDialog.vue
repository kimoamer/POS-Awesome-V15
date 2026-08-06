<template>
	<v-dialog v-model="dialog" max-width="1160px" scrollable :fullscreen="$vuetify.display.smAndDown">
		<v-card class="purchase-mgmt-modal rounded-2xl">
			<!-- Header Bar -->
			<div class="purchase-mgmt-modal__header px-5 pt-4 pb-3 d-flex align-center justify-space-between border-b">
				<div class="d-flex align-center ga-3">
					<div class="purchase-mgmt-header-icon">
						<v-icon color="white" icon="mdi-inbox-full" size="22" />
					</div>
					<div>
						<div class="text-h6 font-weight-bold text-slate-800">
							{{ __("Purchase Management") }}
						</div>
						<div class="text-caption text-medium-emphasis">
							{{ __("Manage receipts, supplier bills, and payments for submitted purchase orders") }}
						</div>
					</div>
				</div>

				<div class="d-flex align-center ga-2">
					<v-btn
						color="#00838f"
						variant="text"
						prepend-icon="mdi-refresh"
						class="font-weight-bold text-none"
						:loading="loading"
						@click="loadOrders"
					>
						{{ __("Refresh") }}
					</v-btn>
					<v-btn
						icon="mdi-close"
						variant="text"
						size="small"
						color="grey-darken-1"
						:aria-label="__('Close')"
						@click="dialog = false"
					/>
				</div>
			</div>

			<!-- Tabs Bar -->
			<div class="purchase-mgmt-tabs border-b px-2">
				<v-tabs
					v-model="activeTab"
					color="#00838f"
					align-tabs="start"
					class="custom-mgmt-tabs"
				>
					<v-tab value="active" class="font-weight-bold text-none px-6">{{ __("Active") }}</v-tab>
					<v-tab value="to_receive" class="font-weight-bold text-none px-6">{{ __("To Receive") }}</v-tab>
					<v-tab value="to_bill" class="font-weight-bold text-none px-6">{{ __("To Bill") }}</v-tab>
					<v-tab value="to_pay" class="font-weight-bold text-none px-6">{{ __("To Pay") }}</v-tab>
					<v-tab value="all" class="font-weight-bold text-none px-6">{{ __("All") }}</v-tab>
				</v-tabs>
			</div>

			<!-- Main Body Content -->
			<v-card-text class="purchase-mgmt-modal__body px-5 py-4">
				<!-- Search and Filter Bar -->
				<div class="purchase-mgmt-filters mb-4">
					<div class="purchase-filter-grid-row">
						<!-- Search Field -->
						<div class="filter-cell search-cell">
							<v-text-field
								v-model="filters.search"
								:placeholder="__('Search purchase orders or supplier')"
								prepend-inner-icon="mdi-magnify"
								density="compact"
								variant="outlined"
								hide-details
								clearable
								class="pos-themed-input purchase-input-rounded"
								@keyup.enter="loadOrders"
							/>
						</div>

						<!-- Supplier Select -->
						<div class="filter-cell supplier-cell">
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
						<div class="filter-cell warehouse-cell">
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

						<!-- From Date -->
						<div class="filter-cell date-cell">
							<VueDatePicker
								v-model="filters.fromDate"
								model-type="format"
								format="dd/MM/yyyy"
								:enable-time-picker="false"
								auto-apply
								:placeholder="__('From Date')"
								class="pos-themed-input purchase-input-rounded purchase-date-picker"
							/>
						</div>

						<!-- To Date -->
						<div class="filter-cell date-cell">
							<VueDatePicker
								v-model="filters.toDate"
								model-type="format"
								format="dd/MM/yyyy"
								:enable-time-picker="false"
								auto-apply
								:placeholder="__('To Date')"
								class="pos-themed-input purchase-input-rounded purchase-date-picker"
							/>
						</div>

						<!-- Apply Button -->
						<div class="filter-cell btn-cell">
							<v-btn
								color="#00838f"
								variant="flat"
								class="purchase-apply-btn font-weight-bold text-none text-white rounded-lg w-100"
								prepend-icon="mdi-filter-variant"
								:loading="loading"
								@click="loadOrders"
							>
								{{ __("Apply") }}
							</v-btn>
						</div>
					</div>
				</div>

				<v-alert v-if="errorMessage" type="error" density="compact" class="mb-3">
					{{ errorMessage }}
				</v-alert>

				<!-- Stat Summary Cards Grid -->
				<div class="purchase-mgmt-stat-grid mb-4">
					<!-- Tile 1: Orders -->
					<div class="stat-card">
						<div class="stat-icon-box stat-icon-box--blue">
							<v-icon icon="mdi-clipboard-text-outline" color="#0284c7" size="22" />
						</div>
						<div class="stat-info">
							<span class="stat-label">{{ __("Orders") }}</span>
							<strong class="stat-value text-slate-800">{{ orders.length }}</strong>
						</div>
					</div>

					<!-- Tile 2: To Receive -->
					<div class="stat-card">
						<div class="stat-icon-box stat-icon-box--green">
							<v-icon icon="mdi-inbox-arrow-down-outline" color="#16a34a" size="22" />
						</div>
						<div class="stat-info">
							<span class="stat-label">{{ __("To Receive") }}</span>
							<strong class="stat-value text-slate-800">{{ receiveCount }}</strong>
						</div>
					</div>

					<!-- Tile 3: To Bill -->
					<div class="stat-card">
						<div class="stat-icon-box stat-icon-box--purple">
							<v-icon icon="mdi-file-document-outline" color="#2563eb" size="22" />
						</div>
						<div class="stat-info">
							<span class="stat-label">{{ __("To Bill") }}</span>
							<strong class="stat-value text-slate-800">{{ billCount }}</strong>
						</div>
					</div>

					<!-- Tile 4: To Pay -->
					<div class="stat-card">
						<div class="stat-icon-box stat-icon-box--orange">
							<v-icon icon="mdi-credit-card-outline" color="#ea580c" size="22" />
						</div>
						<div class="stat-info">
							<span class="stat-label">{{ __("To Pay") }}</span>
							<strong class="stat-value text-slate-800">
								{{ formatAmount(payableTotal) }} <span class="text-caption text-medium-emphasis ms-1">{{ currencySymbol(posProfile?.currency) }}</span>
							</strong>
						</div>
					</div>
				</div>

				<!-- Data Table Container Box -->
				<div class="purchase-mgmt-table-wrapper">
					<v-data-table
						v-model:page="page"
						v-model:items-per-page="itemsPerPage"
						:headers="headers"
						:items="orders"
						:loading="loading"
						item-key="name"
						density="compact"
						class="purchase-mgmt-custom-table"
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
									@click.stop="previewOrder(item)"
								/>
								<span
									class="text-primary font-weight-bold cursor-pointer hover-underline"
									@click="previewOrder(item)"
								>
									<bdi>{{ item.name }}</bdi>
								</span>
							</div>
						</template>

						<template #item.transaction_date="{ item }">
							<span class="text-slate-600">{{ formatDate(item.transaction_date) }}</span>
						</template>

						<template #item.receipt_status="{ item }">
							<v-chip
								size="x-small"
								variant="tonal"
								class="font-weight-bold px-2"
								:color="item.receipt_complete ? 'success' : item.has_receipt ? 'warning' : 'grey'"
							>
								{{ receiptLabel(item) }}
							</v-chip>
						</template>

						<template #item.invoice_status="{ item }">
							<v-chip
								size="x-small"
								variant="tonal"
								class="font-weight-bold px-2"
								:color="item.invoice_complete ? 'primary' : item.has_invoice ? 'info' : 'grey'"
							>
								{{ invoiceLabel(item) }}
							</v-chip>
						</template>

						<template #item.payable_amount="{ item }">
							<div class="d-inline-flex align-center justify-end ga-1 font-weight-bold">
								<span class="text-primary">{{ currencySymbol(item.currency) }}</span>
								<span class="text-slate-800">{{ formatAmount(item.payable_amount) }}</span>
							</div>
						</template>

						<template #item.actions="{ item }">
							<div class="d-flex align-center justify-center ga-1">
								<v-btn
									size="x-small"
									color="success"
									variant="tonal"
									class="font-weight-bold text-none rounded-md px-2"
									:disabled="item.receipt_complete"
									:loading="actionLoading === `${item.name}:receipt`"
									@click="openActionDialog(item, 'receipt')"
								>
									{{ __("Receive") }}
								</v-btn>
								<v-btn
									size="x-small"
									color="primary"
									variant="tonal"
									class="font-weight-bold text-none rounded-md px-2"
									:disabled="item.invoice_complete"
									:loading="actionLoading === `${item.name}:invoice`"
									@click="openActionDialog(item, 'invoice')"
								>
									{{ __("Bill") }}
								</v-btn>
								<v-btn
									size="x-small"
									color="deep-purple"
									variant="tonal"
									class="font-weight-bold text-none rounded-md px-2"
									:disabled="Number(item.payable_amount || 0) <= 0"
									:loading="actionLoading === `${item.name}:payment`"
									@click="openPayment(item)"
								>
									{{ item.invoice_count ? __("Pay") : __("Advance") }}
								</v-btn>
							</div>
						</template>

						<template #no-data>
							<div class="purchase-mgmt-empty py-10 text-center">
								<v-icon icon="mdi-inbox-outline" size="44" color="medium-emphasis" class="mb-2 opacity-60" />
								<div class="text-body-2 text-medium-emphasis font-weight-medium">
									{{ __("No data available") }}
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
								:items="[5, 10, 15, 25, 50]"
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
		</v-card>

		<!-- Order Details Preview Dialog -->
		<v-dialog v-model="previewDialog" max-width="900px" scrollable>
			<v-card class="rounded-2xl">
				<div class="px-5 pt-4 pb-3 border-b d-flex align-center justify-space-between">
					<div>
						<div class="text-h6 font-weight-bold text-primary">{{ previewDoc?.name || __("Purchase Order") }}</div>
						<div class="text-caption text-medium-emphasis">
							{{ previewDoc?.supplier_name || previewDoc?.supplier }}
						</div>
					</div>
					<v-btn icon="mdi-close" variant="text" size="small" @click="previewDialog = false" />
				</div>
				<v-card-text class="pa-5">
					<div v-if="previewDoc" class="purchase-preview-summary mb-4">
						<div>
							<span>{{ __("Receipt") }}</span>
							<strong>{{ receiptLabel(previewDoc) }}</strong>
						</div>
						<div>
							<span>{{ __("Bill") }}</span>
							<strong>{{ invoiceLabel(previewDoc) }}</strong>
						</div>
						<div>
							<span>{{ __("Payable") }}</span>
							<strong class="text-primary">
								{{ currencySymbol(previewDoc.currency) }} {{ formatAmount(previewDoc.payable_amount) }}
							</strong>
						</div>
					</div>

					<v-data-table
						:headers="previewHeaders"
						:items="previewDoc?.items || []"
						density="compact"
						hide-default-footer
						:items-per-page="-1"
						class="rounded-lg border"
					>
						<template #item.item_name="{ item }">
							<div class="py-1">
								<div class="font-weight-bold">{{ item.item_name || item.item_code }}</div>
								<div class="text-caption text-medium-emphasis">SKU: {{ item.item_code }}</div>
							</div>
						</template>
					</v-data-table>
				</v-card-text>
			</v-card>
		</v-dialog>

		<!-- Action Execution Dialog (Receipt / Bill) -->
		<v-dialog v-model="actionDialog" max-width="940px" scrollable persistent>
			<v-card class="purchase-action-dialog rounded-2xl">
				<div class="purchase-action-dialog__title px-5 pt-4 pb-3 border-b d-flex align-center justify-space-between">
					<div>
						<div class="text-h6 font-weight-bold text-primary">{{ actionTitle }}</div>
						<div class="text-caption text-medium-emphasis">
							{{ actionDoc?.name }} &middot; {{ actionDoc?.supplier_name || actionDoc?.supplier }}
						</div>
					</div>
					<v-btn icon="mdi-close" variant="text" size="small" :disabled="!!actionLoading" @click="closeActionDialog" />
				</div>
				<v-card-text class="purchase-action-dialog__body px-5 py-4">
					<div class="purchase-action-controls mb-4">
						<v-text-field
							v-model="actionDate"
							type="date"
							variant="outlined"
							density="compact"
							hide-details
							:label="actionType === 'receipt' ? __('Receipt Date') : __('Bill Date')"
							class="pos-themed-input"
						/>
						<div class="purchase-action-total">
							<span>{{ __("Selected Qty") }}</span>
							<strong>{{ formatAmount(selectedActionQty) }}</strong>
						</div>
						<div class="purchase-action-total">
							<span>{{ __("Selected Amount") }}</span>
							<strong class="text-primary">
								{{ currencySymbol(actionDoc?.currency || posProfile?.currency) }}
								{{ formatAmount(selectedActionAmount) }}
							</strong>
						</div>
						<v-btn variant="tonal" color="primary" class="font-weight-bold" prepend-icon="mdi-check-all" @click="setAllActionQty">
							{{ __("All Pending") }}
						</v-btn>
						<v-btn variant="text" color="error" class="font-weight-bold" prepend-icon="mdi-close-circle-outline" @click="clearActionQty">
							{{ __("Clear") }}
						</v-btn>
					</div>

					<v-alert v-if="!actionRows.length" type="info" density="compact" class="mb-3">
						{{ __("There are no pending items for this action.") }}
					</v-alert>

					<v-data-table
						:headers="actionHeaders"
						:items="actionRows"
						density="compact"
						hide-default-footer
						:items-per-page="-1"
						class="rounded-lg border"
					>
						<template #item.item_name="{ item }">
							<div class="py-1">
								<div class="font-weight-bold">{{ item.item_name || item.item_code }}</div>
								<div class="text-caption text-medium-emphasis">SKU: {{ item.item_code }}</div>
							</div>
						</template>
						<template #item.action_qty="{ item }">
							<v-text-field
								v-model.number="item.action_qty"
								type="number"
								min="0"
								:max="item.pending_qty"
								density="compact"
								variant="outlined"
								hide-details
								class="pos-themed-input"
							/>
						</template>
					</v-data-table>
				</v-card-text>
				<div class="purchase-action-dialog__footer px-5 py-3 border-t d-flex align-center justify-space-between">
					<v-btn variant="text" color="grey-darken-1" class="font-weight-bold" :disabled="!!actionLoading" @click="closeActionDialog">
						{{ __("Cancel") }}
					</v-btn>
					<v-btn
						color="#00838f"
						variant="flat"
						class="text-white font-weight-bold rounded-lg px-6"
						prepend-icon="mdi-check"
						:loading="!!actionLoading"
						:disabled="!selectedActionQty || !!actionLoading"
						@click="submitAction"
					>
						{{ __("Submit") }}
					</v-btn>
				</div>
			</v-card>
		</v-dialog>

		<!-- Payment Dialog Component -->
		<PurchasePaymentDialog
			v-model="paymentDialog"
			:pos-profile="posProfile"
			:order="paymentOrder"
			@submit="handlePaymentSubmit"
		/>
	</v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { normalizeDateForBackend } from "../../../format";
import { useToastStore } from "../../../stores/toastStore";
import PurchasePaymentDialog from "./PurchasePaymentDialog.vue";
import {
	extractPurchaseServerError,
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

const emit = defineEmits(["update:modelValue"]);
const toastStore = useToastStore();

const dialog = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const activeTab = ref("active");
const orders = ref([]);
const loading = ref(false);
const actionLoading = ref("");
const previewLoading = ref(false);
const previewName = ref("");
const errorMessage = ref("");

// Pagination State
const page = ref(1);
const itemsPerPage = ref(15);

const pageCount = computed(() => {
	if (!orders.value.length) return 1;
	return Math.ceil(orders.value.length / itemsPerPage.value);
});

const pageRangeText = computed(() => {
	const total = orders.value.length;
	if (!total) return "0-0 of 0";
	const start = (page.value - 1) * itemsPerPage.value + 1;
	const end = Math.min(page.value * itemsPerPage.value, total);
	return `${start}–${end} of ${total}`;
});

const filters = reactive({
	search: "",
	supplier: "",
	warehouse: null,
	fromDate: null,
	toDate: null,
});

const previewDialog = ref(false);
const previewDoc = ref(null);

const actionDialog = ref(false);
const actionType = ref("receipt");
const actionOrder = ref(null);
const actionDoc = ref(null);
const actionRows = ref([]);
const actionDate = ref(todayDate());

const paymentDialog = ref(false);
const paymentOrder = ref(null);

const supplierSelectOptions = computed(() => {
	const set = new Set();
	orders.value.forEach((o) => {
		const val = o.supplier_name || o.supplier;
		if (val) set.add(val);
	});
	return Array.from(set).map((val) => ({ label: val, value: val }));
});

const headers = [
	{ title: __("Purchase Order"), key: "name", align: "start", sortable: true },
	{ title: __("Date"), key: "transaction_date", align: "start", sortable: true },
	{ title: __("Receipt"), key: "receipt_status", align: "center", sortable: true },
	{ title: __("Bill"), key: "invoice_status", align: "center", sortable: true },
	{ title: __("Payable"), key: "payable_amount", align: "end", sortable: true },
	{ title: __("Actions"), key: "actions", align: "center", sortable: false },
];

const previewHeaders = [
	{ title: __("Item"), key: "item_name", align: "start", sortable: false },
	{ title: __("UOM"), key: "uom", align: "center", sortable: false },
	{ title: __("Qty"), key: "qty", align: "center", sortable: false },
	{ title: __("Received"), key: "received_qty", align: "center", sortable: false },
	{ title: __("Billed"), key: "billed_qty", align: "center", sortable: false },
];

const actionHeaders = computed(() => [
	{ title: __("Item"), key: "item_name", align: "start", sortable: false },
	{ title: __("UOM"), key: "uom", align: "center", sortable: false },
	{ title: __("Ordered"), key: "qty", align: "center", sortable: false },
	{ title: __("Completed"), key: "completed_qty", align: "center", sortable: false },
	{ title: __("Pending"), key: "pending_qty", align: "center", sortable: false },
	{
		title: actionType.value === "receipt" ? __("Receive Qty") : __("Bill Qty"),
		key: "action_qty",
		align: "center",
		sortable: false,
	},
]);

const receiveCount = computed(() => orders.value.filter((o) => !o.receipt_complete).length);
const billCount = computed(() => orders.value.filter((o) => !o.invoice_complete).length);
const payableTotal = computed(() =>
	orders.value.reduce((total, row) => total + (Number(row.payable_amount) || 0), 0)
);

const actionTitle = computed(() => {
	if (actionType.value === "receipt") return __("Create Purchase Receipt");
	return __("Create Purchase Invoice");
});

const selectedActionQty = computed(() =>
	actionRows.value.reduce((total, row) => total + (Number(row.action_qty) || 0), 0)
);

const selectedActionAmount = computed(() =>
	actionRows.value.reduce(
		(total, row) => total + (Number(row.action_qty) || 0) * (Number(row.rate) || 0),
		0
	)
);

watch(dialog, (value) => {
	if (value) {
		loadOrders();
	} else {
		errorMessage.value = "";
		closeActionDialog(true);
	}
});

watch(activeTab, () => {
	loadOrders();
});

async function loadOrders() {
	if (loading.value) return;

	loading.value = true;
	errorMessage.value = "";
	page.value = 1;
	try {
		const { message } = await frappe.call({
			method: "posawesome.posawesome.api.purchase_orders.search_purchase_management_orders",
			args: {
				pos_profile: props.posProfile,
				company: props.posProfile?.company,
				status_filter: activeTab.value,
				search_text: filters.search || null,
				supplier: filters.supplier || null,
				warehouse: filters.warehouse || null,
				from_date: normalizeDateForBackend(filters.fromDate),
				to_date: normalizeDateForBackend(filters.toDate),
				limit: 100,
			},
		});
		orders.value = Array.isArray(message) ? message : [];
	} catch (error) {
		console.error("Failed to load submitted purchase orders", error);
		errorMessage.value = __("Unable to fetch purchase management records");
		orders.value = [];
	} finally {
		loading.value = false;
	}
}

async function previewOrder(row) {
	if (!row?.name || previewLoading.value) return;

	previewLoading.value = true;
	previewName.value = row.name;
	try {
		const { message } = await frappe.call({
			method: "posawesome.posawesome.api.purchase_orders.get_purchase_management_order",
			args: {
				purchase_order: row.name,
				pos_profile: props.posProfile,
				company: props.posProfile?.company,
			},
		});
		previewDoc.value = message;
		previewDialog.value = true;
	} catch (error) {
		console.error("Failed to fetch purchase order details", error);
		toastStore.show({ title: extractServerError(error), color: "error" });
	} finally {
		previewLoading.value = false;
		previewName.value = "";
	}
}

async function openActionDialog(row, type) {
	if (!row?.name || actionLoading.value) return;

	actionLoading.value = `${row.name}:${type}`;
	try {
		const { message } = await frappe.call({
			method: "posawesome.posawesome.api.purchase_orders.get_purchase_management_order",
			args: {
				purchase_order: row.name,
				pos_profile: props.posProfile,
				company: props.posProfile?.company,
			},
		});

		actionType.value = type;
		actionOrder.value = row;
		actionDoc.value = message;
		actionDate.value = todayDate();
		actionRows.value = (message?.items || [])
			.map((item) => {
				const qty = Number(item.qty) || 0;
				const completedQty =
					type === "receipt"
						? Number(item.received_qty) || 0
						: Number(item.billed_qty) || 0;
				const pendingQty = Math.max(0, qty - completedQty);

				return {
					...item,
					completed_qty: completedQty,
					pending_qty: pendingQty,
					action_qty: pendingQty,
				};
			})
			.filter((item) => item.pending_qty > 0);

		actionDialog.value = true;
	} catch (error) {
		console.error("Failed to load purchase order action details", error);
		toastStore.show({ title: extractServerError(error), color: "error" });
	} finally {
		actionLoading.value = "";
	}
}

async function submitAction() {
	if (!actionDoc.value || !actionRows.value.length || actionLoading.value) return;

	const itemsPayload = actionRows.value
		.filter((row) => Number(row.action_qty) > 0)
		.map((row) => ({
			item_code: row.item_code,
			qty: Number(row.action_qty),
			rate: Number(row.rate),
			uom: row.uom,
			warehouse: row.warehouse || actionDoc.value.set_warehouse,
			purchase_order_item: row.name,
		}));

	if (!itemsPayload.length) {
		toastStore.show({ title: __("Please enter valid quantities"), color: "warning" });
		return;
	}

	actionLoading.value = "submit";
	try {
		const { message } = await frappe.call({
			method: "posawesome.posawesome.api.purchase_orders.process_purchase_management_action",
			args: {
				data: {
					purchase_order: actionDoc.value.name,
					action: actionType.value,
					posting_date: actionDate.value,
					pos_profile: props.posProfile,
					company: props.posProfile?.company,
					items: itemsPayload,
				},
			},
		});

		const docName = message?.name || "";
		closeActionDialog(true);
		toastStore.show({
			title:
				actionType.value === "receipt"
					? __("Purchase Receipt created: {0}", [docName])
					: __("Purchase Invoice created: {0}", [docName]),
			color: "success",
		});
		await loadOrders();
	} catch (error) {
		console.error("Failed purchase action submit", error);
		toastStore.show({ title: extractServerError(error), color: "error" });
	} finally {
		actionLoading.value = "";
	}
}

function setAllActionQty() {
	actionRows.value.forEach((item) => {
		item.action_qty = item.pending_qty;
	});
}

function clearActionQty() {
	actionRows.value.forEach((item) => {
		item.action_qty = 0;
	});
}

function closeActionDialog(force = false) {
	if (actionLoading.value && !force) return;
	actionDialog.value = false;
	actionDoc.value = null;
	actionOrder.value = null;
	actionRows.value = [];
	actionDate.value = todayDate();
}

function openPayment(row) {
	if (!row?.name || Number(row.payable_amount || 0) <= 0) return;

	paymentOrder.value = row;
	paymentDialog.value = true;
}

async function handlePaymentSubmit({ payments }) {
	if (!paymentOrder.value) return;

	const row = paymentOrder.value;
	paymentDialog.value = false;
	actionLoading.value = `${row.name}:payment`;
	try {
		const { message } = await frappe.call({
			method: "posawesome.posawesome.api.purchase_orders.process_purchase_management_action",
			args: {
				data: {
					purchase_order: row.name,
					action: "payment",
					pos_profile: props.posProfile,
					company: props.posProfile?.company,
					payments,
				},
			},
		});
		const entries = message?.payment_entries || [];
		paymentOrder.value = null;
		toastStore.show({
			title: entries.length
				? __("Payment created: {0}", [entries.join(", ")])
				: __("Payment completed"),
			color: "success",
		});
		await loadOrders();
	} catch (error) {
		console.error("Failed purchase payment", error);
		toastStore.show({ title: extractServerError(error), color: "error" });
	} finally {
		actionLoading.value = "";
	}
}

function receiptLabel(row) {
	if (row?.receipt_complete) return __("Received");
	if (row?.has_receipt) return __("Partial Receipt");
	return __("Pending");
}

function invoiceLabel(row) {
	if (row?.invoice_complete) return __("Billed");
	if (row?.has_invoice) return __("Partial Bill");
	return __("Pending");
}

function todayDate() {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
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

function extractServerError(error) {
	return extractPurchaseServerError(error, __("Unable to complete purchase action"));
}
</script>

<style scoped>
.purchase-mgmt-modal {
	background: #ffffff !important;
	overflow: hidden;
}

.purchase-mgmt-header-icon {
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: #00838f;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.custom-mgmt-tabs :deep(.v-slide-group__content) {
	border-bottom: 2px solid #e2e8f0;
}

.purchase-filter-grid-row {
	display: grid;
	grid-template-columns: minmax(180px, 1.3fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(135px, 0.9fr) minmax(135px, 0.9fr) 100px;
	gap: 10px;
	align-items: center;
}

.purchase-input-rounded :deep(.v-field) {
	border-radius: 9px !important;
	min-height: 40px !important;
}

.purchase-input-rounded :deep(.v-field__input) {
	min-height: 40px !important;
	padding-block: 2px !important;
	font-size: 13px !important;
}

.purchase-apply-btn {
	height: 40px !important;
	min-height: 40px !important;
}

.purchase-date-picker :deep(.dp__input) {
	min-height: 40px;
	height: 40px;
	border-radius: 9px;
	font-size: 13px;
	padding-inline-start: 32px !important;
}

.purchase-mgmt-stat-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;
}

.stat-card {
	padding: 12px 14px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: #ffffff;
	display: flex;
	align-items: center;
	gap: 12px;
	transition: box-shadow 0.15s ease;
}

.stat-card:hover {
	box-shadow: 0 3px 10px rgba(15, 23, 42, 0.05);
}

.stat-icon-box {
	width: 44px;
	height: 44px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.stat-icon-box--blue {
	background: #e0f2fe;
}

.stat-icon-box--green {
	background: #dcfce7;
}

.stat-icon-box--purple {
	background: #dbeafe;
}

.stat-icon-box--orange {
	background: #ffedd5;
}

.stat-info {
	min-width: 0;
	display: flex;
	flex-direction: column;
}

.stat-label {
	font-size: 11px;
	color: #64748b;
	font-weight: 600;
}

.stat-value {
	font-size: 16px;
	font-weight: 800;
	line-height: 1.2;
}

.purchase-mgmt-table-wrapper {
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: #ffffff;
	overflow: hidden;
}

.purchase-mgmt-custom-table :deep(.v-table) {
	background: #ffffff !important;
}

.purchase-mgmt-custom-table :deep(th) {
	background: #f8fafc !important;
	font-size: 12px !important;
	font-weight: 700 !important;
	color: #64748b !important;
	border-bottom: 1px solid #e2e8f0 !important;
}

.purchase-mgmt-custom-table :deep(td) {
	border-bottom: 1px solid #f1f5f9 !important;
	font-size: 13px !important;
}

.purchase-mgmt-custom-table :deep(tr:hover) {
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

.purchase-preview-summary {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
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

.purchase-action-controls {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}

.purchase-action-total {
	display: flex;
	flex-direction: column;
	padding: 6px 12px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
}

@media (max-width: 960px) {
	.purchase-filter-grid-row {
		grid-template-columns: repeat(3, 1fr);
	}
	.purchase-mgmt-stat-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 600px) {
	.purchase-filter-grid-row {
		grid-template-columns: 1fr;
	}
	.purchase-mgmt-stat-grid {
		grid-template-columns: 1fr;
	}
}
</style>
