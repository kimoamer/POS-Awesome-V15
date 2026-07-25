# First POS Screen Registry

This registry freezes everything tied to the first POS screen before UI redesign work continues.
The goal is to replace visual structure safely while preserving backend, API, store, event, and action contracts.

## Source Of Truth

- First route: `/pos`
- Route file: `frontend/src/posapp/router/index.ts`
- Route component: `frontend/src/posapp/components/pos/shell/Pos.vue`
- Normal layout: `frontend/src/posapp/layouts/DefaultLayout.vue`
- App shell: `frontend/src/posapp/components/Navbar.vue`
- App entry/global styles: `frontend/src/posapp/posapp.ts`
- Foundation registry: `BASE_PAGE_FOUNDATION_REGISTRY.md`
- Remaining screens registry: `REMAINING_SCREENS_REGISTRY.md`

## Scope Counts

- Visible or mounted Vue files from first screen shell plus `Pos.vue`: 80
- Matching `*.vue.css` sibling files: 80
- Direct first-screen CSS imports: 2
- Global POS theme CSS: 1
- POS app behavior/logic files reached by first-screen crawl: 163
- Offline behavior files reached by first-screen crawl: 15
- Shared non-posapp behavior files reached by first-screen crawl: 6

## Hard Rules

- UI files can be redesigned.
- Behavior files are contract files unless a UI-safe adapter is explicitly needed.
- Do not rename props, emits, event bus names, route paths, store calls, service calls, or API methods.
- Do not change invoice, payment, stock, offline, sync, print, customer display, shift, or cashier behavior while redesigning.

## Boot And Route Chain

- `frontend/src/posapp/posapp.ts`
- `frontend/src/posapp/App.vue`
- `frontend/src/posapp/router/index.ts`
- `frontend/src/posapp/layouts/DefaultLayout.vue`
- `frontend/src/posapp/components/Navbar.vue`
- `frontend/src/posapp/components/pos/shell/Pos.vue`

## UI Components In Scope

### Shell And Navbar

- `frontend/src/posapp/layouts/DefaultLayout.vue`
- `frontend/src/posapp/components/Navbar.vue`
- `frontend/src/posapp/components/OfflineInvoices.vue`
- `frontend/src/posapp/components/navbar/NavbarAppBar.vue`
- `frontend/src/posapp/components/navbar/NavbarDrawer.vue`
- `frontend/src/posapp/components/navbar/NavbarMenu.vue`
- `frontend/src/posapp/components/navbar/NavbarSettingsPanel.vue`
- `frontend/src/posapp/components/navbar/NavbarCashierPinForm.vue`
- `frontend/src/posapp/components/navbar/NavbarInfoGadgets.vue`
- `frontend/src/posapp/components/navbar/StatusIndicator.vue`
- `frontend/src/posapp/components/navbar/OfflineStatusPanel.vue`
- `frontend/src/posapp/components/navbar/NotificationBell.vue`
- `frontend/src/posapp/components/navbar/CacheUsageMeter.vue`
- `frontend/src/posapp/components/navbar/ServerUsageGadget.vue`
- `frontend/src/posapp/components/navbar/DatabaseUsageGadget.vue`
- `frontend/src/posapp/components/navbar/QzTrayDialog.vue`
- `frontend/src/posapp/components/navbar/AboutDialog.vue`
- `frontend/src/posapp/components/ui/LoadingOverlay.vue`
- `frontend/src/posapp/components/ui/UpdatePrompt.vue`

### POS Main Surface

- `frontend/src/posapp/components/pos/shell/Pos.vue`
- `frontend/src/posapp/components/pos/Invoice.vue`
- `frontend/src/posapp/components/pos/Payments.vue`

### Item Selector

