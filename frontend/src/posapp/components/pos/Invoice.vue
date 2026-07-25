<template>
	<!-- Main Invoice Wrapper -->
	<div class="pa-0 invoice-shell">
		<!-- Cancel Sale Confirmation Dialog -->
		<CancelSaleDialog v-model="cancel_dialog" @confirm="cancel_invoice" />

		<!-- Main Invoice Card (contains all invoice content) -->
		<v-card
			ref="invoiceCard"
			:style="{
				height: invoiceHeight || 'var(--container-height)',
				maxHeight: invoiceHeight || 'var(--container-height)',
				resize: canResizeInvoicePanel() ? 'vertical' : 'none',
				overflow: 'hidden',
			}"
			:class="[
				'cards my-0 py-0 mt-3 resizable invoice-main-card',
				'pos-themed-card',
				{ 'return-mode': isReturnInvoice },
			]"
			@mouseup="saveInvoiceHeight($refs.invoiceCard)"
			@touchend="saveInvoiceHeight($refs.invoiceCard)"
		>
			<div class="invoice-workspace dynamic-padding">
				<section class="invoice-customer-region invoice-region">
					<div
						class="invoice-top-grid"
						:class="{
							'invoice-top-grid--with-delivery':
								pos_profile && pos_profile.posa_use_delivery_charges,
						}"
					>
						<v-card flat class="invoice-section-card invoice-customer-card pos-themed-card">
							<InvoiceCustomerSection
								ref="customerSection"
								:pos_profile="pos_profile"
								:invoiceTypes="invoiceTypes"
								v-model="invoiceType"
							/>
						</v-card>

						<v-card
							v-if="pos_profile.posa_use_delivery_charges"
							flat
							class="invoice-section-card delivery-charges-card pos-themed-card"
						>
							<div class="invoice-section-heading">
								<h3 class="invoice-section-heading__title">{{ __("Delivery Charges") }}</h3>
							</div>
							<DeliveryCharges
								ref="deliveryChargesComponent"
								:pos_profile="pos_profile"
								:delivery_charges="delivery_charges"
								:selected_delivery_charge="selected_delivery_charge"
								:delivery_charges_rate="delivery_charges_rate"
								:deliveryChargesFilter="deliveryChargesFilter"
								:formatCurrency="formatCurrency"
								:currencySymbol="currencySymbol"
								:readonly="readonly"
								@update:selected_delivery_charge="
									(val) => {
										selected_delivery_charge = val;
										update_delivery_charges(conversion_rate, currency_precision);
									}
								"
							/>
						</v-card>
					</div>
				</section>

				<section class="invoice-command-region invoice-region">
					<v-alert
						v-if="pos_profile.create_pos_invoice_instead_of_sales_invoice"
						type="info"
						density="compact"
						class="invoice-status-alert mb-0"
					>
						{{ __("Invoices saved as POS Invoices") }}
					</v-alert>
					<div class="invoice-meta-grid">
						<v-card
							v-if="pos_profile.posa_allow_change_posting_date"
							flat
							class="invoice-section-card pos-themed-card"
						>
							<div class="invoice-section-heading">
								<h3 class="invoice-section-heading__title">
									{{ __("Posting and Price List") }}
								</h3>
							</div>
							<PostingDateRow
								ref="postingDateComponent"
								:pos_profile="pos_profile"
								:posting_date_display="posting_date_display"
								:customer_balance="customer_balance"
								:customer_balance_currency="customer_balance_currency"
								:balance_loading="customer_balance_loading"
								:price-list="selected_price_list"
								:price-lists="price_lists"
								:formatCurrency="formatCurrency"
								:currencySymbol="currencySymbol"
								@update:posting_date_display="
									(val) => {
										posting_date_display = val;
									}
								"
								@update:priceList="
									(val) => {
										selected_price_list = val;
									}
								"
							/>
						</v-card>

						<v-card
							v-if="pos_profile.posa_allow_multi_currency"
							flat
							class="invoice-section-card pos-themed-card"
						>
							<div class="invoice-section-heading">
								<h3 class="invoice-section-heading__title">{{ __("Multi Currency") }}</h3>
							</div>
							<MultiCurrencyRow
								:pos_profile="pos_profile"
								:selected_currency="selected_currency"
								:plc_conversion_rate="exchange_rate"
								:conversion_rate="conversion_rate"
								:available_currencies="available_currencies"
								:isNumber="isNumber"
								:price_list_currency="price_list_currency"
								@update:selected_currency="
									(val) => {
										selected_currency = val;
										update_currency(val);
									}
								"
								@update:plc_conversion_rate="
									(val) => {
										exchange_rate = val;
										update_exchange_rate();
									}
								"
								@update:conversion_rate="
									(val) => {
										conversion_rate = val;
										update_conversion_rate();
									}
								"
							/>
						</v-card>
					</div>

					<v-card flat class="invoice-section-card invoice-items-command-card pos-themed-card">
						<div class="invoice-section-heading">
							<h3 class="invoice-section-heading__title">
								<span>{{ __("Invoice Items") }}</span>
							</h3>
							<span class="invoice-section-heading__count">
								{{ items.length }} {{ items.length === 1 ? __("item") : __("items") }}
							</span>
						</div>
						<InvoiceItemsActionToolbar
							ref="actionToolbar"
							:itemSearch="itemSearch"
							:availableColumns="available_columns"
							:selectedColumns="selected_columns"
							:currentView="itemsTableRef?.effectiveInvoiceItemsView || 'list'"
							:showViewToggle="itemsTableRef?.showViewToggle ?? true"
							@update:itemSearch="itemSearch = $event"
							@update:selectedColumns="
								(cols) => {
									setSelectedColumns(cols);
									saveColumnPreferences();
								}
							"
							@update:currentView="itemsTableRef?.setInvoiceItemsView($event)"
						/>
					</v-card>
				</section>

				<section class="invoice-cart-items-region invoice-region">
					<div class="items-table-wrapper">
						<ItemsTable
							ref="itemsTableRef"
							:headers="items_headers"
							v-model:expanded="expanded"
							:itemsPerPage="itemsPerPage"
							:itemSearch="itemSearch"
							:pos_profile="pos_profile"
							:invoiceType="invoiceType"
							:stock_settings="stock_settings"
							:displayCurrency="displayCurrency"
							:formatFloat="formatFloat"
							:formatCurrency="formatCurrency"
							:currencySymbol="currencySymbol"
							:isNumber="isNumber"
							:setFormatedQty="setFormatedQty"
							:setFormatedCurrency="setFormatedCurrency"
							:calcPrices="calc_prices"
							:calcUom="calc_uom"
							:setSerialNo="set_serial_no"
							:setBatchQty="set_batch_qty"
							:validateDueDate="validate_due_date"
							:removeItem="remove_item"
							:subtractOne="subtract_one"
							:addOne="add_one"
							:toggleOffer="toggleOffer"
							:changePriceListRate="change_price_list_rate"
							:isNegative="isNegative"
							@update:expanded="handleExpandedUpdate"
							@reorder-items="handleItemReorder"
							@add-item-from-drag="handleItemDrop"
							@show-drop-feedback="(isDragging) => showDropFeedback(isDragging, itemsTableRef)"
							@item-dropped="showDropFeedback(false, itemsTableRef)"
							@view-packed="openPackedItems"
						/>

						<PackedItemsDialog
							v-model="show_packed_dialog"
							:items="packed_dialog_items"
							:displayCurrency="displayCurrency"
							:formatFloat="formatFloat"
							:formatCurrency="formatCurrency"
							:currencySymbol="currencySymbol"
						/>
					</div>
				</section>

				<section class="invoice-footer-region invoice-region">
					<InvoiceSummary
						ref="invoiceSummary"
						:pos_profile="pos_profile"
						:total_qty="total_qty"
						:additional_discount="additional_discount"
						:additional_discount_percentage="additional_discount_percentage"
						:total_items_discount_amount="total_items_discount_amount"
						:subtotal="subtotal"
						:displayCurrency="displayCurrency"
						:formatFloat="formatFloat"
						:formatCurrency="formatCurrency"
						:currencySymbol="currencySymbol"
						:discount_percentage_offer_name="discount_percentage_offer_name"
						:isNumber="isNumber"
						:return_discount_meta="return_discount_meta"
						@update:additional_discount="(val) => (additional_discount = val)"
						@update:additional_discount_percentage="
							(val) => (additional_discount_percentage = val)
						"
						@update_discount_umount="update_discount_umount"
						@save-and-clear="save_and_clear_invoice"
						@load-drafts="get_draft_invoices"
						@select-order="get_draft_orders"
						@cancel-sale="cancel_dialog = true"
						@open-invoice-management="open_invoice_management"
						@open-returns="open_returns"
						@print-draft="print_draft_invoice"
						@show-payment="handleShowPaymentRequest"
						@open-customer-display="handleOpenCustomerDisplayRequest"
						@resume-parked-order="resume_parked_order"
					/>
				</section>
			</div>
		</v-card>

		<!-- Payment Confirmation Dialog -->
		<PaymentConfirmationDialog
			ref="paymentConfirmationDialog"
			v-model="confirm_payment_dialog"
			:amount="payment_confirmation_amount"
			:currency-symbol="currencySymbol(displayCurrency)"
			:format-currency="(value) => formatCurrency(value, displayCurrency)"
			:tender-suggestions="payment_confirmation_tender_suggestions"
			@confirm="resolvePaymentConfirmation($event)"
			@cancel="resolvePaymentConfirmation(null)"
		/>
		<PriceListRateDialog
			v-model="price_list_rate_dialog_open"
			:initial-rate="price_list_rate_dialog_initial_rate"
			:item-label="price_list_rate_dialog_item_label"
			:currency-symbol="currencySymbol(selected_currency || pos_profile?.currency)"
			@submit="handlePriceListRateDialogSubmit"
			@cancel="handlePriceListRateDialogCancel"
		/>
	</div>
