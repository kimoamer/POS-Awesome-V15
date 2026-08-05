<template>
	<div class="purchase-orders-page pa-0 h-100">
		<!-- Tablet & Mobile Tab Switcher (< 1200px) -->
		<div class="purchase-mobile-tabs">
			<div class="mobile-pane-toggle-wrapper">
				<v-btn-toggle v-model="activeMobileTab" mandatory class="mobile-pane-toggle" rounded="pill">
					<v-btn value="browse" class="mobile-pane-btn" prepend-icon="mdi-view-grid-outline">
						{{ __("Browse") }}
					</v-btn>
					<v-btn value="order" class="mobile-pane-btn" prepend-icon="mdi-cart-outline">
						{{ __("Order") }}
						<v-chip
							v-if="purchaseItems.length"
							size="x-small"
							color="primary"
							class="font-weight-bold ml-1"
							variant="flat"
						>
							<bdi>{{ purchaseItems.length }}</bdi>
						</v-chip>
					</v-btn>
				</v-btn-toggle>
			</div>
		</div>

		<div class="purchase-layout-grid" :class="{ 'has-bottom-bar': activeMobileTab === 'browse' && purchaseItems.length > 0 }">
			<!-- Left Column: Item Selector (Product Browser) -->
			<div
				class="purchase-layout-column purchase-layout-column--browse"
				:class="{ 'mobile-pane-hidden': activeMobileTab !== 'browse' }"
				:style="browserColumnStyle"
			>
				<ItemsSelector context="purchase" @add-item="onAddItem" />
			</div>

			<!-- Resizable Splitter (Desktop >= 1280px) -->
			<div
				class="purchase-splitter d-none d-lg-flex"
				@mousedown="startResizing"
				@touchstart.passive="startResizing"
				@dblclick="resetSplitRatio"
				title="Drag to resize | Double click to reset"
			>
				<div class="purchase-splitter__handle"></div>
			</div>

			<!-- Right Column: Purchase Order Form -->
			<div
				class="purchase-layout-column purchase-layout-column--order"
				:class="{ 'mobile-pane-hidden': activeMobileTab !== 'order' }"
			>
				<v-card class="h-100 d-flex flex-column pos-themed-card purchase-order-card" flat>
					<!-- Compact Header Bar (52-60px) -->
					<div class="purchase-order-header px-4 py-2 border-b d-flex align-center justify-space-between ga-2">
						<div class="d-flex align-center ga-2 flex-wrap">
							<div class="purchase-header-icon-box">
								<v-icon icon="mdi-file-document-edit-outline" color="primary" />
							</div>
							<span class="text-h6 font-weight-bold text-primary">
								{{ purchaseOrderName || __("New Purchase Order") }}
							</span>
							<v-chip
								v-if="loadedSubmittedOrder"
								size="small"
								color="success"
								variant="tonal"
								class="font-weight-bold"
							>
								{{ __("Submitted") }}
							</v-chip>
							<v-chip
								v-else
								size="small"
								color="warning"
								variant="tonal"
								class="font-weight-bold"
							>
								{{ __("Draft") }}
							</v-chip>
						</div>

						<v-btn
							variant="outlined"
							color="error"
							size="small"
							prepend-icon="mdi-delete-outline"
							class="font-weight-bold border-error"
							@click="clearPurchaseForm"
						>
							{{ __("Clear") }}
						</v-btn>
					</div>

					<v-card-text class="flex-grow-1 overflow-y-auto pa-4">
						<!-- Header Section (Supplier, Warehouse, Dates, Switches) -->
						<PurchaseHeader
							v-model:supplier="supplier"
							v-model:warehouse="warehouse"
							v-model:transactionDate="transactionDate"
							v-model:scheduleDate="scheduleDate"
							v-model:receiveNow="receiveNow"
							v-model:createInvoice="createInvoice"
							:supplierOptions="supplierOptions"
							:supplierLoading="supplierLoading"
							:warehouseOptions="warehouseOptions"
							:warehouseLoading="warehouseLoading"
							:allowCreateSupplier="allowCreateSupplier"
							:receiveDisabled="receiptComplete"
							:createInvoiceDisabled="invoiceComplete"
							:posProfile="pos_profile"
							@search-supplier="handleSupplierSearch"
							@create-supplier="supplierDialog = true"
						/>

						<v-divider class="my-4"></v-divider>

						<!-- Section Title -->
						<div class="d-flex align-center justify-space-between mb-2">
							<h4 class="text-subtitle-1 font-weight-bold text-primary d-flex align-center ga-1 mb-0">
								<v-icon size="20">mdi-cart-outline</v-icon>
								{{ __("Items") }} (<bdi>{{ purchaseItems.length }}</bdi>)
							</h4>
							<v-btn
								size="x-small"
								variant="outlined"
								color="primary"
								prepend-icon="mdi-plus"
								class="font-weight-bold"
								@click="activeMobileTab = 'browse'"
							>
								{{ __("Add Item") }}
							</v-btn>
						</div>

						<!-- Empty State when no items are present -->
						<div
							v-if="!purchaseItems.length"
							class="purchase-empty-state d-flex flex-column align-center justify-center text-center py-6 px-4 my-2"
						>
							<v-icon size="48" color="medium-emphasis" class="mb-2">mdi-cart-off</v-icon>
							<div class="text-subtitle-1 font-weight-bold text-medium-emphasis">
								{{ __("No items added yet") }}
							</div>
							<div class="text-body-2 text-disabled max-w-sm mt-1 mb-3">
								{{ __("Select items from the product browser to start the purchase order.") }}
							</div>
							<v-btn
								size="small"
								variant="tonal"
								color="primary"
								prepend-icon="mdi-view-grid-outline"
								class="font-weight-bold"
								@click="activeMobileTab = 'browse'"
							>
								{{ __("Browse Items") }}
							</v-btn>
						</div>

						<!-- Items Table Section -->
						<PurchaseItemsTable
							v-else
							:headers="itemHeaders"
							:items="purchaseItems"
							:currencySymbol="currencySymbol(priceListCurrency || supplierCurrency)"
							:receiveNow="receiveNow"
							:formatCurrency="formatCurrency"
							:formatNumber="formatNumber"
							@update-uom="({ item, value }) => updateItemUom(item, value)"
							@update-qty="({ item, value }) => updateItemQty(item, value)"
							@update-rate="({ item, value }) => updateItemRate(item, value)"
							@update-received-qty="({ item, value }) => updateItemReceivedQty(item, value)"
							@remove-item="removeItem"
						/>

						<v-alert v-if="errorMessage" type="error" density="compact" class="mt-4">
							{{ errorMessage }}
						</v-alert>

						<!-- Summary Card -->
						<div class="purchase-summary-card mt-4 pa-3 border rounded-lg">
							<v-row dense class="align-center">
								<v-col cols="4" class="text-center border-e">
									<div class="text-caption text-muted">{{ __("Items Count") }}</div>
									<div class="text-h6 font-weight-bold text-primary">
										<bdi>{{ purchaseItems.length }}</bdi>
									</div>
								</v-col>
								<v-col cols="4" class="text-center border-e">
									<div class="text-caption text-muted">{{ __("Total Quantity") }}</div>
									<div class="text-h6 font-weight-bold text-primary">
										<bdi>{{ formatNumber(totalQty) }}</bdi>
									</div>
								</v-col>
								<v-col cols="4" class="text-center">
									<div class="text-caption text-muted">{{ __("Grand Total") }}</div>
									<div class="text-h6 font-weight-bold text-success">
										<bdi>{{ currencySymbol(priceListCurrency || supplierCurrency) }}</bdi>
										<bdi>{{ formatCurrency(totalAmount) }}</bdi>
									</div>
								</v-col>
							</v-row>
						</div>
					</v-card-text>

					<!-- Footer Action Bar -->
					<div class="purchase-action-bar pa-3 border-t">
						<div class="d-flex align-center justify-space-between flex-wrap ga-2 w-100">
							<div class="d-flex align-center ga-2 flex-wrap">
								<v-btn
									variant="outlined"
									color="primary"
									size="small"
									prepend-icon="mdi-file-document-multiple-outline"
									class="font-weight-bold"
									@click="draftDialog = true"
									:disabled="submitLoading || draftSaveLoading"
								>
									{{ __("Drafts") }}
								</v-btn>
								<v-btn
									variant="outlined"
									color="secondary"
									size="small"
									prepend-icon="mdi-folder-search-outline"
									class="font-weight-bold"
									@click="managementDialog = true"
									:disabled="submitLoading || draftSaveLoading"
								>
									{{ __("Purchase Management") }}
								</v-btn>
								<v-btn
									variant="outlined"
									color="error"
									size="small"
									prepend-icon="mdi-delete-outline"
									class="font-weight-bold"
									@click="clearPurchaseForm"
								>
									{{ __("Clear") }}
								</v-btn>
							</div>

							<div class="d-flex align-center ga-2 flex-wrap">
								<v-btn
									variant="outlined"
									color="primary"
									size="small"
									prepend-icon="mdi-content-save-outline"
									class="font-weight-bold"
									@click="saveDraft"
									:loading="draftSaveLoading"
									:disabled="saveAndClearDisabled"
								>
									{{ __("Save & Clear") }}
								</v-btn>
								<v-btn
									color="primary"
									variant="flat"
									size="small"
									prepend-icon="mdi-credit-card-outline"
									class="font-weight-bold px-4"
									:loading="submitLoading"
									:disabled="submitLoading || !purchaseItems.length"
									@click="openPaymentDialog"
								>
									{{ __("Pay") }}
								</v-btn>
							</div>
						</div>
					</div>
				</v-card>
			</div>
		</div>

		<!-- Tablet & Mobile Bottom Order Summary Bar (In Browse View) -->
		<div
			v-if="activeMobileTab === 'browse' && purchaseItems.length"
			class="purchase-bottom-summary-bar d-lg-none pa-3 border-t bg-surface"
		>
			<div class="d-flex align-center justify-space-between ga-2 flex-wrap">
				<div class="d-flex align-center ga-3">
					<v-badge :content="purchaseItems.length" color="primary" inline>
						<v-avatar color="primary-container" size="42" class="border">
							<v-icon color="primary" size="24">mdi-cart-outline</v-icon>
						</v-avatar>
					</v-badge>
					<div>
						<div class="font-weight-bold text-subtitle-2">{{ __("Purchase Order in progress") }}</div>
						<div class="text-caption text-medium-emphasis">
							<bdi>{{ purchaseItems.length }}</bdi> {{ __("items added") }}
						</div>
					</div>
				</div>

				<div class="d-flex align-center ga-4">
					<div class="text-right d-none d-sm-block border-e pe-4">
						<div class="text-caption text-muted">{{ __("Total Quantity") }}</div>
						<div class="font-weight-bold text-subtitle-1"><bdi>{{ formatNumber(totalQty) }}</bdi></div>
					</div>

					<div class="text-right">
						<div class="text-caption text-muted">{{ __("Grand Total") }}</div>
						<div class="font-weight-bold text-subtitle-1 text-primary">
							<bdi>{{ currencySymbol(priceListCurrency || supplierCurrency) }}</bdi>
							<bdi>{{ formatCurrency(totalAmount) }}</bdi>
						</div>
					</div>

					<div class="d-flex align-center ga-2">
						<v-btn
							variant="outlined"
							color="primary"
							size="small"
							prepend-icon="mdi-cart-outline"
							class="font-weight-bold d-none d-sm-inline-flex"
							@click="activeMobileTab = 'order'"
						>
							{{ __("View Order") }} (<bdi>{{ purchaseItems.length }}</bdi>)
						</v-btn>
						<v-btn
							color="primary"
							variant="flat"
							size="small"
							append-icon="mdi-arrow-right"
							class="font-weight-bold"
							@click="activeMobileTab = 'order'"
						>
							{{ __("Order") }} <bdi>{{ purchaseItems.length }}</bdi>
						</v-btn>
					</div>
				</div>
			</div>
		</div>

		<!-- Payment Dialog -->
		<PurchasePaymentDialog
			v-model="paymentDialog"
			:total-amount="totalAmount"
			:currency="supplierCurrency"
			:pos-profile="pos_profile"
			:create-invoice="createInvoice"
			@submit="handlePaymentSubmit"
		/>

		<PurchaseDraftDialog
			v-model="draftDialog"
			:pos-profile="pos_profile"
			:warehouse-options="warehouseOptions"
			@select="handleDraftSelected"
		/>

		<PurchaseManagementDialog
			v-model="managementDialog"
			:pos-profile="pos_profile"
			:warehouse-options="warehouseOptions"
		/>

		<!-- Supplier Dialog -->
		<SupplierDialog
			v-model="supplierDialog"
			:groups="supplierGroups"
			:posProfile="pos_profile"
			@created="handleSupplierCreated"
			@error="(msg) => toastStore.show({ title: msg, color: 'error' })"
		/>
	</div>