- `frontend/src/posapp/components/pos/items/ItemsSelector.vue`
- `frontend/src/posapp/components/pos/items/ItemHeader.vue`
- `frontend/src/posapp/components/pos/items/ItemActionToolbar.vue`
- `frontend/src/posapp/components/pos/items/ItemsSelectorCards.vue`
- `frontend/src/posapp/components/pos/items/ItemsSelectorTable.vue`
- `frontend/src/posapp/components/pos/items/ItemCard.vue`
- `frontend/src/posapp/components/pos/items/ItemRateInfoMenu.vue`
- `frontend/src/posapp/components/pos/items/ItemSettingsDialog.vue`
- `frontend/src/posapp/components/pos/items/CameraScanner.vue`
- `frontend/src/posapp/components/pos/items/NewItemDialog.vue`
- `frontend/src/posapp/components/pos/items/ScanErrorDialog.vue`
- `frontend/src/posapp/components/pos/items/Variants.vue`
- `frontend/src/posapp/components/ui/Skeleton.vue`

### Invoice And Cart

- `frontend/src/posapp/components/pos/invoice/InvoiceCustomerSection.vue`
- `frontend/src/posapp/components/pos/customer/Customer.vue`
- `frontend/src/posapp/components/pos/dialogs/customer/UpdateCustomer.vue`
- `frontend/src/posapp/components/pos/customer/NewAddress.vue`
- `frontend/src/posapp/components/pos/invoice/DeliveryCharges.vue`
- `frontend/src/posapp/components/pos/invoice/PostingDateRow.vue`
- `frontend/src/posapp/components/pos/invoice/MultiCurrencyRow.vue`
- `frontend/src/posapp/components/pos/invoice/InvoiceItemsActionToolbar.vue`
- `frontend/src/posapp/components/pos/invoice/ItemsTable.vue`
- `frontend/src/posapp/components/pos/invoice/ItemsTableExpandedRow.vue`
- `frontend/src/posapp/components/pos/invoice/CartItemRow.vue`
- `frontend/src/posapp/components/pos/invoice/InvoiceSummary.vue`
- `frontend/src/posapp/components/pos/invoice/InvoiceActionButtons.vue`
- `frontend/src/posapp/components/pos/invoice/CancelSaleDialog.vue`
- `frontend/src/posapp/components/pos/invoice/PackedItemsDialog.vue`
- `frontend/src/posapp/components/pos/invoice/ParkedOrdersList.vue`
- `frontend/src/posapp/components/pos/invoice/PriceListRateDialog.vue`
- `frontend/src/posapp/components/pos/shared/DocumentSourceSelector.vue`

### Payment Surface

- `frontend/src/posapp/components/pos/payments/PaymentSummary.vue`
- `frontend/src/posapp/components/pos/payments/InvoiceTotals.vue`
- `frontend/src/posapp/components/pos/payments/PaymentMethods.vue`
- `frontend/src/posapp/components/pos/payments/PaymentOptions.vue`
- `frontend/src/posapp/components/pos/payments/PaymentSelectionFields.vue`
- `frontend/src/posapp/components/pos/payments/PaymentActionButtons.vue`
- `frontend/src/posapp/components/pos/payments/PaymentAdditionalInfo.vue`
- `frontend/src/posapp/components/pos/payments/PaymentCustomerCreditDetails.vue`
- `frontend/src/posapp/components/pos/payments/PaymentGiftCardSection.vue`
- `frontend/src/posapp/components/pos/payments/PaymentRedemption.vue`
- `frontend/src/posapp/components/pos/payments/PaymentPurchaseOrder.vue`
- `frontend/src/posapp/components/pos/payments/Mpesa-Payments.vue`
- `frontend/src/posapp/components/pos/payments/PaymentDialogs.vue`
- `frontend/src/posapp/components/pos/payments/PaymentConfirmationDialog.vue`
- `frontend/src/posapp/components/pos/wallet/GiftCardDialog.vue`

### POS Flows Mounted From First Screen

- `frontend/src/posapp/components/pos/offers/PosOffers.vue`
- `frontend/src/posapp/components/pos/offers/PosCoupons.vue`
- `frontend/src/posapp/components/pos/flows/Drafts.vue`
- `frontend/src/posapp/components/pos/flows/SalesOrders.vue`
- `frontend/src/posapp/components/pos/flows/Returns.vue`
- `frontend/src/posapp/components/pos/flows/InvoiceManagement.vue`
- `frontend/src/posapp/components/pos/shift/OpeningDialog.vue`