</template>

<script>
import format from "../../format";
import InvoiceCustomerSection from "./invoice/InvoiceCustomerSection.vue";
import DeliveryCharges from "./invoice/DeliveryCharges.vue";
import PostingDateRow from "./invoice/PostingDateRow.vue";
import MultiCurrencyRow from "./invoice/MultiCurrencyRow.vue";
import CancelSaleDialog from "./invoice/CancelSaleDialog.vue";
import InvoiceSummary from "./invoice/InvoiceSummary.vue";
import ItemsTable from "./invoice/ItemsTable.vue";
import InvoiceItemsActionToolbar from "./invoice/InvoiceItemsActionToolbar.vue";
import PackedItemsDialog from "./invoice/PackedItemsDialog.vue";
import PaymentConfirmationDialog from "./payments/PaymentConfirmationDialog.vue";
import PriceListRateDialog from "./invoice/PriceListRateDialog.vue";
import invoiceItemMethods from "./invoice/invoiceItemMethods";
import invoiceComputed from "./invoice/invoiceComputed";
import invoiceWatchers from "./invoice/invoiceWatchers";
import shortcutMethods from "./invoice/invoiceShortcuts";
import { useInvoiceStore } from "../../stores/invoiceStore.js";
import { useCustomersStore } from "../../stores/customersStore.js";
import { useToastStore } from "../../stores/toastStore.js";
import { useUIStore } from "../../stores/uiStore.js";
import { storeToRefs } from "pinia";
import stockCoordinator from "../../utils/stockCoordinator";
import { getCurrentInstance, ref } from "vue";
import { save_and_clear_invoice as saveAndClearInvoiceAction } from "./invoice_utils/actions";
import { fetchDraftInvoices } from "../../utils/draftInvoices";
import { getQuickCashTenderSuggestions } from "../../utils/cashTender";

// Composables
import { useOnlineStatus } from "../../composables/core/useOnlineStatus";
import { useInvoiceCurrency } from "../../composables/pos/invoice/useInvoiceCurrency";
import { useInvoiceItems } from "../../composables/pos/invoice/useInvoiceItems";
import { useInvoiceOffers } from "../../composables/pos/invoice/useInvoiceOffers";
import { useInvoiceUI } from "../../composables/pos/invoice/useInvoiceUI";
import { useInvoicePrinting } from "../../composables/pos/invoice/useInvoicePrinting";
import { useInvoiceStock } from "../../composables/pos/invoice/useInvoiceStock";
import { usePaymentPrinting } from "../../composables/pos/payments/usePaymentPrinting";
import {
	buildInvoicePdfUrl,
	resolveInvoiceDoctype,
	shouldDownloadPdfForShareError,
} from "../../utils/invoiceSharing";
import {
	createInvoiceShortcutListeners,
	registerInvoiceShortcutListener,
	unregisterInvoiceShortcutListener,
} from "../../utils/invoiceShortcutListener";

