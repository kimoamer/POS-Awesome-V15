# Remaining Screens Registry

This registry covers every routed screen outside the first `/pos` selling screen.
It should be read together with:

- `BASE_PAGE_FOUNDATION_REGISTRY.md`
- `FIRST_POS_SCREEN_REGISTRY.md`
- `UI_REDESIGN_MAP.md`

## Route Inventory

Routes from `frontend/src/posapp/router/index.ts`:

- `/` redirects to `/pos`
- `/pos` is covered by `FIRST_POS_SCREEN_REGISTRY.md`
- `/orders`
- `/payments`
- `/gift-cards`
- `/dashboard`
- `/reports`
- `/barcode`
- `/cash-movement`
- `/closing`
- `/customer-display`
- `/offline-route-unavailable`
- `/:pathMatch(.*)*` redirects to `/pos`

## Shared Rule

Every default-layout route also uses the foundation shell:

- `frontend/src/posapp/App.vue`
- `frontend/src/posapp/layouts/DefaultLayout.vue`
- `frontend/src/posapp/components/Navbar.vue`

Do not duplicate shell redesign work inside individual route screens.

## `/orders` - Purchase Orders

Route component:

- `frontend/src/posapp/components/pos/purchase/PurchaseOrders.vue`

Counts from route crawl:

- Vue files: 19
- Matching `*.vue.css` siblings: 19
- Imported CSS: 1
- Behavior files: 83

UI components:

- `frontend/src/posapp/components/pos/purchase/PurchaseOrders.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseHeader.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseItemsTable.vue`
- `frontend/src/posapp/components/pos/purchase/PurchasePaymentDialog.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseDraftDialog.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseManagementDialog.vue`
- `frontend/src/posapp/components/pos/dialogs/purchase/SupplierDialog.vue`
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
- `frontend/src/posapp/components/ui/Skeleton.vue`

CSS:

- Every Vue file above has a matching `*.vue.css` sibling.
- `frontend/src/posapp/styles/shimmer.css`

Behavior contracts:

- `frontend/src/posapp/components/pos/purchase/purchaseFormatting.js`
- `frontend/src/posapp/composables/pos/payments/usePurchaseOrder.ts`
- Shared item selector contracts under `frontend/src/posapp/composables/pos/items/**`
- Shared item/customer stores: `itemsStore`, `customersStore`, `invoiceStore`, `uiStore`, `toastStore`, `employeeStore`
- Shared item services and offline cache: `itemService.ts`, `api.ts`, `offline/index.ts`, `offline/db.ts`

Preserve:

- Supplier creation/selection.
- Purchase item selection, scanner, quantity, UOM, rate, received quantity, and remove actions.
- Purchase draft, management, payment, and save/submit behavior.

## `/payments` - POS Pay

Route component:

- `frontend/src/posapp/components/pos/shell/PayView.vue`

Counts from route crawl:

- Vue files: 10
- Matching `*.vue.css` siblings: 10
- Imported CSS: 0
- Behavior files: 25

UI components:

- `frontend/src/posapp/components/pos/shell/PayView.vue`
- `frontend/src/posapp/components/pos_pay/PayPartySelector.vue`
- `frontend/src/posapp/components/pos_pay/PayInvoicesTable.vue`
- `frontend/src/posapp/components/pos_pay/PayUnallocatedTable.vue`
- `frontend/src/posapp/components/pos_pay/PayMpesaSection.vue`
- `frontend/src/posapp/components/pos_pay/PayTotalsSidebar.vue`
- `frontend/src/posapp/components/pos_pay/PayActionButtons.vue`
- `frontend/src/posapp/components/pos/customer/Customer.vue`
- `frontend/src/posapp/components/pos/dialogs/customer/UpdateCustomer.vue`
- `frontend/src/posapp/components/ui/LoadingOverlay.vue`

Behavior contracts:

- `frontend/src/posapp/components/pos_pay/paymentModes.ts`
- `frontend/src/posapp/composables/pos/payments/usePosPayData.ts`
- `frontend/src/posapp/composables/pos/payments/usePosPaySelection.ts`
- `frontend/src/posapp/composables/pos/payments/usePosPaySubmission.ts`
- `frontend/src/posapp/composables/pos/payments/usePaymentSharing.ts`
- `frontend/src/posapp/utils/paymentRouteReadiness.ts`
- `frontend/src/posapp/utils/paymentPrintFormat.ts`
- `frontend/src/posapp/plugins/print.ts`
- `frontend/src/offline/index.ts`
- `frontend/src/offline/idempotency.ts`