### Shift, Closing, And Employee Shell Mounts

- `frontend/src/posapp/components/pos/employee/EmployeeSwitchDialog.vue`
- `frontend/src/posapp/components/pos/shell/ClosingDialog.vue`
- `frontend/src/posapp/components/pos/closing/ClosingHeader.vue`
- `frontend/src/posapp/components/pos/closing/ShiftOverview.vue`
- `frontend/src/posapp/components/pos/closing/PaymentReconciliation.vue`

## CSS In Scope

- Every Vue file listed in this registry has a matching `*.vue.css` sibling and that sibling is in scope.
- `frontend/src/posapp/styles/theme.css`
- `frontend/src/posapp/styles/shimmer.css`
- `frontend/src/posapp/components/pos/invoice/items-table-styles.css`
- `frontend/src/style.css`
- `posawesome/public/css/rtl.css`

## Assets In Scope

- `frontend/src/posapp/components/pos/placeholder-image.png`
- `frontend/src/posapp/components/pos/pos.png`

## Event Contracts To Preserve

### Navbar Emits

- `nav-click`
- `change-page`
- `close-shift`
- `sync-invoices`
- `retry-status`
- `share-last-invoice`
- `open-customer-display`
- `toggle-offline`
- `refresh-offline-data`
- `rebuild-offline-data`
- `open-offline-diagnostics`
- `toggle-theme`
- `logout`
- `refresh-cache-usage`
- `update-after-delete`
- `navbar-updated`

### DefaultLayout Navbar Listeners

- `@nav-click`
- `@close-shift`
- `@print-last-invoice`
- `@share-last-invoice`
- `@sync-invoices`
- `@toggle-offline`
- `@retry-status`
- `@refresh-offline-data`
- `@rebuild-offline-data`
- `@open-offline-diagnostics`
- `@toggle-theme`
- `@logout`
- `@open-customer-display`
- `@refresh-cache-usage`
- `@update-after-delete`

### Main POS Event Bus

- `submit_closing_pos`
- `focus_additional_discount`
- `set_compact_panel`
- `add_item`
- `clear_invoice`
- `apply_pricing_rules`
- `update_invoice_offers`
- `update_invoice_coupons`
- `set_all_items`
- `load_return_invoice`
- `share_last_invoice`
- `focus_cart_item_qty`
- `set_new_line`
- `calc_uom`
- `recalculate_return_discount`
- `reset_invoice_type_to_invoice`
- `focus_item_search`
- `change_active_view`
- `payment_ui_ready`
- `invoice_submission_failed`
- `network-online`
- `server-online`
- `send_invoice_doc_payment`
- `register_pos_profile`
- `add_the_new_address`
- `set_pos_settings`
- `set_mpesa_payment`
- `queue_submit_payment_shortcut`
- `submit_payment_shortcut`
- `show_message`
- `update_currency`
- `open_customer_display`

### Core Component Emits