export default {
	name: "POSInvoice",
	mixins: [format],
	setup() {
		const instance = getCurrentInstance();
		const uiStore = useUIStore();
		const invoiceStore = useInvoiceStore();
		const customersStore = useCustomersStore();
		const toastStore = useToastStore();
		const { isOnline } = useOnlineStatus();

		const { activeView, posProfile: livePosProfile } = storeToRefs(uiStore);
		const { selectedCustomer, refreshToken: customerRefreshToken } = storeToRefs(customersStore);
		const {
			items,
			packedItems: packed_items,
			invoiceDoc: invoice_doc,
			invoiceType,
			flowToLoad,
			flowContext,
		} = storeToRefs(invoiceStore);
		const itemsTableRef = ref(null);
		const currencyState = useInvoiceCurrency({}, {});
		const itemActions = useInvoiceItems(invoiceType);
		const offerLogic = useInvoiceOffers();

		// New composables
		const uiLogic = useInvoiceUI();
		const { loadPrintPage } = usePaymentPrinting({
			invoiceDoc: invoice_doc,
			posProfile: livePosProfile,
			invoiceType,
		});
		const printingLogic = useInvoicePrinting(
			livePosProfile,
			loadPrintPage,
			() => {
				if (!instance?.proxy) {
					return Promise.resolve(null);
				}
				return saveAndClearInvoiceAction(instance.proxy);
			},
			invoice_doc,
		);

		const stockLogic = useInvoiceStock(items, packed_items, uiStore.eventBus, () => {});

		return {
			uiStore,
			activeView,
			isOnline,
			toastStore,
			invoiceStore,
			customersStore,
			selectedCustomer,
			customerRefreshToken,
			invoiceType,
			flowToLoad,
			flowContext,
			itemsTableRef,
			...currencyState,
			...itemActions,
			...offerLogic,
			...uiLogic,
			...printingLogic,
			...stockLogic,
		};
	},
	data() {
		return {
			is_sharing: false,
			pos_profile: "",
			pos_opening_shift: "",
			stock_settings: "",
			return_doc: "",
			customer: "",
			customer_info: "",
			customer_balance: 0,
			customer_balance_currency: undefined,
			customer_balance_loading: false,
			total_tax: 0,
			packed_dialog_items: [],
			show_packed_dialog: false,
			invoiceTypes: ["Invoice", "Order", "Quotation"],
			itemsPerPage: 1000,
			itemSearch: "",
			expanded: [],
			singleExpand: true,
			cancel_dialog: false,
			available_stock_cache: {},
			item_detail_cache: {},
			item_stock_cache: {},
			brand_cache: {},
			stockUnsubscribe: null,
			invoice_posting_date: false,
			posting_date_display: "",
			_shortcutHandlers: {},
			shortcutSubmitInFlight: false,
			shortcutCycle: {
				qty: 0,
				uom: 0,
				rate: 0,
			},
			return_discount_base_total: 0,
			return_discount_base_amount: 0,
			_busHandlers: {},
			price_list_rate_dialog_open: false,
			price_list_rate_dialog_initial_rate: "",
			price_list_rate_dialog_item_label: "",
			price_list_rate_dialog_resolver: null,
		};
	},

	components: {
		InvoiceCustomerSection,
		DeliveryCharges,
		PostingDateRow,
		MultiCurrencyRow,
		InvoiceSummary,
		CancelSaleDialog,
		ItemsTable,
		InvoiceItemsActionToolbar,
		PackedItemsDialog,
		PaymentConfirmationDialog,
		PriceListRateDialog,
	},
	computed: {
		items: {
			get() {
				return this.invoiceStore.items;
			},
			set(value) {
				this.invoiceStore.setItems(value);
			},
		},
		invoice_doc: {
			get() {
				return this.invoiceStore.invoiceDoc;
			},
			set(value) {
				this.invoiceStore.setInvoiceDoc(value);
			},
		},
		packed_items: {
			get() {
				return this.invoiceStore.packedItems;
			},
			set(value) {
				this.invoiceStore.setPackedItems(value);
			},
		},
		paymentVisible() {
			return this.activeView === "payment" || this.uiStore.paymentDialogOpen;
		},
		discount_amount: {
			get() {
				return this.invoiceStore.discountAmount;
			},
			set(val) {
				this.invoiceStore.setDiscountAmount(val);
			},
		},
		additional_discount: {
			get() {
				return this.invoiceStore.additionalDiscount;
			},
			set(val) {
				this.invoiceStore.setAdditionalDiscount(val);
			},
		},
		additional_discount_percentage: {
			get() {
				return this.invoiceStore.additionalDiscountPercentage;
			},
			set(val) {
				this.invoiceStore.setAdditionalDiscountPercentage(val);
			},
		},
		posting_date: {
			get() {
				return this.invoiceStore.postingDate;
			},
			set(val) {
				this.invoiceStore.setPostingDate(val);
			},
		},
		return_discount_meta() {
			if (!this.isReturnInvoice || !this.return_doc || this.pos_profile?.posa_use_percentage_discount) {
				return null;
			}

			const originalDiscount = Math.abs(Number(this.return_discount_base_amount || 0));
			if (!originalDiscount) return null;

			const originalTotal = Math.abs(Number(this.return_discount_base_total || 0));
			if (!originalTotal) return null;

			const returnTotal = Math.abs(Number(this.Total || 0));
			if (!returnTotal) return null;

			const ratio = Math.min(1, returnTotal / originalTotal);
			const prorated = originalDiscount * ratio;

			return {
				ratio,
				original_discount: originalDiscount,
				prorated_discount: prorated,
			};
		},
		payment_confirmation_tender_suggestions() {
			return getQuickCashTenderSuggestions({
				amount: this.payment_confirmation_amount,
				currency: this.displayCurrency || this.selected_currency || this.pos_profile?.currency,
				posProfile: this.pos_profile,
				payments:
					Array.isArray(this.invoice_doc?.payments) && this.invoice_doc.payments.length
						? this.invoice_doc.payments
						: this.pos_profile?.payments,
			});
		},
		...invoiceComputed,
	},

	methods: {
		formatDateForDisplay(date) {
			if (!date) return "";
			const parts = date.split("-");
			if (parts.length === 3) {
				return `${parts[2]}-${parts[1]}-${parts[0]}`;
			}
			return date;
		},
		...shortcutMethods,
		...invoiceItemMethods,
		focusCustomerSearchField() {
			const customerSection = this.$refs.customerSection;
			if (customerSection && typeof customerSection.focusCustomerSearch === "function") {
				customerSection.focusCustomerSearch();
			}
		},

		focusItemSearchField() {
			this.uiStore.triggerItemSearchFocus();
		},

		focusCartItemQty(payload = {}) {
			const rows = Array.isArray(this.items) ? this.items : [];
			if (!rows.length) return;

			const requestedItem = payload?.item || payload;
			const rowId = payload?.rowId || requestedItem?.posa_row_id;
			const itemCode = payload?.itemCode || requestedItem?.item_code;
			let index = -1;

			if (rowId) {
				index = rows.findIndex((row) => row?.posa_row_id === rowId);
			}
			if (index < 0 && itemCode) {
				index = rows.findIndex((row) => row?.item_code === itemCode);
			}
			if (index < 0) {
				index = 0;
			}

			this.$nextTick(() => {
				window.setTimeout(() => {
					const focused = this.$refs.itemsTableRef?.focusItemField?.(index, "qty");
					if (!focused && index !== 0) {
						this.$refs.itemsTableRef?.focusItemField?.(0, "qty");
					}
				}, 0);
			});
		},

		focusAdditionalDiscountField() {
			this.eventBus?.emit?.("focus_additional_discount");
			this.$refs.invoiceSummary?.focusAdditionalDiscountField?.();
		},

		handleStockCoordinatorUpdate(event = {}) {
			const codes = Array.isArray(event.codes) ? event.codes : [];
			if (!codes.length) return;
			this.applyStockStateToInvoiceItems(codes);
		},

		// UI methods from composable are available in scope but might need wrapping if they access 'this' context unavailable in setup
		// showDropFeedback is handled by composable

		openPackedItems(bundle_id) {
			this.packed_dialog_items = this.packed_items.filter((it) => it.bundle_id === bundle_id);
			this.show_packed_dialog = true;
		},

		makeid(length) {
			let result = "";
			const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
			const charactersLength = characters.length;
			for (var i = 0; i < length; i++) {
				result += characters.charAt(Math.floor(Math.random() * charactersLength));
			}
			return result;
		},

		handleExpandedUpdate(ids) {
			this.expanded = Array.isArray(ids) ? ids.slice(-1) : [];
		},

		async share_last_invoice() {
			if (this.is_sharing) {
				return;
			}
			this.is_sharing = true;
			this.eventBus.emit("show_message", {
				title: __("Preparing invoice for sharing..."),
				color: "info",
			});
			try {
				const profile_name = this.pos_profile?.name;
				if (!profile_name) {
					throw new Error(__("POS Profile is not available."));
				}
				const doctype = resolveInvoiceDoctype(this.pos_profile);
				const result = await frappe.call({
					method: "frappe.client.get_list",
					args: {
						doctype,
						filters: { pos_profile: profile_name, docstatus: 1 },
						fields: ["name"],
						order_by: "creation desc",
						limit_page_length: 1,
					},
				});
				if (!result.message || result.message.length === 0) {
					throw new Error(__("No submitted invoices found for this profile."));
				}
				const invoice_name = result.message[0].name;
				const format =
					this.pos_profile.print_format_for_online || this.pos_profile.print_format || "Standard";
				const pdf_url = buildInvoicePdfUrl({ doctype, name: invoice_name, format });
				const response = await fetch(pdf_url, {
					method: "GET",
					headers: { "X-Frappe-CSRF-Token": frappe.csrf_token },
				});
				if (!response.ok) {
					throw new Error(__("Failed to download invoice. Status: {0}", [response.status]));
				}
				const blob = await response.blob();
				const file = new File([blob], `${invoice_name}.pdf`, { type: "application/pdf" });
				const canShare =
					navigator.share && navigator.canShare && navigator.canShare({ files: [file] });
				if (canShare) {
					try {
						await navigator.share({
							title: __("Sales Invoice"),
							text: __("Invoice No: {0}", [invoice_name]),
							files: [file],
						});
					} catch (shareError) {
						// User dismissed the native share sheet: fall back to download.
						if (shouldDownloadPdfForShareError(shareError)) {
							this.download_pdf_blob(blob, invoice_name);
						}
					}
				} else {
					// Web Share API (with files) unavailable: download instead.
					this.download_pdf_blob(blob, invoice_name);
				}
			} catch (error) {
				this.eventBus.emit("show_message", {
					title: error.message || __("Failed to share invoice"),
					color: "error",
				});
			} finally {
				this.is_sharing = false;
			}
		},

		download_pdf_blob(blob, invoice_name) {
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${invoice_name}.pdf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		},

		applyReturnDiscountProration(options = {}) {
			const { defer } = options || {};
			if (defer && typeof this.$nextTick === "function") {
				this.$nextTick(() => {
					setTimeout(() => this.applyReturnDiscountProration(), 0);
				});
				return;
			}

			if (
				!this.isReturnInvoice ||
				this.pos_profile?.posa_use_percentage_discount ||
				!this.return_doc ||
				typeof this.return_doc !== "object"
			) {
				return;
			}

			const originalDiscount = Math.abs(Number(this.return_discount_base_amount || 0));
			const originalTotal = Math.abs(Number(this.return_discount_base_total || 0));
			const returnTotal = Math.abs(Number(this.Total || 0));

			if (!originalDiscount || !originalTotal || !returnTotal) {
				return;
			}

			const ratio = Math.min(1, returnTotal / originalTotal);
			const prorated = -Math.abs(originalDiscount * ratio);

			console.log("[POSA][Returns] Event auto-prorate discount", {
				originalDiscount,
				originalTotal,
				returnTotal,
				ratio,
				prorated,
			});

			this.discount_amount = prorated;
			this.additional_discount = prorated;
			this.additional_discount_percentage = 0;
		},

		async set_delivery_charges(options = {}) {
			const { forceReset = false } = options;
			if (!this.pos_profile || !this.customer || !this.pos_profile.posa_use_delivery_charges) {
				this.delivery_charges = [];
				this.base_delivery_charges_rate = 0;
				this.delivery_charges_rate = 0;
				this.selected_delivery_charge = "";
				return;
			}

			if (forceReset) {
				this.base_delivery_charges_rate = 0;
				this.delivery_charges_rate = 0;
				this.selected_delivery_charge = "";
			}
			try {
				const r = await frappe.call({
					method: "posawesome.posawesome.api.offers.get_applicable_delivery_charges",
					args: {
						company: this.pos_profile.company,
						pos_profile: this.pos_profile.name,
						customer: this.customer,
					},
				});
				if (r.message && r.message.length) {
					this.delivery_charges = r.message;
				}
			} catch (error) {
				console.error("Failed to fetch delivery charges", error);
			}
		},
		deliveryChargesFilter(itemText, queryText, itemRow) {
			const item = itemRow.raw;
			const textOne = item.name.toLowerCase();
			const searchText = queryText.toLowerCase();
			return textOne.indexOf(searchText) > -1;
		},
		updatePostingDate(date) {
			if (!date) return;
			this.posting_date = date;
			this.invoiceStore.setPostingDate(date);
			this.$forceUpdate();
		},

		update_exchange_rate() {
			this.sync_exchange_rate();
		},

		update_conversion_rate() {
			this.sync_exchange_rate();
		},

		async update_exchange_rate_on_server() {
			if (this.conversion_rate) {
				if (!this.items.length) {
					this.sync_exchange_rate();
					return;
				}

				const doc = this.get_invoice_doc();
				doc.conversion_rate = this.conversion_rate;
				doc.plc_conversion_rate = this._getPlcConversionRate();
				try {
					const resp = await this.update_invoice(doc);
					if (resp && resp.exchange_rate_date) {
						this.exchange_rate_date = resp.exchange_rate_date;
						const posting_backend = this.formatDateForBackend(this.posting_date_display);
						if (posting_backend !== this.exchange_rate_date) {
							this.toastStore.show({
								title: __(
									"Exchange rate date " +
										this.exchange_rate_date +
										" differs from posting date " +
										posting_backend,
								),
								color: "warning",
							});
						}
					}
					this.sync_exchange_rate();
				} catch (error) {
					console.error("Error updating exchange rate:", error);
					this.toastStore.show({
						title: "Error updating exchange rate",
						color: "error",
					});
				}
			}
		},

		sync_exchange_rate() {
			if (!this.exchange_rate || this.exchange_rate <= 0) {
				this.exchange_rate = 1;
			}
			if (!this.conversion_rate || this.conversion_rate <= 0) {
				this.conversion_rate = 1;
			}

			this.eventBus.emit("update_currency", {
				currency: this.selected_currency || this.pos_profile.currency,
				exchange_rate: this.exchange_rate,
				conversion_rate: this.conversion_rate,
			});

			this.update_item_rates();
			this.update_delivery_charges(this.conversion_rate, this.currency_precision);
		},

		handleRegisterPosProfile(data) {
			this.pos_profile = data.pos_profile;
			this.company = data.company || null;
			this.customer = data.pos_profile.customer;
			this.pos_opening_shift = data.pos_opening_shift;
			this.stock_settings = data.stock_settings;

			this.invoiceType = this.pos_profile.posa_default_sales_order ? "Order" : "Invoice";

			this.fetch_price_lists();
			this.update_price_list();
			this.fetch_available_currencies();
			this.refresh_parked_orders();
		},
		async refresh_parked_orders() {
			if (!this.pos_profile || !this.pos_opening_shift?.name) {
				this.uiStore.setParkedOrders([]);
				return;
			}

			try {
				const drafts = await fetchDraftInvoices({
					posOpeningShift: this.pos_opening_shift,
					posProfile: this.pos_profile,
				});
				this.uiStore.setParkedOrders(drafts);
			} catch (error) {
				console.error("Error refreshing parked orders:", error);
			}
		},
		handleClearInvoice() {
			this.clear_invoice();
			this.uiStore.triggerItemSearchFocus();
		},
		handleLoadInvoice(data) {
			this.load_invoice(data, { preserveStickies: true });
		},
		handleLoadOrder(data) {
			this.new_order(data);
		},
		handleLoadFlow(flow) {
			if (!flow?.prepared_doc) {
				return;
			}

			this.invoiceStore.setFlowContext?.(flow.flow_context || null);
			const action = flow?.action || flow?.flow_context?.prepared_action;
			const targetDoctype = flow?.flow_context?.target_doctype || flow?.prepared_doc?.doctype || "";

			if (targetDoctype === "Quotation" || action === "quote_edit_draft") {
				this.invoiceType = "Quotation";
				this.invoiceTypes = ["Invoice", "Order", "Quotation"];
			} else if (
				targetDoctype === "Sales Order" ||
				action === "order_load" ||
				action === "quote_to_order"
			) {
				this.invoiceType = "Order";
				this.invoiceTypes = ["Invoice", "Order", "Quotation"];
			} else {
				this.invoiceType = "Invoice";
				this.invoiceTypes = ["Invoice", "Order", "Quotation"];
			}

			this.load_invoice(flow.prepared_doc, { preserveStickies: true });
		},

		calcProratedReturnDiscount(returnDoc) {
			if (!returnDoc) return 0;

			const originalDiscount = Math.abs(Number(returnDoc.discount_amount || 0));
			if (!originalDiscount) return 0;

			const originalTotal = Math.abs(
				Number(returnDoc.total ?? returnDoc.net_total ?? returnDoc.grand_total ?? 0),
			);
			if (!originalTotal) return 0;

			const returnTotal = Math.abs(Number(this.Total || 0));
			if (!returnTotal) return 0;

			const ratio = Math.min(1, returnTotal / originalTotal);
			const prorated = originalDiscount * ratio;
			console.log("[POSA][Returns] Prorate discount", {
				originalDiscount,
				originalTotal,
				returnTotal,
				ratio,
				prorated,
			});
			return -Math.abs(prorated);
		},

		handleSetAllItems(data) {
			this.allItems = data;
			this.items.forEach((item) => {
				if (item._detailSynced !== true) {
					this.update_item_detail(item);
				}
			});
			this.primeInvoiceStockState();
		},
		handleLoadReturnInvoice(data) {
			this.load_invoice(data.invoice_doc);
			this.invoiceType = "Return";
			this.invoiceTypes = ["Return"];
			this.invoice_doc.is_return = 1;
			// Cap on cash refundable for this return = amount actually paid on the
			// original invoice. 0 for an unpaid/credit invoice, so the payment screen
			// defaults to no cash refund and the return becomes a credit note that
			// reduces the customer's balance. Derived here so it covers every entry
			// point that loads a return (returns dialog + invoice management).
			{
				const od = data.invoice_doc || {};
				const rd = data.return_doc || {};
				let refundable =
					od.posa_refundable_amount != null
						? od.posa_refundable_amount
						: rd.paid_amount != null
							? rd.paid_amount
							: (rd.grand_total || 0) - (rd.outstanding_amount || 0);
				refundable = this.flt(refundable, this.currency_precision);
				this.invoice_doc.posa_refundable_amount = refundable > 0 ? refundable : 0;
			}
			if (Array.isArray(this.invoice_doc.payments)) {
				this.invoice_doc.payments.forEach((payment) => {
					const amount = this.flt(payment.amount || 0, this.currency_precision);
					payment.amount = amount ? -Math.abs(amount) : 0;
					if (payment.base_amount !== undefined) {
						const baseAmount = this.flt(payment.base_amount || 0, this.currency_precision);
						payment.base_amount = baseAmount ? -Math.abs(baseAmount) : 0;
					}
				});
			}
			if (this.items && this.items.length) {
				this.items.forEach((item) => {
					if (item.qty > 0) item.qty = -Math.abs(item.qty);
					if (item.stock_qty > 0) item.stock_qty = -Math.abs(item.stock_qty);
				});
			}
			if (data.return_doc) {
				this.return_doc = data.return_doc;
				this.invoice_doc.return_against = data.return_doc.name;
				this.return_discount_base_amount = Math.abs(Number(data.return_doc.discount_amount || 0));
				this.return_discount_base_total = Math.abs(
					Number(
						data.return_doc.total ??
							data.return_doc.net_total ??
							data.return_doc.grand_total ??
							0,
					),
				);
				console.log("[POSA][Returns] Loaded return doc", {
					return_against: data.return_doc.name,
					is_percentage: !!this.pos_profile?.posa_use_percentage_discount,
					discount_amount: data.return_doc.discount_amount,
					discount_percentage: data.return_doc.additional_discount_percentage,
					original_total:
						data.return_doc.total ?? data.return_doc.net_total ?? data.return_doc.grand_total,
					base_total: this.return_discount_base_total,
					base_discount: this.return_discount_base_amount,
				});

				if (this.pos_profile?.posa_use_percentage_discount) {
					if (data.return_doc.additional_discount_percentage !== undefined) {
						this.additional_discount_percentage = this.flt(
							data.return_doc.additional_discount_percentage || 0,
							this.float_precision,
						);
					}
					this.update_discount_umount();
				} else {
					const prorated = this.calcProratedReturnDiscount(data.return_doc);
					this.discount_amount = prorated;
					this.additional_discount = prorated;
					this.additional_discount_percentage = 0;
				}
			} else {
				this.discount_amount = 0;
				this.additional_discount = 0;
				this.additional_discount_percentage = 0;
			}
		},
		handleSetNewLine(data) {
			this.new_line = data;
		},
		handleShowPaymentRequest() {
			this.show_payment();
		},
		async resume_parked_order(draft) {
			try {
				const message = await this.load_draft_source_record(draft);
				if (message) {
					this.uiStore?.closeDrafts?.();
				}
			} catch (error) {
				console.error("Error loading parked order:", error);
				this.toastStore.show({
					title: __("Unable to load parked order"),
					color: "error",
				});
			}
		},
		handleOpenCustomerDisplayRequest() {
			if (this.eventBus && typeof this.eventBus.emit === "function") {
				this.eventBus.emit("open_customer_display");
			}
		},
		promptPriceListRate(initialRate, item) {
			if (typeof this.price_list_rate_dialog_resolver === "function") {
				this.price_list_rate_dialog_resolver(null);
			}

			this.price_list_rate_dialog_initial_rate = initialRate == null ? "" : String(initialRate);
			this.price_list_rate_dialog_item_label = String(item?.item_name || item?.item_code || "");
			this.price_list_rate_dialog_open = true;

			return new Promise((resolve) => {
				this.price_list_rate_dialog_resolver = resolve;
			});
		},
		handlePriceListRateDialogCancel() {
			if (typeof this.price_list_rate_dialog_resolver === "function") {
				this.price_list_rate_dialog_resolver(null);
			}
			this.price_list_rate_dialog_open = false;
			this.price_list_rate_dialog_initial_rate = "";
			this.price_list_rate_dialog_item_label = "";
			this.price_list_rate_dialog_resolver = null;
		},
		handlePriceListRateDialogSubmit(value) {
			if (typeof this.price_list_rate_dialog_resolver === "function") {
				this.price_list_rate_dialog_resolver(value);
			}
			this.price_list_rate_dialog_open = false;
			this.price_list_rate_dialog_initial_rate = "";
			this.price_list_rate_dialog_item_label = "";
			this.price_list_rate_dialog_resolver = null;
		},
	},

	mounted() {
		this.setUpdateItemDetail(this.update_item_detail);
		this.loadColumnPreferences();
		this.loadInvoiceHeight();

		this.$watch(
			() => this.uiStore.posProfile,
			(profile) => {
				if (profile && profile.name) {
					this.handleRegisterPosProfile({
						pos_profile: profile,
						stock_settings: this.uiStore.stockSettings,
						company: this.uiStore.companyDoc,
						pos_opening_shift: this.uiStore.posOpeningShift,
					});
				}
			},
			{ deep: true, immediate: true },
		);

		this.$watch(
			() => this.uiStore.offers,
			(offers) => {
				if (offers) {
					this.handleSetOffers(offers);
				}
			},
			{ deep: true, immediate: true },
		);

		this.$watch(
			() => this.invoiceStore.invoiceToLoad,
			(doc) => {
				if (doc) {
					this.handleLoadInvoice(doc);
				}
			},
			{ deep: false },
		);

		this.$watch(
			() => this.invoiceStore.orderToLoad,
			(doc) => {
				if (doc) {
					this.handleLoadOrder(doc);
				}
			},
			{ deep: false },
		);

		this.$watch(
			() => this.invoiceStore.flowToLoad,
			(flow) => {
				if (flow?.prepared_doc) {
					this.handleLoadFlow(flow);
				} else if (flow) {
					this.handleLoadFlow({
						action: this.invoiceStore.flowContext?.prepared_action,
						prepared_doc: flow,
						flow_context: this.invoiceStore.flowContext,
					});
				}
			},
			{ deep: false },
		);

		this.$watch(
			() => this.uiStore.draggedItem,
			(item) => {
				this.showDropFeedback(!!item, this.itemsTableRef);
			},
		);

		this.$watch(
			() => this.invoiceStore.postingDate,
			(val) => {
				if (val) this.posting_date = val;
			},
			{ immediate: true },
		);

		this._busHandlers = {
			add_item: this.add_item,
			clear_invoice: this.handleClearInvoice,
			apply_pricing_rules: () => {
				if (typeof this.schedulePricingRuleApplication === "function") {
					this.schedulePricingRuleApplication();
				}
			},
			update_invoice_offers: this.handleUpdateInvoiceOffers,
			update_invoice_coupons: this.handleUpdateInvoiceCoupons,
			set_all_items: this.handleSetAllItems,
			load_return_invoice: this.handleLoadReturnInvoice,
			share_last_invoice: this.share_last_invoice,
			focus_cart_item_qty: this.focusCartItemQty,
			set_new_line: this.handleSetNewLine,
			calc_uom: this.calc_uom,
			recalculate_return_discount: (payload) => this.applyReturnDiscountProration(payload),
			reset_invoice_type_to_invoice: () => {
				this.invoiceType = "Invoice";
				this.invoiceTypes = ["Invoice", "Order", "Quotation"];
			},
		};

		Object.entries(this._busHandlers).forEach(([eventName, handler]) => {
			this.eventBus.on(eventName, handler);
		});

		this.stockUnsubscribe = stockCoordinator.subscribe(this.handleStockCoordinatorUpdate);

		this.emitCartQuantities();
		this.$nextTick(() => {
			this.primeInvoiceStockState();
		});
	},
	beforeUnmount() {
		if (typeof this.price_list_rate_dialog_resolver === "function") {
			this.price_list_rate_dialog_resolver(null);
			this.price_list_rate_dialog_resolver = null;
		}

		if (typeof this.stockUnsubscribe === "function") {
			this.stockUnsubscribe();
			this.stockUnsubscribe = null;
		}

		Object.entries(this._busHandlers || {}).forEach(([eventName, handler]) => {
			this.eventBus.off(eventName, handler);
		});
		this._busHandlers = {};
		if (typeof this.cancelScheduledOfferRefresh === "function") {
			this.cancelScheduledOfferRefresh();
		}
		if (this._suppressClosePaymentsTimer) {
			clearTimeout(this._suppressClosePaymentsTimer);
			this._suppressClosePaymentsTimer = null;
		}
	},
	created() {
		this.invoiceStore.clear();
		this.$watch(
			() => this.selectedCustomer,
			(newCustomer) => {
				if (newCustomer) {
					if (this.customer !== newCustomer) {
						this.customer = newCustomer;
					}
				} else if (this.customer) {
					this.customer = "";
				}
			},
			{ immediate: true },
		);
		this.$watch(
			() => this.customerRefreshToken,
			() => {
				if (this.customer) {
					this.fetch_customer_details();
				}
			},
		);
		this._shortcutHandlers = this._shortcutHandlers || {};

		this._shortcutHandlers.handleInvoiceShortcut = createInvoiceShortcutListeners(
			this.handleInvoiceShortcut.bind(this),
		);
		registerInvoiceShortcutListener(document, this._shortcutHandlers.handleInvoiceShortcut);
	},
	unmounted() {
		if (!this._shortcutHandlers) {
			return;
		}

		unregisterInvoiceShortcutListener(document, this._shortcutHandlers.handleInvoiceShortcut);

		this._shortcutHandlers = {};
	},
	watch: {
		...invoiceWatchers,
		confirm_payment_dialog(val) {
			if (val) {
				this.$nextTick(() => {
					setTimeout(() => {
						this.$refs.paymentConfirmationDialog?.focus?.();
					}, 100);
				});
			}
		},
	},
};
</script>