</template>

<script>
import format, { normalizeDateForBackend } from "../../../format";
import { useUIStore } from "../../../stores/uiStore.js";
import { getOpeningStorage } from "../../../../offline/index";
import { useItemsStore } from "../../../stores/itemsStore";
import { useToastStore } from "../../../stores/toastStore";
import { usePurchaseOrder } from "../../../composables/pos/payments/usePurchaseOrder";
import ItemsSelector from "../items/ItemsSelector.vue";
import PurchasePaymentDialog from "./PurchasePaymentDialog.vue";
import PurchaseDraftDialog from "./PurchaseDraftDialog.vue";
import PurchaseManagementDialog from "./PurchaseManagementDialog.vue";
import SupplierDialog from "../dialogs/purchase/SupplierDialog.vue";
import PurchaseHeader from "./PurchaseHeader.vue";
import PurchaseItemsTable from "./PurchaseItemsTable.vue";
import { computed, ref, watch, onMounted, onBeforeUnmount, inject } from "vue";
import {
	extractPurchaseServerError,
	purchaseCurrencySymbol,
} from "./purchaseFormatting";

export default {
	mixins: [format],
	components: {
		ItemsSelector,
		PurchasePaymentDialog,
		PurchaseDraftDialog,
		PurchaseManagementDialog,
		SupplierDialog,
		PurchaseHeader,
		PurchaseItemsTable,
	},
	setup() {
		const uiStore = useUIStore();
		const toastStore = useToastStore();
		const itemsStore = useItemsStore();
		const eventBus = inject("eventBus");

		const activeMobileTab = ref("browse");
		const pos_profile = ref({});
		const receiveNow = ref(false);

		// Splitter Resizing State & Methods
		const STORAGE_KEY = "purchase_workspace_split_width";
		const DEFAULT_RATIO = 43; // 43% browser, 57% order
		const splitRatio = ref(DEFAULT_RATIO);
		const isResizing = ref(false);

		// Load saved split ratio from localStorage
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = parseFloat(saved);
				if (!isNaN(parsed) && parsed >= 25 && parsed <= 70) {
					splitRatio.value = parsed;
				}
			}
		} catch (e) {
			console.warn("Could not read split ratio from localStorage", e);
		}

		const browserColumnStyle = computed(() => {
			if (window.innerWidth < 1280) return {};
			return {
				flex: `0 0 ${splitRatio.value}%`,
				maxWidth: `calc(100% - 650px)`,
			};
		});

		const startResizing = (e) => {
			e.preventDefault();
			isResizing.value = true;
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";

			const onMouseMove = (moveEvent) => {
				if (!isResizing.value) return;
				const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
				const containerWidth = window.innerWidth;
				if (containerWidth <= 0) return;

				let newRatio = (clientX / containerWidth) * 100;

				// Min width constraints: Product Browser min 440px, Purchase Order min 650px
				const minBrowserRatio = (440 / containerWidth) * 100;
				const maxBrowserRatio = ((containerWidth - 650) / containerWidth) * 100;

				newRatio = Math.max(minBrowserRatio, Math.min(maxBrowserRatio, newRatio));
				splitRatio.value = Math.round(newRatio * 10) / 10;
			};

			const stopResizing = () => {
				if (!isResizing.value) return;
				isResizing.value = false;
				document.body.style.cursor = "";
				document.body.style.userSelect = "";

				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", stopResizing);
				window.removeEventListener("touchmove", onMouseMove);
				window.removeEventListener("touchend", stopResizing);

				try {
					localStorage.setItem(STORAGE_KEY, splitRatio.value.toString());
				} catch (err) {
					console.warn("Could not save split ratio to localStorage", err);
				}
			};

			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", stopResizing);
			window.addEventListener("touchmove", onMouseMove, { passive: true });
			window.addEventListener("touchend", stopResizing);
		};

		const resetSplitRatio = () => {
			splitRatio.value = DEFAULT_RATIO;
			try {
				localStorage.setItem(STORAGE_KEY, DEFAULT_RATIO.toString());
			} catch (err) {
				console.warn("Could not reset split ratio in localStorage", err);
			}
		};

		const {
			purchaseItems,
			purchaseOrderName,
			supplier,
			warehouse,
			transactionDate,
			scheduleDate,
			createInvoice,
			supplierCurrency,
			supplierPriceList,
			priceListCurrency,
			totalAmount,
			submitLoading,
			errorMessage,
			onAddItem,
			fetchSupplierInfo,
			updateItemUom,
			updateItemQty,
			updateItemRate,
			updateItemReceivedQty,
			removeItem,
			resetForm,
			generateLineId,
		} = usePurchaseOrder({
			posProfile: pos_profile,
			receiveNow: receiveNow,
			formatFloat: (val, prec) => format.methods.formatFloat.call({ currency_precision: 2 }, val, prec),
		});

		const supplierOptions = ref([]);
		const supplierLoading = ref(false);
		const supplierDialog = ref(false);
		const draftDialog = ref(false);
		const managementDialog = ref(false);
		const draftSaveLoading = ref(false);
		const paymentDialog = ref(false);
		const supplierGroups = ref([]);
		const warehouseOptions = ref([]);
		const warehouseLoading = ref(false);
		const payments = ref([]);
		const purchaseOrderProgress = ref({});
		const totalQty = computed(() =>
			purchaseItems.value.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
		);
		const receiptComplete = computed(() => !!purchaseOrderProgress.value?.receipt_complete);
		const invoiceComplete = computed(() => !!purchaseOrderProgress.value?.invoice_complete);
		const loadedSubmittedOrder = computed(() => Number(purchaseOrderProgress.value?.docstatus || 0) === 1);
		const saveAndClearDisabled = computed(
			() =>
				submitLoading.value ||
				draftSaveLoading.value ||
				!purchaseItems.value.length ||
				loadedSubmittedOrder.value,
		);

		const supplierSearchTimeout = ref(null);

		const handleSupplierSearch = (term) => {
			if (supplierSearchTimeout.value) clearTimeout(supplierSearchTimeout.value);
			supplierSearchTimeout.value = setTimeout(() => searchSuppliers(term), 300);
		};

		const searchSuppliers = async (searchText = "") => {
			supplierLoading.value = true;
			try {
				const { message } = await frappe.call({
					method: "posawesome.posawesome.api.purchase_orders.search_suppliers",
					args: { search_text: searchText, limit: 20 },
				});
				supplierOptions.value = Array.isArray(message) ? message : [];
				if (supplier.value) {
					const s = supplierOptions.value.find((s) => s.name === supplier.value);
					supplierCurrency.value = s?.default_currency || pos_profile.value.currency;
				}
			} catch (error) {
				console.error("Failed to fetch suppliers:", error);
			} finally {
				supplierLoading.value = false;
			}
		};

		const loadSupplierGroups = async () => {
			try {
				const { message } = await frappe.call({
					method: "frappe.client.get_list",
					args: {
						doctype: "Supplier Group",
						fields: ["name"],
						filters: { is_group: 0 },
						limit_page_length: 500,
					},
				});
				supplierGroups.value = (message || []).map((row) => row.name);
			} catch (error) {
				console.error("Failed to load groups:", error);
			}
		};

		const loadWarehouses = async () => {
			warehouseLoading.value = true;
			try {
				const { message } = await frappe.call({
					method: "frappe.client.get_list",
					args: {
						doctype: "Warehouse",
						fields: ["name", "warehouse_name"],
						filters: { company: pos_profile.value.company, is_group: 0, disabled: 0 },
					},
				});
				warehouseOptions.value = message || [];
			} catch (error) {
				console.error("Failed to load warehouses:", error);
			} finally {
				warehouseLoading.value = false;
			}
		};

		const handleSupplierCreated = (message) => {
			supplierOptions.value.unshift(message);
			supplier.value = message.name;
			supplierDialog.value = false;
		};

		const clearPurchaseForm = () => {
			const hasData = supplier.value || purchaseItems.value.length > 0;
			if (hasData) {
				if (!confirm(__("Are you sure you want to clear the purchase order? All unsaved items and details will be lost."))) {
					return;
				}
			}
			resetForm();
			purchaseOrderProgress.value = {};
		};

		const openPaymentDialog = () => {
			if (!validatePurchaseOrderForm()) {
				return;
			}
			errorMessage.value = "";
			paymentDialog.value = true;
		};

		const validatePurchaseOrderForm = () => {
			if (!supplier.value) {
				errorMessage.value = __("Supplier is required.");
				return false;
			}
			if (!purchaseItems.value.length) {
				errorMessage.value = __("Please add at least one item.");
				return false;
			}
			if (!transactionDate.value || !scheduleDate.value) {
				errorMessage.value = __("Supplier and dates are required.");
				return false;
			}
			errorMessage.value = "";
			return true;
		};

		const handlePaymentSubmit = ({ payments: p, print, print_format, print_invoice }) => {
			payments.value = p;
			paymentDialog.value = false;
			submitPurchaseOrder(print, print_format, print_invoice);
		};

		const extractServerError = (error) =>
			extractPurchaseServerError(error, __("Unable to create purchase order"));

		const buildPurchaseOrderPayload = ({ submit = true } = {}) => {
			const resolvedSupplier =
				typeof supplier.value === "object" && supplier.value !== null
					? supplier.value.name || supplier.value.supplier_name || ""
					: supplier.value;

			return {
				purchase_order: purchaseOrderName.value,
				supplier: resolvedSupplier,
				company: pos_profile.value.company,
				warehouse: warehouse.value,
				currency: supplierCurrency.value,
				buying_price_list: supplierPriceList.value,
				transaction_date: normalizeDateForBackend(transactionDate.value),
				schedule_date: normalizeDateForBackend(scheduleDate.value),
				submit: submit ? 1 : 0,
				receive: submit && receiveNow.value ? 1 : 0,
				create_invoice: submit && createInvoice.value ? 1 : 0,
				pos_profile: pos_profile.value,
				payments: submit ? payments.value : [],
				items: purchaseItems.value.map((item) => ({
					item_code: item.item_code,
					item_name: item.item_name,
					stock_uom: item.stock_uom,
					uom: item.uom,
					conversion_factor: item.conversion_factor,
					qty: item.qty,
					rate: item.rate,
					received_qty: submit && receiveNow.value ? item.received_qty : undefined,
					invoice_qty: submit && createInvoice.value ? item.pending_bill_qty || item.qty : undefined,
					bill_qty: submit && createInvoice.value ? item.pending_bill_qty || item.qty : undefined,
					warehouse: warehouse.value || item.warehouse,
				})),
			};
		};

		const saveDraft = async () => {
			if (!validatePurchaseOrderForm()) {
				return;
			}

			draftSaveLoading.value = true;
			try {
				const { message } = await frappe.call({
					method: "posawesome.posawesome.api.purchase_orders.create_purchase_order",
					args: { data: buildPurchaseOrderPayload({ submit: false }) },
				});
				if (message?.purchase_order) {
					const savedName = message.purchase_order;
					clearPurchaseForm();
					toastStore.show({
						title: __("Purchase Order {0} saved and cleared", [savedName]),
						color: "success",
					});
				}
			} catch (error) {
				errorMessage.value = extractServerError(error);
				toastStore.show({ title: errorMessage.value, color: "error" });
			} finally {
				draftSaveLoading.value = false;
			}
		};

		const formatDateForPicker = (value) => {
			const normalized = normalizeDateForBackend(value);
			if (!normalized) return null;
			const [year, month, day] = normalized.split("-");
			return `${day}-${month}-${year}`;
		};

		const handleDraftSelected = async (draft) => {
			if (!draft) return;

			purchaseOrderName.value = draft.name || null;
			purchaseOrderProgress.value = {
				docstatus: Number(draft.docstatus || 0),
				per_received: Number(draft.per_received || 0),
				per_billed: Number(draft.per_billed || 0),
				has_receipt: !!draft.has_receipt,
				has_invoice: !!draft.has_invoice,
				receipt_complete: !!draft.receipt_complete,
				invoice_complete: !!draft.invoice_complete,
				receipt_partial: !!draft.receipt_partial,
				invoice_partial: !!draft.invoice_partial,
			};
			supplier.value = draft.supplier || null;
			warehouse.value =
				draft.set_warehouse ||
				(draft.items || []).find((item) => item.warehouse)?.warehouse ||
				pos_profile.value?.warehouse ||
				null;
			transactionDate.value = formatDateForPicker(draft.transaction_date);
			scheduleDate.value = formatDateForPicker(draft.schedule_date || draft.transaction_date);
			supplierCurrency.value = draft.currency || pos_profile.value?.currency || null;
			supplierPriceList.value = draft.buying_price_list || supplierPriceList.value;
			priceListCurrency.value = draft.currency || priceListCurrency.value;
			receiveNow.value = false;
			createInvoice.value = false;
			payments.value = [];
			errorMessage.value = "";

			purchaseItems.value = (draft.items || []).map((item) => {
				const conversionFactor = Number(item.conversion_factor || 1) || 1;
				const rate = Number(item.rate || 0);
				const pendingReceiptQty = Number(item.pending_receipt_qty ?? item.qty ?? 0);
				const pendingBillQty = Number(item.pending_bill_qty ?? item.qty ?? 0);
				const visibleQty =
					Number(draft.docstatus || 0) === 1
						? Math.max(pendingReceiptQty, pendingBillQty)
						: Number(item.qty || 0);
				return {
					line_id: generateLineId(),
					item_code: item.item_code,
					item_name: item.item_name || item.item_code,
					stock_uom: item.stock_uom,
					item_group: item.item_group,
					item_uoms: item.item_uoms?.length
						? item.item_uoms
						: [{ uom: item.uom || item.stock_uom, conversion_factor: conversionFactor }],
					uom: item.uom || item.stock_uom,
					conversion_factor: conversionFactor,
					qty: visibleQty,
					rate,
					stock_uom_rate: conversionFactor ? rate / conversionFactor : rate,
					standard_rate: Number(item.standard_rate || 0),
					received_qty: pendingReceiptQty,
					receivedQtyManual: false,
					warehouse: item.warehouse,
					ordered_qty: Number(item.ordered_qty || item.qty || 0),
					pending_receipt_qty: pendingReceiptQty,
					billed_qty: Number(item.billed_qty || 0),
					pending_bill_qty: pendingBillQty,
					source_docstatus: Number(draft.docstatus || 0),
				};
			});

			if (draft.supplier) {
				const info = await fetchSupplierInfo(draft.supplier);
				if (info?.buying_price_list) {
					await itemsStore.updatePriceList(info.buying_price_list);
				}
			}

			toastStore.show({ title: __("Purchase Order draft loaded"), color: "success" });
		};

		const submitPurchaseOrder = async (print = false, printFormat = null, printInvoice = false) => {
			if (!validatePurchaseOrderForm()) {
				return;
			}
			submitLoading.value = true;
			try {
				const payload = buildPurchaseOrderPayload({ submit: true });
				const { message } = await frappe.call({
					method: "posawesome.posawesome.api.purchase_orders.create_purchase_order",
					args: { data: payload },
				});
				if (message?.purchase_order) {
					toastStore.show({ title: __("Purchase Order created"), color: "success" });
					if (print) {
						let doctype =
							printInvoice && message.purchase_invoice ? "Purchase Invoice" : "Purchase Order";
						let docname =
							printInvoice && message.purchase_invoice
								? message.purchase_invoice
								: message.purchase_order;
						const formatName =
							printFormat || pos_profile.value.print_format_for_purchase || "Standard";
						const printUrl = frappe.urllib.get_full_url(
							`/printview?doctype=${doctype}&name=${docname}&print_format=${encodeURIComponent(formatName)}`,
						);
						window.open(printUrl, "_blank")?.focus();
					}
					clearPurchaseForm();
				}
			} catch (error) {
				errorMessage.value = extractServerError(error);
				toastStore.show({ title: errorMessage.value, color: "error" });
			} finally {
				submitLoading.value = false;
			}
		};

		onMounted(async () => {
			const cachedData = getOpeningStorage();
			if (cachedData?.pos_profile) pos_profile.value = cachedData.pos_profile;

			watch(
				() => uiStore.posProfile,
				(p) => {
					if (p) pos_profile.value = p;
				},
				{ immediate: true },
			);
			watch(supplier, async (val) => {
				if (val) {
					const info = await fetchSupplierInfo(val);
					if (info?.buying_price_list) {
						await itemsStore.updatePriceList(info.buying_price_list);
					}
					eventBus?.emit?.("update_buying_price_list", {
						price_list: info?.buying_price_list || null,
						supplier: val,
					});
				} else {
					supplierCurrency.value = pos_profile.value.currency;
					eventBus?.emit?.("update_buying_price_list", null);
				}
			});

			try {
				const { message } = await frappe.call({
					method: "posawesome.posawesome.api.purchase_orders.get_buying_price_list",
				});
				if (message) await itemsStore.updatePriceList(message);
			} catch (e) {
				console.error("Failed price list load", e);
			}

			clearPurchaseForm();
			await Promise.all([searchSuppliers(""), loadSupplierGroups(), loadWarehouses()]);
		});

		onBeforeUnmount(() => {
			eventBus?.emit?.("update_buying_price_list", null);
			if (pos_profile.value?.selling_price_list)
				itemsStore.updatePriceList(pos_profile.value.selling_price_list);
		});

		return {
			activeMobileTab,
			browserColumnStyle,
			startResizing,
			resetSplitRatio,
			loadedSubmittedOrder,
			pos_profile,
			receiveNow,
			purchaseItems,
			purchaseOrderName,
			supplier,
			warehouse,
			transactionDate,
			scheduleDate,
			createInvoice,
			supplierCurrency,
			supplierPriceList,
			priceListCurrency,
			totalAmount,
			totalQty,
			receiptComplete,
			invoiceComplete,
			saveAndClearDisabled,
			submitLoading,
			draftSaveLoading,
			errorMessage,
			onAddItem,
			fetchSupplierInfo,
			updateItemUom,
			updateItemQty,
			updateItemRate,
			updateItemReceivedQty,
			removeItem,
			resetForm,
			clearPurchaseForm,
			supplierOptions,
			supplierLoading,
			supplierDialog,
			paymentDialog,
			supplierGroups,
			warehouseOptions,
			warehouseLoading,
			draftDialog,
			managementDialog,
			handleSupplierSearch,
			handleSupplierCreated,
			openPaymentDialog,
			handlePaymentSubmit,
			saveDraft,
			handleDraftSelected,
			toastStore,
		};
	},
	computed: {
		allowCreateSupplier() {
			return !!this.pos_profile?.posa_allow_create_purchase_suppliers;
		},
		itemHeaders() {
			const h = [
				{ title: "#", key: "index", align: "center", width: "40px" },
				{ title: __("Item"), key: "item_name", align: "start", width: "35%" },
				{ title: __("UOM"), key: "uom", align: "center", width: "15%" },
				{ title: __("Qty"), key: "qty", align: "center", width: "15%" },
				{ title: __("Rate"), key: "rate", align: "center", width: "15%" },
			];
			if (this.receiveNow)
				h.push({ title: __("Received Qty"), key: "received_qty", align: "center", width: "10%" });
			h.push(
				{ title: __("Amount"), key: "amount", align: "end", width: "10%" },
				{ title: __("Actions"), key: "actions", align: "center", width: "60px" },
			);
			return h;
		},
	},
	methods: {
		formatNumber(v) {
			return this.formatFloat(v, 2);
		},
		currencySymbol(c) {
			return purchaseCurrencySymbol(c || this.pos_profile.currency);
		},
	},
};
</script>