- `OpeningDialog.vue`: `close`, `register`
- `ItemsSelector.vue`: `add-item`, `add-items`
- `ItemHeader.vue`: `update:searchInput`, `update:qtyInput`, `esc`, `enter`, `search-keydown`, `clear-search`, `search-input`, `search-paste`, `focus`, `clear-qty`, `blur-qty`, `start-camera`, `open-new-item`, `toggle-settings`, `reload-items`
- `ItemActionToolbar.vue`: `update:modelValue`, `update:itemsView`, `open-offers`, `open-coupons`
- `ItemsSelectorCards.vue`: `select-item`, `dragstart`, `dragend`, `virtual-range-update`, `clear-search`
- `ItemsSelectorTable.vue`: `row-click`, `list-scroll`, `toggle-selection`, `select-all`
- `ItemCard.vue`: `click`, `dragstart`, `dragend`
- `ItemSettingsDialog.vue`: `update:modelValue`, `save`
- `CameraScanner.vue`: `barcode-scanned`, `scanner-opened`, `scanner-closed`
- `NewItemDialog.vue`: `update:modelValue`, `item-created`, `request-camera-scan`
- `ScanErrorDialog.vue`: `update:modelValue`, `acknowledge`
- `InvoiceItemsActionToolbar.vue`: `update:itemSearch`, `update:selectedColumns`
- `ItemsTable.vue`: `update:expanded`, `show-drop-feedback`, `item-dropped`
- `CartItemRow.vue`: `open-name-dialog`, `reset-item-name`, `add-one`, `update-qty`, `minus-click`, `calc-uom`, `update-rate`, `update-discount-percent`, `update-discount-amount`, `qty-edit-submitted`, `discount-percent-edit-submitted`, `toggle-offer`, `toggle-expand`
- `InvoiceSummary.vue`: `update:additional_discount`, `update:additional_discount_percentage`, `update_discount_umount`, `save-and-clear`, `load-drafts`, `select-order`, `cancel-sale`, `open-invoice-management`, `open-returns`, `print-draft`, `show-payment`, `open-customer-display`, `resume-parked-order`
- `InvoiceActionButtons.vue`: `save-and-clear`, `load-drafts`, `select-order`, `cancel-sale`, `open-invoice-management`, `open-returns`, `print-draft`, `show-payment`, `open-customer-display`
- `PaymentSummary.vue`: `show-paid-amount`, `show-diff-payment`, `show-paid-change`, `update-credit-change`
- `PaymentMethods.vue`: payment amount and method update emits must remain unchanged.
- `PaymentActionButtons.vue`: `submit`, `submit-and-print`, `cancel`
- `PaymentDialogs.vue`: all dialog `update:*` and confirmation emits must remain unchanged.

## POS App Behavior Contract Files