<style scoped>
/* Card background adjustments */
.cards {
	background-color: transparent !important;
}

.invoice-shell {
	display: flex;
	flex-direction: column;
	flex: 1 1 auto;
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
}

@media (max-width: 1199px) {
	.invoice-shell {
		padding-bottom: 0;
	}
}

.invoice-main-card {
	display: flex;
	flex-direction: column;
	flex: 1 1 auto;
	height: 100%;
	min-height: 0;
	min-width: 0;
	margin-top: 0 !important;
	overflow: hidden !important;
	border: 0 !important;
	border-radius: 0 !important;
	background: transparent !important;
	box-shadow: none !important;
}

/* Style for selected checkbox button */
.v-checkbox-btn.v-selected {
	background-color: var(--submit-start) !important;
	color: white;
}

/* Bottom border for elements */
.border_line_bottom {
	border-bottom: 1px solid var(--field-border);
}

/* Disable pointer events for elements */
.disable-events {
	pointer-events: none;
}

/* Style for customer balance field */
:deep(.balance-field) {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	flex-wrap: nowrap;
}

/* Style for balance value text */
:deep(.balance-value) {
	font-size: 1.5rem;
	font-weight: bold;
	color: var(--primary-start);
	margin-left: var(--dynamic-xs);
}

/* Red border and label for return mode card */