Preserve:

- Party selection.
- Invoice allocation and unallocated payment handling.
- MPesa payment.
- Print/share behavior.
- Submit and offline payment behavior.

## `/gift-cards` - Gift Cards

Route component:

- `frontend/src/posapp/components/pos/wallet/GiftCardsView.vue`

Counts from route crawl:

- Vue files: 1
- Matching `*.vue.css` siblings: 1
- Imported CSS: 0
- Behavior files: 3

UI components:

- `frontend/src/posapp/components/pos/wallet/GiftCardsView.vue`

Behavior contracts:

- `frontend/src/posapp/stores/employeeStore.ts`
- `frontend/src/posapp/stores/uiStore.ts`
- `frontend/src/posapp/types/models.ts`

Preserve:

- Gift card list, issue, redeem, and view behavior.

## `/dashboard` And `/reports` - Reports Dashboard

Route component for both routes:

- `frontend/src/posapp/components/reports/Reports.vue`

Counts from route crawl:

- Vue files: 23
- Matching `*.vue.css` siblings: 1
- Imported CSS: 1
- Behavior files: 9

UI components:

- `frontend/src/posapp/components/reports/Reports.vue`
- `frontend/src/posapp/components/reports/components/DashboardHeader.vue`
- `frontend/src/posapp/components/reports/components/DashboardTabs.vue`
- `frontend/src/posapp/components/reports/components/MetricCard.vue`
- `frontend/src/posapp/components/reports/components/SummaryMetric.vue`
- `frontend/src/posapp/components/reports/components/SalesOverviewCards.vue`
- `frontend/src/posapp/components/reports/components/SalesSummarySection.vue`
- `frontend/src/posapp/components/reports/components/SalesTrendSection.vue`
- `frontend/src/posapp/components/reports/components/TrendPanel.vue`
- `frontend/src/posapp/components/reports/components/PaymentBreakdownSection.vue`
- `frontend/src/posapp/components/reports/components/FinanceSection.vue`
- `frontend/src/posapp/components/reports/components/ProductInsightsSection.vue`
- `frontend/src/posapp/components/reports/components/InventoryInsightsSection.vue`
- `frontend/src/posapp/components/reports/components/InventoryStatusSection.vue`
- `frontend/src/posapp/components/reports/components/ReorderSuggestionsSection.vue`
- `frontend/src/posapp/components/reports/components/StockMovementSection.vue`
- `frontend/src/posapp/components/reports/components/CustomerReportSection.vue`
- `frontend/src/posapp/components/reports/components/StaffPerformanceSection.vue`
- `frontend/src/posapp/components/reports/components/SupplierPurchaseSection.vue`
- `frontend/src/posapp/components/reports/components/BranchLocationSection.vue`
- `frontend/src/posapp/components/reports/components/DiscountVoidReturnSection.vue`
- `frontend/src/posapp/components/reports/components/InsightRow.vue`
- `frontend/src/posapp/components/reports/components/EmptyState.vue`

CSS:

- `frontend/src/posapp/components/reports/Reports.vue.css`
- `frontend/src/posapp/components/reports/components/reports.css`
- Child report components intentionally share `reports.css` instead of individual sibling CSS files.

Behavior contracts:

- `frontend/src/posapp/composables/useReportDashboardPayload.ts`
- `frontend/src/posapp/composables/useReportDashboardTabs.ts`
- `frontend/src/posapp/composables/useReportDerivations.ts`
- `frontend/src/posapp/composables/useReportFormatters.ts`
- `frontend/src/posapp/services/dashboardService.ts`
- `frontend/src/posapp/services/api.ts`
- `frontend/src/posapp/stores/employeeStore.ts`
- `frontend/src/posapp/stores/uiStore.ts`
- `frontend/src/posapp/types/models.ts`

Preserve:

- Dashboard payload loading.
- Tab state.
- Metric derivations and formatting.
- Export/service calls.

## `/barcode` - Barcode Printing And Label Designer

Route component:

- `frontend/src/posapp/components/pos/shell/BarcodePrinting.vue`

Counts from route crawl:

- Vue files: 18
- Matching `*.vue.css` siblings: 18
- Imported CSS: 1
- Behavior files: 88

UI components:

- `frontend/src/posapp/components/pos/shell/BarcodePrinting.vue`
- `frontend/src/posapp/components/pos/shell/LabelDesigner.vue`
- `frontend/src/posapp/components/pos/shell/LabelDesignerPanel.vue`
- `frontend/src/posapp/components/pos/shell/TemplateLibrary.vue`
- `frontend/src/posapp/components/pos/shell/ImportSourceDialog.vue`
- `frontend/src/posapp/components/pos/shell/VerificationDialog.vue`
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
- `frontend/src/posapp/components/ui/Skeleton.vue`

CSS:

- Every Vue file above has a matching `*.vue.css` sibling.
- `frontend/src/posapp/styles/shimmer.css`

Behavior contracts:

- `frontend/src/posapp/composables/pos/items/useBarcodePrintOutput.ts`
- `frontend/src/posapp/composables/pos/items/useBarcodePrintQueue.ts`
- `frontend/src/posapp/composables/pos/items/useLabelDesigner.ts`
- `frontend/src/posapp/composables/pos/items/useScaleBarcodeSettings.ts`
- `frontend/src/posapp/composables/pos/items/useSerializationEngine.ts`
- `frontend/src/posapp/composables/pos/items/useSsccGenerator.ts`
- `frontend/src/posapp/composables/pos/items/useZplGenerator.ts`
- Shared item selector contracts under `frontend/src/posapp/composables/pos/items/**`
- `frontend/src/posapp/services/itemService.ts`
- `frontend/src/posapp/services/exportService.ts`
- `frontend/src/posapp/services/qzTray.ts`
- `frontend/src/offline/index.ts`
- `frontend/src/offline/db.ts`

Preserve:

- Label queue.
- Barcode scanner and item staging.
- Label designer positioning.
- Template library import/save/delete.
- Verification dialog.
- PDF/print/thermal/ZPL/export behavior.

## `/cash-movement` - Cash Movement

Route component:

- `frontend/src/posapp/components/pos/cash/CashMovementView.vue`

Counts from route crawl:

- Vue files: 3
- Matching `*.vue.css` siblings: 3
- Imported CSS: 0
- Behavior files: 8

UI components:

- `frontend/src/posapp/components/pos/cash/CashMovementView.vue`
- `frontend/src/posapp/components/pos/cash/CashMovementForm.vue`
- `frontend/src/posapp/components/pos/cash/CashMovementHistory.vue`

Behavior contracts:

- `frontend/src/posapp/composables/pos/cash/useCashMovement.ts`
- `frontend/src/posapp/composables/pos/cash/useCashMovementValidation.ts`
- `frontend/src/posapp/services/cashMovementService.ts`
- `frontend/src/posapp/services/api.ts`
- `frontend/src/posapp/stores/toastStore.ts`
- `frontend/src/posapp/stores/uiStore.ts`
- `frontend/src/posapp/types/models.ts`
- `frontend/src/offline.ts`

Preserve:

- Cash movement create, validate, submit, cancel, duplicate, delete, and history behavior.

## `/closing` - Close Shift

Route component:

- `frontend/src/posapp/components/pos/shell/ClosingDialog.vue`

Counts from route crawl:

- Vue files: 4
- Matching `*.vue.css` siblings: 4
- Imported CSS: 0
- Behavior files: 5

UI components:

- `frontend/src/posapp/components/pos/shell/ClosingDialog.vue`
- `frontend/src/posapp/components/pos/closing/ClosingHeader.vue`
- `frontend/src/posapp/components/pos/closing/ShiftOverview.vue`
- `frontend/src/posapp/components/pos/closing/PaymentReconciliation.vue`

Behavior contracts:

- `frontend/src/posapp/composables/pos/closing/useClosingShift.ts`
- `frontend/src/posapp/composables/pos/closing/useClosingSummary.ts`
- `frontend/src/posapp/format.ts`
- `frontend/src/posapp/stores/uiStore.ts`
- `frontend/src/posapp/types/models.ts`

Preserve:

- Close shift load, reconcile, submit, error, and navigation behavior.