- `frontend/src/posapp/bus.ts`
- `frontend/src/posapp/components/pos/invoice/invoiceComputed.ts`
- `frontend/src/posapp/components/pos/invoice/invoiceItemMethods.ts`
- `frontend/src/posapp/components/pos/invoice/invoiceShortcuts.ts`
- `frontend/src/posapp/components/pos/invoice/invoiceWatchers.ts`
- `frontend/src/posapp/components/pos/invoice_utils/actions.ts`
- `frontend/src/posapp/components/pos/invoice_utils/cache.ts`
- `frontend/src/posapp/components/pos/invoice_utils/currency.ts`
- `frontend/src/posapp/components/pos/invoice_utils/customer.ts`
- `frontend/src/posapp/components/pos/invoice_utils/dialogs.ts`
- `frontend/src/posapp/components/pos/invoice_utils/discounts.ts`
- `frontend/src/posapp/components/pos/invoice_utils/document.ts`
- `frontend/src/posapp/components/pos/invoice_utils/free_items.ts`
- `frontend/src/posapp/components/pos/invoice_utils/item_updates.ts`
- `frontend/src/posapp/components/pos/invoice_utils/loader.ts`
- `frontend/src/posapp/components/pos/invoice_utils/pricing.ts`
- `frontend/src/posapp/components/pos/invoice_utils/pricing_rule_names.ts`
- `frontend/src/posapp/components/pos/invoice_utils/return_discount.ts`
- `frontend/src/posapp/components/pos/invoice_utils/server.ts`
- `frontend/src/posapp/components/pos/invoice_utils/stock.ts`
- `frontend/src/posapp/components/pos/invoice_utils/tasks.ts`
- `frontend/src/posapp/components/pos/invoice_utils/validation.ts`
- `frontend/src/posapp/components/pos/items/newItemDialogState.ts`
- `frontend/src/posapp/composables/core/useClientLoad.ts`
- `frontend/src/posapp/composables/core/useDatabaseStats.ts`
- `frontend/src/posapp/composables/core/useFlyAnimation.ts`
- `frontend/src/posapp/composables/core/useFormatters.ts`
- `frontend/src/posapp/composables/core/useLastInvoicePrinting.ts`
- `frontend/src/posapp/composables/core/useLoading.ts`
- `frontend/src/posapp/composables/core/useNetwork.ts`
- `frontend/src/posapp/composables/core/useOnlineStatus.ts`
- `frontend/src/posapp/composables/core/useResponsive.ts`
- `frontend/src/posapp/composables/core/useRtl.ts`
- `frontend/src/posapp/composables/core/useServerStats.ts`
- `frontend/src/posapp/composables/core/useTheme.ts`
- `frontend/src/posapp/composables/pos/closing/useClosingShift.ts`
- `frontend/src/posapp/composables/pos/closing/useClosingSummary.ts`
- `frontend/src/posapp/composables/pos/invoice/useInvoiceCurrency.ts`
- `frontend/src/posapp/composables/pos/invoice/useInvoiceDetails.ts`
- `frontend/src/posapp/composables/pos/invoice/useInvoiceItems.ts`
- `frontend/src/posapp/composables/pos/invoice/useInvoiceOffers.ts`
- `frontend/src/posapp/composables/pos/invoice/useInvoicePrinting.ts`
- `frontend/src/posapp/composables/pos/invoice/useInvoiceStock.ts`
- `frontend/src/posapp/composables/pos/invoice/useInvoiceUI.ts`
- `frontend/src/posapp/composables/pos/items/addition/serialSelection.ts`
- `frontend/src/posapp/composables/pos/items/addition/useItemBatchSerial.ts`
- `frontend/src/posapp/composables/pos/items/addition/useItemBundles.ts`
- `frontend/src/posapp/composables/pos/items/addition/useItemCreation.ts`
- `frontend/src/posapp/composables/pos/items/addition/useItemMerging.ts`
- `frontend/src/posapp/composables/pos/items/addition/useItemTasks.ts`
- `frontend/src/posapp/composables/pos/items/availability/stockAdjustmentPayload.ts`
- `frontend/src/posapp/composables/pos/items/detailFetcher/requestIdentity.ts`
- `frontend/src/posapp/composables/pos/items/scanProcessor/scanAssignment.ts`
- `frontend/src/posapp/composables/pos/items/scannerInput/clipboardScan.ts`
- `frontend/src/posapp/composables/pos/items/selectorSearch/resolveBooleanSetting.ts`
- `frontend/src/posapp/composables/pos/items/useBarcodeIndexing.ts`
- `frontend/src/posapp/composables/pos/items/useBundles.ts`
- `frontend/src/posapp/composables/pos/items/useCartValidation.ts`
- `frontend/src/posapp/composables/pos/items/useItemAddition.ts`
- `frontend/src/posapp/composables/pos/items/useItemAvailability.ts`
- `frontend/src/posapp/composables/pos/items/useItemCurrency.ts`
- `frontend/src/posapp/composables/pos/items/useItemDetailFetcher.ts`
- `frontend/src/posapp/composables/pos/items/useItemDisplay.ts`
- `frontend/src/posapp/composables/pos/items/useItemRateInfo.ts`
- `frontend/src/posapp/composables/pos/items/useItemSearch.ts`
- `frontend/src/posapp/composables/pos/items/useItemSelection.ts`
- `frontend/src/posapp/composables/pos/items/useItemSelectorLayout.ts`
- `frontend/src/posapp/composables/pos/items/useItemStorageSafety.ts`
- `frontend/src/posapp/composables/pos/items/useItemSync.ts`
- `frontend/src/posapp/composables/pos/items/useItemsIntegration.ts`
- `frontend/src/posapp/composables/pos/items/useItemsLoader.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorDisplayBindings.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorEvents.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorFocus.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorInitialization.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorLayoutLifecycle.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorPanelSizing.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorPriceListSync.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorQuantity.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorScannerBridge.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorSearch.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorSearchInput.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorSettings.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorTypeToSearch.ts`
- `frontend/src/posapp/composables/pos/items/useItemsTableDragDrop.ts`
- `frontend/src/posapp/composables/pos/items/useItemsTableMerge.ts`
- `frontend/src/posapp/composables/pos/items/useItemsTableNameEdit.ts`
- `frontend/src/posapp/composables/pos/items/useItemsTableResponsive.ts`
- `frontend/src/posapp/composables/pos/items/useItemsTableSearch.ts`
- `frontend/src/posapp/composables/pos/items/useLastBuyingRate.ts`
- `frontend/src/posapp/composables/pos/items/useLastInvoiceRate.ts`
- `frontend/src/posapp/composables/pos/items/useScanProcessor.ts`
- `frontend/src/posapp/composables/pos/items/useScannerInput.ts`
- `frontend/src/posapp/composables/pos/payments/usePaymentCalculations.ts`
- `frontend/src/posapp/composables/pos/payments/usePaymentMethods.ts`
- `frontend/src/posapp/composables/pos/payments/usePaymentPrinting.ts`
- `frontend/src/posapp/composables/pos/payments/usePaymentSubmission.ts`
- `frontend/src/posapp/composables/pos/payments/useRedemptionLogic.ts`
- `frontend/src/posapp/composables/pos/shared/useBatchSerial.ts`
- `frontend/src/posapp/composables/pos/shared/useCustomerDisplayPublisher.ts`
- `frontend/src/posapp/composables/pos/shared/useDiscounts.ts`
- `frontend/src/posapp/composables/pos/shared/useOffers.ts`
- `frontend/src/posapp/composables/pos/shared/usePosShift.ts`
- `frontend/src/posapp/composables/pos/shared/useStockUtils.ts`
- `frontend/src/posapp/composables/runtime/useBootSync.ts`
- `frontend/src/posapp/composables/runtime/useCustomerReadiness.ts`
- `frontend/src/posapp/composables/runtime/useNetworkLifecycle.ts`
- `frontend/src/posapp/composables/runtime/useQueueMetrics.ts`
- `frontend/src/posapp/composables/runtime/useUpdateChecks.ts`
- `frontend/src/posapp/config/loading.ts`
- `frontend/src/posapp/format.ts`
- `frontend/src/posapp/modules/customers/customerLoadingCoordinator.ts`
- `frontend/src/posapp/modules/items/itemLoadingCoordinator.ts`
- `frontend/src/posapp/plugins/print.ts`
- `frontend/src/posapp/services/api.ts`
- `frontend/src/posapp/services/authService.ts`
- `frontend/src/posapp/services/documentPrint.ts`
- `frontend/src/posapp/services/invoiceService.ts`
- `frontend/src/posapp/services/itemService.ts`
- `frontend/src/posapp/services/qzTray.ts`
- `frontend/src/posapp/services/rawDocumentPrint.ts`
- `frontend/src/posapp/stores/customers/customerSearch.ts`
- `frontend/src/posapp/stores/customersStore.ts`
- `frontend/src/posapp/stores/employeeStore.ts`
- `frontend/src/posapp/stores/invoiceStore.ts`
- `frontend/src/posapp/stores/offlineSyncStore.ts`
- `frontend/src/posapp/stores/pricingRulesStore.ts`
- `frontend/src/posapp/stores/socketStore.ts`
- `frontend/src/posapp/stores/syncStore.ts`
- `frontend/src/posapp/stores/toastStore.ts`
- `frontend/src/posapp/stores/uiStore.ts`
- `frontend/src/posapp/stores/updateStore.ts`
- `frontend/src/posapp/types/models.ts`
- `frontend/src/posapp/utils/bootstrapRuntimeEvents.ts`
- `frontend/src/posapp/utils/bootstrapWarningVisibility.ts`
- `frontend/src/posapp/utils/bootstrapWarnings.ts`
- `frontend/src/posapp/utils/cartFieldFocus.ts`
- `frontend/src/posapp/utils/cashTender.ts`
- `frontend/src/posapp/utils/currencyConversion.ts`
- `frontend/src/posapp/utils/customerDisplay.ts`
- `frontend/src/posapp/utils/documentSources.ts`
- `frontend/src/posapp/utils/draftInvoices.ts`
- `frontend/src/posapp/utils/erpnextCurrency.ts`
- `frontend/src/posapp/utils/invoiceSharing.ts`
- `frontend/src/posapp/utils/invoiceShortcutListener.ts`
- `frontend/src/posapp/utils/itemSearchFocusClearGuard.ts`
- `frontend/src/posapp/utils/itemSelectionDialog.ts`
- `frontend/src/posapp/utils/itemSelectorHighlightBindings.ts`
- `frontend/src/posapp/utils/itemSelectorSettings.ts`
- `frontend/src/posapp/utils/keyboardNavigation.ts`
- `frontend/src/posapp/utils/opencvProcessor.ts`
- `frontend/src/posapp/utils/opencvWorkerManager.ts`
- `frontend/src/posapp/utils/openingCache.ts`
- `frontend/src/posapp/utils/paymentInitialization.ts`
- `frontend/src/posapp/utils/paymentPrintDoctype.ts`
- `frontend/src/posapp/utils/paymentPrintFormat.ts`
- `frontend/src/posapp/utils/perf.ts`
- `frontend/src/posapp/utils/posDocumentMode.ts`
- `frontend/src/posapp/utils/realtimeStock.ts`
- `frontend/src/posapp/utils/stock.ts`
- `frontend/src/posapp/utils/stockCoordinator.ts`