/* Red border and label for return mode card */

.return-mode {
	border: 2px solid rgb(var(--v-theme-error)) !important;
	position: relative;
}

/* Label for return mode card */
.return-mode::before {
	content: "RETURN";
	position: absolute;
	top: 0;
	right: 0;
	background-color: rgb(var(--v-theme-error));
	color: white;
	padding: 4px 12px;
	font-weight: bold;
	border-bottom-left-radius: 8px;
	z-index: 1;
}

/* Dynamic padding for responsive layout */
.dynamic-padding {
	padding: 0;
	display: grid;
	grid-template-rows: minmax(56px, auto) minmax(96px, auto) minmax(0, 1fr) auto;
	gap: var(--pos-section-gap, 8px);
	flex: 1 1 auto;
	height: 100%;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
}

.invoice-workspace {
	display: grid;
	grid-template-rows: minmax(56px, auto) minmax(96px, auto) minmax(0, 1fr) auto;
	height: 100%;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
}

.invoice-region {
	position: relative;
	min-width: 0;
	min-height: 0;
	box-sizing: border-box;
}

.invoice-customer-region,
.invoice-command-region {
	min-width: 0;
	overflow: visible;
}

.invoice-customer-region {
	display: flex;
	align-items: center;
	width: 100%;
	min-height: 54px;
	padding: 4px 10px;
	border-block-end: 1px solid var(--pos-border-light);
	background: var(--pos-surface);
}