## `/customer-display` - Customer Display

Route component:

- `frontend/src/posapp/components/customer_display/CustomerDisplay.vue`

Layout:

- `frontend/src/posapp/layouts/CustomerDisplayLayout.vue`

Counts from route crawl:

- Vue files: 1
- Matching `*.vue.css` siblings: 1
- Imported CSS: 0
- Behavior files: 2

UI components:

- `frontend/src/posapp/layouts/CustomerDisplayLayout.vue`
- `frontend/src/posapp/components/customer_display/CustomerDisplay.vue`

Behavior contracts:

- `frontend/src/posapp/utils/customerDisplay.ts`
- `frontend/src/posapp/utils/stock.ts`

Preserve:

- Customer display route mode.
- Published cart/totals payload shape.
- Storage and broadcast behavior.

## `/offline-route-unavailable` - Offline Fallback

Route component:

- `frontend/src/posapp/components/system/OfflineRouteUnavailable.vue`

Counts from route crawl:

- Vue files: 1
- Matching `*.vue.css` siblings: 1
- Imported CSS: 0
- Behavior files: 0

UI components:

- `frontend/src/posapp/components/system/OfflineRouteUnavailable.vue`

Preserve:

- Route fallback copy and navigation actions.

## Coverage Audit

Coverage command compared all Vue files under:

- `frontend/src/posapp/components`
- `frontend/src/posapp/layouts`
- `frontend/src/posapp/App.vue`

Result:

- All Vue files found: 132 including `App.vue`
- Covered by foundation, first `/pos`, or remaining route crawl: 131
- Uncovered by route crawl: 1

Uncovered file:

- `frontend/src/posapp/components/pos/invoice/ParkedOrdersRail.vue`

Audit note:

- `ParkedOrdersRail.vue` exists in the repo but is not imported by the current route/component crawl.
- Keep it in the redesign audit as a manual component because it is a cart/invoice UI surface and was already listed in `UI_REDESIGN_MAP.md`.

CSS sibling audit:

- Vue files under `components` and `layouts`: 131
- `*.vue.css` files under `components` and `layouts`: 108
- Missing sibling CSS files: 23

Files without individual sibling CSS:

- `frontend/src/posapp/components/pos/invoice/ParkedOrdersRail.vue`
- `frontend/src/posapp/components/reports/components/BranchLocationSection.vue`
- `frontend/src/posapp/components/reports/components/CustomerReportSection.vue`
- `frontend/src/posapp/components/reports/components/DashboardHeader.vue`
- `frontend/src/posapp/components/reports/components/DashboardTabs.vue`
- `frontend/src/posapp/components/reports/components/DiscountVoidReturnSection.vue`
- `frontend/src/posapp/components/reports/components/EmptyState.vue`
- `frontend/src/posapp/components/reports/components/FinanceSection.vue`
- `frontend/src/posapp/components/reports/components/InsightRow.vue`
- `frontend/src/posapp/components/reports/components/InventoryInsightsSection.vue`
- `frontend/src/posapp/components/reports/components/InventoryStatusSection.vue`
- `frontend/src/posapp/components/reports/components/MetricCard.vue`
- `frontend/src/posapp/components/reports/components/PaymentBreakdownSection.vue`
- `frontend/src/posapp/components/reports/components/ProductInsightsSection.vue`
- `frontend/src/posapp/components/reports/components/ReorderSuggestionsSection.vue`
- `frontend/src/posapp/components/reports/components/SalesOverviewCards.vue`
- `frontend/src/posapp/components/reports/components/SalesSummarySection.vue`
- `frontend/src/posapp/components/reports/components/SalesTrendSection.vue`
- `frontend/src/posapp/components/reports/components/StaffPerformanceSection.vue`
- `frontend/src/posapp/components/reports/components/StockMovementSection.vue`
- `frontend/src/posapp/components/reports/components/SummaryMetric.vue`
- `frontend/src/posapp/components/reports/components/SupplierPurchaseSection.vue`
- `frontend/src/posapp/components/reports/components/TrendPanel.vue`

CSS note:

- Report child components share `frontend/src/posapp/components/reports/components/reports.css`.
- `ParkedOrdersRail.vue` should be checked manually before deciding whether to delete it, wire it, or give it a sibling CSS file.