## Offline And Shared Behavior Contract Files

- `frontend/src/offline/bootstrapSnapshot.ts`
- `frontend/src/offline/cache.ts`
- `frontend/src/offline/db.ts`
- `frontend/src/offline/idempotency.ts`
- `frontend/src/offline/index.ts`
- `frontend/src/offline/invoiceOutbox.ts`
- `frontend/src/offline/sync/SyncCoordinator.ts`
- `frontend/src/offline/sync/adapters/common.ts`
- `frontend/src/offline/sync/adapters/index.ts`
- `frontend/src/offline/sync/resourceRegistry.ts`
- `frontend/src/offline/sync/resourceRunner.ts`
- `frontend/src/offline/sync/runtime.ts`
- `frontend/src/offline/sync/syncState.ts`
- `frontend/src/offline/sync/types.ts`
- `frontend/src/offline/sync/useSyncCoordinator.ts`
- `frontend/src/lib/pricingEngine.ts`
- `frontend/src/offline.ts`
- `frontend/src/offline_print_template.ts`
- `frontend/src/utils/clearAllCaches.ts`
- `frontend/src/utils/pos_profile.ts`
- `frontend/src/utils/smartTender.ts`

## Separate Routes Not Part Of First Screen Redesign

These are not first-screen UI unless the user opens their route or a flow explicitly asks for them:

- `frontend/src/posapp/components/pos/shell/PayView.vue`
- `frontend/src/posapp/components/pos/shell/BarcodePrinting.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseOrders.vue`
- `frontend/src/posapp/components/pos/cash/CashMovementView.vue`
- `frontend/src/posapp/components/reports/Reports.vue`
- `frontend/src/posapp/components/customer_display/CustomerDisplay.vue`
- `frontend/src/posapp/components/pos/wallet/GiftCardsView.vue`
- `frontend/src/posapp/components/system/OfflineRouteUnavailable.vue`

## Redesign Entry Order For First Screen

1. Shell density and layout guard: `DefaultLayout.vue`, `Navbar.vue`, `NavbarAppBar.vue`, `NavbarDrawer.vue`
2. POS workspace grid: `Pos.vue`, `Invoice.vue`
3. Item selector: `ItemHeader.vue`, `ItemActionToolbar.vue`, `ItemsSelectorCards.vue`, `ItemCard.vue`, `ItemsSelectorTable.vue`, `ItemsSelector.vue`
4. Cart and invoice panel: `InvoiceItemsActionToolbar.vue`, `ItemsTable.vue`, `CartItemRow.vue`, `InvoiceSummary.vue`, `InvoiceActionButtons.vue`
5. Payment surface: `Payments.vue` and `components/pos/payments/**`
6. Attached dialogs and flows: drafts, returns, sales orders, invoice management, offers, coupons, opening shift, customer dialogs