.invoice-footer-region {
	overflow: hidden;
}

.invoice-command-region {
	display: grid;
	grid-template-rows: auto;
	align-content: start;
	gap: var(--pos-control-gap, 6px);
	min-height: 96px;
	padding: 8px 10px;
	border-block-end: 1px solid var(--pos-border-light);
	background: var(--pos-surface);
}

.invoice-cart-items-region {
	display: flex;
	flex-direction: column;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
	overflow-x: hidden;
}

.invoice-footer-region {
	flex: 0 0 auto;
	border-block-start: 1px solid var(--pos-border-light);
	padding-block-start: var(--pos-section-gap, 8px);
}

.invoice-status-alert {
	border-radius: var(--pos-radius-control, 8px);
	flex: 0 0 auto;
}

.invoice-sections {
	display: contents;
}

.invoice-top-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: var(--pos-section-gap, 8px);
	flex: 0 0 auto;
	width: 100%;
	min-width: 0;
}

.invoice-top-grid--with-delivery {
	grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
}

.invoice-meta-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: var(--pos-section-gap, 8px);
	flex: 0 0 auto;
}

.invoice-section-card {
	background: transparent !important;
	border: 0;
	border-radius: 0;
	box-shadow: none;
	overflow: visible;
	flex: 0 0 auto;
	min-height: 0;
	min-width: 0;
}