<style scoped>
/* ===== PAGE WRAPPER ===== */
.purchase-orders-page {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	height: 100%;
	width: 100%;
}

/* ===== MOBILE/TABLET TAB SWITCHER (hidden on desktop) ===== */
.purchase-mobile-tabs {
	display: none;
	height: 56px;
	min-height: 56px;
	align-items: center;
	justify-content: center;
	background: rgba(var(--v-theme-surface), 1);
	border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
	flex-shrink: 0;
}

.mobile-pane-toggle-wrapper {
	display: flex;
	justify-content: center;
	width: 100%;
	max-width: 420px;
}

.mobile-pane-toggle {
	border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
	padding: 3px;
	height: 40px !important;
}

.mobile-pane-btn {
	min-width: 130px !important;
	height: 34px !important;
	border-radius: 20px !important;
	font-weight: 700 !important;
	font-size: 13px !important;
	text-transform: none !important;
	letter-spacing: 0 !important;
}

/* ===== DESKTOP SPLIT VIEW (>= 1280px) ===== */
.purchase-layout-grid {
	display: flex;
	flex: 1 1 0;
	min-height: 0;
	width: 100%;
	overflow: hidden;
}

/* === Browse Column (Left) 45% === */
.purchase-layout-column--browse {
	flex: 0 0 45%;
	min-width: 420px;
	height: 100%;
	border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
	min-height: 0;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

/* Override ItemsSelector's JS-computed inline height inside purchase context */
/* The ItemsSelector sets inline height/maxHeight via selectorCardStyle, we reset it */
.purchase-layout-column--browse :deep(.items-selector-shell) {
	height: 100% !important;
	max-height: 100% !important;
	min-height: 0 !important;
	flex: 1 1 0 !important;
	overflow: hidden !important;
}

.purchase-layout-column--browse :deep(.selection-card) {
	height: 100% !important;
	max-height: 100% !important;
	min-height: 0 !important;
	overflow: hidden !important;
	margin-top: 0 !important;
}

/* === Order Column (Right) 55% === */
.purchase-layout-column--order {
	flex: 1 1 55%;
	min-width: 520px;
	height: 100%;
	min-height: 0;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

/* ===== TABLET & MOBILE (< 1280px) ===== */
@media (max-width: 1279px) {
	.purchase-orders-page {
		height: calc(100dvh - 52px);
	}

	.purchase-mobile-tabs {
		display: flex;
	}

	.purchase-layout-grid {
		display: block;
		flex: 1 1 0;
		height: auto;
		min-height: 0;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.purchase-layout-grid.has-bottom-bar {
		padding-bottom: 80px;
	}

	.purchase-layout-column--browse,
	.purchase-layout-column--order {
		flex: none;
		min-width: 0;
		width: 100%;
		height: auto;
		overflow: visible;
		border-inline-end: none;
	}

	/* On mobile, restore ItemsSelector natural height flow */
	.purchase-layout-column--browse :deep(.items-selector-shell),
	.purchase-layout-column--browse :deep(.selection-card) {
		height: auto !important;
		max-height: none !important;
	}

	.mobile-pane-hidden {
		display: none;
	}
}

/* ===== BOTTOM SUMMARY BAR ===== */
.purchase-bottom-summary-bar {
	position: sticky;
	bottom: 0;
	z-index: 10;
	background: rgba(var(--v-theme-surface), 1);
	box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
	border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* ===== PURCHASE ORDER CARD - Flex column to fill right column ===== */
.purchase-order-card {
	border-radius: 0 !important;
	height: 100% !important;
	display: flex !important;
	flex-direction: column !important;
}

/* Override Vuetify's v-card-text flex to let it scroll */
.purchase-order-card :deep(.v-card-text) {
	flex: 1 1 0 !important;
	min-height: 0 !important;
	overflow-y: auto !important;
	overflow-x: hidden !important;
}

.purchase-order-header {
	height: 56px;
	min-height: 56px;
	flex-shrink: 0;
	border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.purchase-header-icon-box {
	width: 34px;
	height: 34px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 8px;
	background: rgba(var(--v-theme-primary), 0.1);
	flex-shrink: 0;
}

/* ===== EMPTY STATE - Cap height to avoid filling the screen ===== */
.purchase-empty-state {
	border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
	border-radius: 12px;
	min-height: 180px;
	max-height: 280px;
	padding: 24px !important;
}

.max-w-sm {
	max-width: 380px;
}

/* ===== SUMMARY CARD ===== */
.purchase-summary-card {
	background: rgba(var(--v-theme-primary), 0.04);
	border: 1px solid rgba(var(--v-theme-primary), 0.15) !important;
}

/* ===== ACTION BAR - sticky inside right column ===== */
.purchase-action-bar {
	flex-shrink: 0;
	position: sticky;
	bottom: 0;
	z-index: 5;
	background: rgba(var(--v-theme-surface), 1);
	border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
	box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}

/* ===== MISC ===== */
.cursor-pointer {
	cursor: pointer;
}
</style>