.invoice-section-heading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--pos-control-gap, 6px);
	min-width: 0;
	min-height: 26px;
	padding: 0;
}

.invoice-section-heading__title {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	margin: 0;
	font-size: var(--pos-font-section-title, 15px);
	font-weight: 760;
	line-height: 1.25;
	color: var(--pos-text-primary);
}

.invoice-section-heading__title span {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.invoice-section-heading__icon {
	color: var(--pos-text-muted);
}

.invoice-section-heading__count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 26px;
	padding: 0 8px;
	border: 1px solid color-mix(in srgb, var(--pos-primary) 18%, var(--pos-border-light));
	border-radius: 999px;
	background: color-mix(in srgb, var(--pos-primary-container) 58%, var(--pos-surface-raised));
	color: var(--pos-primary);
	font-size: var(--pos-font-meta, 11px);
	font-weight: 750;
	line-height: 1;
	white-space: nowrap;
}

.invoice-customer-region .invoice-section-card {
	min-height: var(--pos-control-height, 44px);
}

.invoice-customer-card {
	display: flex;
	align-items: center;
	padding: 0;
	width: 100%;
	min-width: 0;
}

.invoice-customer-card :deep(.invoice-customer-section) {
	width: 100%;
	padding: 0;
}

.invoice-command-region .invoice-section-card {
	background: transparent !important;
}

.invoice-command-region .invoice-meta-grid .invoice-section-card {
	border-radius: 0;
}

.invoice-items-card,
.invoice-items-command-card {
	display: flex;
	flex-direction: column;
	flex: 0 0 auto;
	min-height: 0;
	overflow: visible;
}

.invoice-items-command-card {
	padding-block-end: 0;
	gap: var(--pos-control-gap, 6px);
}

.invoice-footer-region :deep(.sticky-summary-card) {
	position: relative !important;
	inset-block-end: auto !important;
	bottom: auto !important;
	margin: 0 !important;
	border: 0 !important;
	border-radius: 0 !important;
	background: transparent !important;
	box-shadow: none !important;
}

.invoice-footer-region :deep(.sticky-summary-card--dock-safe) {
	margin-block-end: 0 !important;
}

.delivery-charges-card {
	min-width: 0;
}

.delivery-charges-card :deep(.items) {
	display: grid !important;
	grid-template-columns: minmax(0, 1fr) minmax(88px, 110px);
	align-items: center !important;
	gap: var(--pos-control-gap, 6px);
	width: 100%;
	min-width: 0;
	margin: 0 !important;
	padding: 0 !important;
}

.delivery-charges-card :deep(.v-col) {
	flex: 0 1 auto !important;
	width: auto !important;
	max-width: none !important;
	min-width: 0;
	padding: 0 !important;
	margin: 0 !important;
}

.delivery-charges-card :deep(.v-field) {
	min-height: var(--pos-control-height, 44px) !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	box-shadow: none !important;
}

.delivery-charges-card :deep(.v-field__overlay) {
	display: none !important;
}

.delivery-charges-card :deep(.v-field__outline) {
	--v-field-border-opacity: 0 !important;
	color: transparent !important;
}

.delivery-charges-card :deep(.v-field__input),
.delivery-charges-card :deep(input) {
	min-height: var(--pos-control-height, 44px) !important;
	padding-block: 0 !important;
	font-size: var(--pos-font-control, 13px);
	font-weight: 650;
}

.delivery-charges-card :deep(.v-label) {
	font-size: var(--pos-font-meta, 11px);
	font-weight: 700;
}

@media (max-width: 1279px) {
	.invoice-customer-region,
	.invoice-command-region {
		padding-inline: 8px;
	}

	.invoice-section-heading__title {
		font-size: 14px;
	}
}

@media (max-width: 1024px) {
	.invoice-top-grid--with-delivery {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 767px) {
	.invoice-workspace,
	.dynamic-padding {
		grid-template-rows: minmax(54px, auto) minmax(88px, auto) minmax(0, 1fr) auto;
		gap: 6px;
	}

	.invoice-customer-region {
		min-height: 52px;
		padding: 4px 8px;
	}

	.invoice-command-region {
		min-height: 88px;
		padding: 6px 8px;
		gap: 5px;
	}

	.invoice-section-heading {
		min-height: 24px;
	}

	.invoice-section-heading__title {
		font-size: 14px;
	}

	.invoice-section-heading__count {
		min-height: 22px;
		padding-inline: 7px;
		font-size: 10.5px;
	}

	.delivery-charges-card :deep(.items) {
		grid-template-columns: 1fr;
	}
}

/* Responsive breakpoints */
@media (max-width: 768px) {
	.invoice-shell {
		gap: var(--dynamic-xs);
	}

	.invoice-main-card {
		height: 100% !important;
		max-height: 100% !important;
		resize: none !important;
		overflow: hidden !important;
	}

	.dynamic-padding {
		padding: 0;
		overflow: hidden;
	}

	.dynamic-padding .v-row {
		margin: 0 -2px;
	}

	.dynamic-padding .v-col {
		padding: 2px 4px;
	}

	.invoice-meta-grid {
		grid-template-columns: 1fr;
	}

	.invoice-top-grid {
		grid-template-columns: 1fr;
	}

	.invoice-top-grid--with-delivery {
		grid-template-columns: 1fr;
	}

	.invoice-sections {
		overflow: hidden;
	}

	.invoice-items-card {
		min-height: 0;
	}

	.items-table-wrapper {
		margin-left: 0;
		margin-right: 0;
		width: 100%;
		max-width: 100%;
		min-height: 0;
	}

	.item-search-field {
		max-width: 100%;
	}
}

@media (max-width: 480px) {
	.invoice-main-card {
		margin-top: var(--dynamic-xs) !important;
	}

	.dynamic-padding {
		padding: 0;
	}

	.dynamic-padding .v-row {
		margin: 0 -1px;
	}

	.dynamic-padding .v-col {
		padding: 1px 2px;
	}

	.invoice-meta-grid {
		grid-template-columns: 1fr;
	}

	.invoice-top-grid {
		grid-template-columns: 1fr;
	}

	.invoice-top-grid--with-delivery {
		grid-template-columns: 1fr;
	}

	.items-table-wrapper {
		margin-left: 0;
		margin-right: 0;
		width: 100%;
		max-width: 100%;
		min-height: 0;
	}

	.item-search-field {
		flex-basis: 100%;
		max-width: 100%;
		margin-right: 0;
	}
}

.column-selector-container {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	flex-wrap: wrap;
	gap: var(--pos-control-gap, 6px);
	padding: 0;
	background-color: transparent;
	border-radius: 0;
	box-sizing: border-box;
	margin-bottom: var(--pos-section-gap, 8px);
}

.item-search-field {
	width: 100%;
	max-width: 320px;
	flex: 1 1 240px;
	margin-right: auto;
}

.column-selector-btn {
	font-size: 0.875rem;
}

.items-table-wrapper {
	position: relative;
	margin-top: 0;
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	flex: 1 1 auto;
	height: 100%;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
	overflow-x: hidden;
}

:deep(.items-table-wrapper .column-selector-container) {
	position: sticky;
	top: 0;
	z-index: 3;
	background: transparent;
}

:deep(.items-table-wrapper .posa-items-table-container) {
	flex: 1 1 auto;
	width: 100%;
	max-width: 100%;
	min-width: 0;
	min-height: 0;
	height: 100% !important;
	max-height: 100% !important;
	overflow: hidden !important;
	overflow-x: hidden !important;
}

:deep(.items-table-wrapper .posa-cart-table),
:deep(.items-table-wrapper .v-data-table__wrapper),
:deep(.items-table-wrapper .v-table__wrapper) {
	width: 100% !important;
	max-width: 100% !important;
	min-width: 0 !important;
	height: 100% !important;
	max-height: 100% !important;
	min-height: 0;
	overflow-x: hidden !important;
}

:deep(.items-table-wrapper .v-data-table__wrapper),
:deep(.items-table-wrapper .v-table__wrapper) {
	overflow-y: auto !important;
	overflow-x: hidden !important;
	scrollbar-gutter: stable;
}

/* New styles for improved column switches */
:deep(.column-switch) {
	margin: 0;
	padding: 0;
}

:deep(.column-switch .v-switch__track) {
	opacity: 0.7;
}

:deep(.column-switch .v-switch__thumb) {
	transform: scale(0.8);
}

:deep(.column-switch .v-label) {
	opacity: 0.9;
	font-size: 0.95rem;
}
</style>
