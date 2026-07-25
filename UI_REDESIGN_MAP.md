# POSMate UI Redesign Map

This map is the working contract for replacing POSAwesome UI piece by piece while keeping the same backend, APIs, stores, routes, events, and business actions.

Detailed registries:

- `BASE_PAGE_FOUNDATION_REGISTRY.md`
- `FIRST_POS_SCREEN_REGISTRY.md`
- `REMAINING_SCREENS_REGISTRY.md`

## Core Rules

- UI can change completely; action contracts cannot.
- Keep existing `props`, `emits`, `v-model`, route paths, store calls, service calls, and API methods unless an adapter is created first.
- Prefer replacing templates and styles before touching logic.
- If logic is tangled into UI, extract only UI-independent helpers/composables, then keep the public component contract identical.
- After each section: run `git diff --check`, `yarn type-check` from `frontend`, and `yarn build` before moving to the next large section.

## Phase 0 - Design System Foundation

Files to create/change:

- `frontend/src/posapp/styles/theme.css`
- `frontend/src/posapp/styles/shimmer.css`
- `frontend/src/posapp/components/ui/LoadingOverlay.vue`
- `frontend/src/posapp/components/ui/Skeleton.vue`
- `frontend/src/posapp/components/ui/UpdatePrompt.vue`

Planned shared primitives:

- `PosButton`
- `PosIconButton`
- `PosInput`
- `PosSelect`
- `PosCard`
- `PosPanel`
- `PosToolbar`
- `PosBadge`
- `PosDialog`
- `PosEmptyState`
- `PosTableShell`

Instruction:

- Build reusable visual primitives first, then migrate existing screens onto them gradually.
- Keep Vuetify fields/actions under the hood where they carry behavior, validation, focus, or accessibility.

## Phase 1 - App Shell, Layout, Navbar, Sidebar

Detailed foundation registry: `BASE_PAGE_FOUNDATION_REGISTRY.md`

Files:

- `frontend/src/posapp/App.vue`
- `frontend/src/posapp/layouts/DefaultLayout.vue`
- `frontend/src/posapp/layouts/CustomerDisplayLayout.vue`
- `frontend/src/posapp/components/Navbar.vue`
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

Instruction:

- Treat app bar and drawer as one shell system.
- Sidebar and topbar must share height, border, radius, typography, and density tokens.
- The unified header must keep navigation labels, app/company names, action labels, and icon hit areas responsive across desktop, tablet, mobile, and RTL without viewport-based font scaling.
- Do not change route targets, logout, shift, sync, employee switch, offline panel, notification, or QZ actions.

## Phase 2 - Main POS Workspace

Files:

- `frontend/src/posapp/components/pos/shell/Pos.vue`
- `frontend/src/posapp/components/pos/Invoice.vue`
- `frontend/src/posapp/components/pos/Payments.vue`

Instruction:

- Redesign page layout first: selector panel, invoice/cart panel, payment dialog/surface, mobile dock.
- Keep `activeView`, compact switcher, refs, and emitted events as-is.
- Do not change opening shift, payment dialog, invoice refs, or customer display publisher behavior.

## Verified First POS Screen Scope

This is the confirmed first screen scope for the `/pos` route. It was checked by crawling relative imports from `Pos.vue`, then adding the route/app shell that is visible around it.

Detailed registry: `FIRST_POS_SCREEN_REGISTRY.md`

Entry and shell files:

- `frontend/src/posapp/router/index.ts` - maps `/pos` to `components/pos/shell/Pos.vue`.
- `frontend/src/posapp/App.vue` - selects `DefaultLayout` for normal POS routes.
- `frontend/src/posapp/layouts/DefaultLayout.vue`
- `frontend/src/posapp/components/Navbar.vue`

Always-visible shell components:

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
- `frontend/src/posapp/components/OfflineInvoices.vue`
- `frontend/src/posapp/components/pos/employee/EmployeeSwitchDialog.vue`
- `frontend/src/posapp/components/pos/shell/ClosingDialog.vue`
- `frontend/src/posapp/components/pos/closing/ClosingHeader.vue`
- `frontend/src/posapp/components/pos/closing/ShiftOverview.vue`
- `frontend/src/posapp/components/pos/closing/PaymentReconciliation.vue`

POS route components from `Pos.vue`:

- `frontend/src/posapp/components/pos/shell/Pos.vue`
- `frontend/src/posapp/components/pos/Invoice.vue`
- `frontend/src/posapp/components/pos/Payments.vue`
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
- `frontend/src/posapp/components/pos/payments/PaymentConfirmationDialog.vue`
- `frontend/src/posapp/components/pos/shared/DocumentSourceSelector.vue`
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
- `frontend/src/posapp/components/pos/wallet/GiftCardDialog.vue`
- `frontend/src/posapp/components/pos/offers/PosOffers.vue`
- `frontend/src/posapp/components/pos/offers/PosCoupons.vue`
- `frontend/src/posapp/components/pos/flows/Drafts.vue`
- `frontend/src/posapp/components/pos/flows/SalesOrders.vue`
- `frontend/src/posapp/components/pos/flows/Returns.vue`
- `frontend/src/posapp/components/pos/flows/InvoiceManagement.vue`
- `frontend/src/posapp/components/pos/shift/OpeningDialog.vue`

First screen CSS scope:

- Every Vue component listed above has its matching `*.vue.css` sibling in scope.
- `frontend/src/posapp/components/pos/invoice/items-table-styles.css`
- `frontend/src/posapp/styles/theme.css`
- `frontend/src/posapp/styles/shimmer.css`

Contract-only imports for this screen:

- The crawl found 142 relative logic imports from `Pos.vue`.
- Treat `frontend/src/posapp/composables/**`, `frontend/src/posapp/stores/**`, `frontend/src/posapp/services/**`, `frontend/src/posapp/utils/**`, `frontend/src/posapp/modules/**`, and `frontend/src/posapp/offline/**` as behavior contracts unless a UI-safe adapter is needed.

Not part of the first `/pos` screen unless opened by route/action:

- `frontend/src/posapp/components/pos/shell/PayView.vue`
- `frontend/src/posapp/components/pos/shell/BarcodePrinting.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseOrders.vue`
- `frontend/src/posapp/components/pos/cash/CashMovementView.vue`
- `frontend/src/posapp/components/pos/shell/ClosingDialog.vue` is shell-mounted, but the full closing workflow belongs to Phase 10.
- `frontend/src/posapp/components/reports/Reports.vue`
- `frontend/src/posapp/components/customer_display/CustomerDisplay.vue`

## Phase 3 - Item Selector, Product Cards, Search, Scanner

Files:

- `frontend/src/posapp/components/pos/items/ItemsSelector.vue`
- `frontend/src/posapp/components/pos/items/ItemHeader.vue`
- `frontend/src/posapp/components/pos/items/ItemActionToolbar.vue`
- `frontend/src/posapp/components/pos/items/ItemsSelectorCards.vue`
- `frontend/src/posapp/components/pos/items/ItemCard.vue`
- `frontend/src/posapp/components/pos/items/ItemsSelectorTable.vue`
- `frontend/src/posapp/components/pos/items/ItemRateInfoMenu.vue`
- `frontend/src/posapp/components/pos/items/ItemSettingsDialog.vue`
- `frontend/src/posapp/components/pos/items/CameraScanner.vue`
- `frontend/src/posapp/components/pos/items/NewItemDialog.vue`
- `frontend/src/posapp/components/pos/items/ScanErrorDialog.vue`
- `frontend/src/posapp/components/pos/items/Variants.vue`
- `frontend/src/posapp/components/pos/items/newItemDialogState.ts`

Contract files to audit, usually not redesign:

- `frontend/src/posapp/composables/pos/items/useItemsSelectorSearch.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorFocus.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorQuantity.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorSettings.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorPanelSizing.ts`
- `frontend/src/posapp/composables/pos/items/useItemsSelectorLayoutLifecycle.ts`
- `frontend/src/posapp/composables/pos/items/useItemSelectorLayout.ts`
- `frontend/src/posapp/utils/itemSelectorLayout.ts`
- `frontend/src/posapp/utils/itemSelectorSettings.ts`

Instruction:

- Replace search/tools/cards/table UI while preserving scanner input, keyboard search, item selection, item add, drag/drop, rate info, and pagination.
- Product card must keep `@click`, `@dragstart`, `@dragend`, keyboard select, and item data formatting.

## Phase 4 - Invoice, Cart, Cart Table, Summary

Files:

- `frontend/src/posapp/components/pos/invoice/InvoiceCustomerSection.vue`
- `frontend/src/posapp/components/pos/invoice/DeliveryCharges.vue`
- `frontend/src/posapp/components/pos/invoice/PostingDateRow.vue`
- `frontend/src/posapp/components/pos/invoice/MultiCurrencyRow.vue`
- `frontend/src/posapp/components/pos/invoice/InvoiceItemsActionToolbar.vue`
- `frontend/src/posapp/components/pos/invoice/ItemsTable.vue`
- `frontend/src/posapp/components/pos/invoice/items-table-styles.css`
- `frontend/src/posapp/components/pos/invoice/ItemsTableExpandedRow.vue`
- `frontend/src/posapp/components/pos/invoice/CartItemRow.vue`
- `frontend/src/posapp/components/pos/invoice/InvoiceSummary.vue`
- `frontend/src/posapp/components/pos/invoice/InvoiceActionButtons.vue`
- `frontend/src/posapp/components/pos/invoice/CancelSaleDialog.vue`
- `frontend/src/posapp/components/pos/invoice/PackedItemsDialog.vue`
- `frontend/src/posapp/components/pos/invoice/ParkedOrdersList.vue`
- `frontend/src/posapp/components/pos/invoice/ParkedOrdersRail.vue`
- `frontend/src/posapp/components/pos/invoice/PriceListRateDialog.vue`

Contract files to audit, normally preserve:

- `frontend/src/posapp/components/pos/invoice/invoiceComputed.ts`
- `frontend/src/posapp/components/pos/invoice/invoiceItemMethods.ts`
- `frontend/src/posapp/components/pos/invoice/invoiceShortcuts.ts`
- `frontend/src/posapp/components/pos/invoice/invoiceWatchers.ts`
- `frontend/src/posapp/components/pos/invoice_utils/*.ts`
- `frontend/src/posapp/composables/pos/invoice/*.ts`
- `frontend/src/posapp/utils/itemsTableHeaders.ts`
- `frontend/src/posapp/utils/cartFieldFocus.ts`

Instruction:

- Redesign cart empty state, row density, column toolbar, quantity controls, expanded row, action buttons, totals area.
- Do not change add/subtract/remove, serial/batch, discount, price list rate, packed items, parked order, or cancel-sale behavior.

## Phase 5 - Payment UI

Files:

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

Contract files to audit, normally preserve:

- `frontend/src/posapp/composables/pos/payments/usePaymentCalculations.ts`
- `frontend/src/posapp/composables/pos/payments/usePaymentMethods.ts`
- `frontend/src/posapp/composables/pos/payments/usePaymentPrinting.ts`
- `frontend/src/posapp/composables/pos/payments/usePaymentSharing.ts`
- `frontend/src/posapp/composables/pos/payments/usePaymentSubmission.ts`
- `frontend/src/posapp/composables/pos/payments/usePurchaseOrder.ts`
- `frontend/src/posapp/composables/pos/payments/useRedemptionLogic.ts`
- `frontend/src/posapp/utils/paymentInitialization.ts`
- `frontend/src/posapp/utils/paymentPrintDoctype.ts`
- `frontend/src/posapp/utils/paymentPrintFormat.ts`
- `frontend/src/posapp/utils/paymentRouteReadiness.ts`

Instruction:

- Redesign payment as a premium collection surface/dialog.
- Keep payment method calculation, submit/print/share, MPesa, gift card, customer credit, redemption, and confirmation flow unchanged.

## Phase 6 - POS Pay Screen

Files:

- `frontend/src/posapp/components/pos/shell/PayView.vue`
- `frontend/src/posapp/components/pos_pay/PayPartySelector.vue`
- `frontend/src/posapp/components/pos_pay/PayInvoicesTable.vue`
- `frontend/src/posapp/components/pos_pay/PayUnallocatedTable.vue`
- `frontend/src/posapp/components/pos_pay/PayMpesaSection.vue`
- `frontend/src/posapp/components/pos_pay/PayTotalsSidebar.vue`
- `frontend/src/posapp/components/pos_pay/PayActionButtons.vue`
- `frontend/src/posapp/components/pos_pay/paymentModes.ts`

Contract files to audit:

- `frontend/src/posapp/composables/pos/payments/usePosPayData.ts`
- `frontend/src/posapp/composables/pos/payments/usePosPaySelection.ts`
- `frontend/src/posapp/composables/pos/payments/usePosPaySubmission.ts`

Instruction:

- Keep party selection, invoice allocation, unallocated amount, MPesa payment, and submission logic unchanged.

## Phase 7 - Offers, Coupons, Drafts, Sales Orders, Returns, Invoice Management

Files:

- `frontend/src/posapp/components/pos/offers/PosOffers.vue`
- `frontend/src/posapp/components/pos/offers/PosCoupons.vue`
- `frontend/src/posapp/components/pos/flows/Drafts.vue`
- `frontend/src/posapp/components/pos/flows/SalesOrders.vue`
- `frontend/src/posapp/components/pos/flows/Returns.vue`
- `frontend/src/posapp/components/pos/flows/InvoiceManagement.vue`
- `frontend/src/posapp/components/OfflineInvoices.vue`

Instruction:

- Redesign all list/dialog views with the same table, filter, empty-state, and action button patterns.
- Preserve load/resume/delete/sync/return/select events.

## Phase 8 - Customer, Address, Employee, Supplier Dialogs

Files:

- `frontend/src/posapp/components/pos/customer/Customer.vue`
- `frontend/src/posapp/components/pos/customer/NewAddress.vue`
- `frontend/src/posapp/components/pos/dialogs/customer/UpdateCustomer.vue`
- `frontend/src/posapp/components/pos/dialogs/purchase/SupplierDialog.vue`
- `frontend/src/posapp/components/pos/employee/EmployeeSwitchDialog.vue`

Instruction:

- Redesign forms and dialogs around shared `PosDialog`, `PosInput`, `PosSelect`, and `PosButton`.
- Preserve validation, selection, save, employee switch, and PIN behavior.

## Phase 9 - Purchase Order UI

Files:

- `frontend/src/posapp/components/pos/purchase/PurchaseOrders.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseHeader.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseItemsTable.vue`
- `frontend/src/posapp/components/pos/purchase/PurchasePaymentDialog.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseDraftDialog.vue`
- `frontend/src/posapp/components/pos/purchase/PurchaseManagementDialog.vue`
- `frontend/src/posapp/components/pos/purchase/purchaseFormatting.js`

Instruction:

- Keep supplier, item selection, draft, payment, and management APIs unchanged.
- Only UI shell, table styling, totals, dialog layout, and toolbar density should change.

## Phase 10 - Cash Movement, Shift Opening, Closing

Files:

- `frontend/src/posapp/components/pos/cash/CashMovementView.vue`
- `frontend/src/posapp/components/pos/cash/CashMovementForm.vue`
- `frontend/src/posapp/components/pos/cash/CashMovementHistory.vue`
- `frontend/src/posapp/components/pos/shift/OpeningDialog.vue`
- `frontend/src/posapp/components/pos/shell/ClosingDialog.vue`
- `frontend/src/posapp/components/pos/closing/ClosingHeader.vue`
- `frontend/src/posapp/components/pos/closing/ShiftOverview.vue`
- `frontend/src/posapp/components/pos/closing/PaymentReconciliation.vue`

Contract files:

- `frontend/src/posapp/composables/pos/cash/useCashMovement.ts`
- `frontend/src/posapp/composables/pos/cash/useCashMovementValidation.ts`
- `frontend/src/posapp/composables/pos/closing/useClosingShift.ts`
- `frontend/src/posapp/composables/pos/closing/useClosingSummary.ts`
- `frontend/src/posapp/composables/pos/shared/usePosShift.ts`

Instruction:

- Redesign shift/cash workflows as operational panels with clear status and reconciliation sections.
- Preserve submit, validate, close/open shift, and reconciliation behavior.

## Phase 11 - Barcode, Label Designer, Template Library

Files:

- `frontend/src/posapp/components/pos/shell/BarcodePrinting.vue`
- `frontend/src/posapp/components/pos/shell/LabelDesigner.vue`
- `frontend/src/posapp/components/pos/shell/LabelDesignerPanel.vue`
- `frontend/src/posapp/components/pos/shell/TemplateLibrary.vue`
- `frontend/src/posapp/components/pos/shell/ImportSourceDialog.vue`
- `frontend/src/posapp/components/pos/shell/VerificationDialog.vue`
- `frontend/src/posapp/components/pos/shared/DocumentSourceSelector.vue`

Contract files:

- `frontend/src/posapp/composables/pos/items/useBarcodePrintOutput.ts`
- `frontend/src/posapp/composables/pos/items/useBarcodePrintQueue.ts`
- `frontend/src/posapp/composables/pos/items/useLabelDesigner.ts`
- `frontend/src/posapp/composables/pos/items/useScaleBarcodeSettings.ts`
- `frontend/src/posapp/composables/pos/items/useSerializationEngine.ts`
- `frontend/src/posapp/composables/pos/items/useSsccGenerator.ts`
- `frontend/src/posapp/composables/pos/items/useZplGenerator.ts`
- `frontend/src/posapp/utils/scaleBarcode.ts`

Instruction:

- Redesign toolbar, item staging, designer canvas/sidebar, template library, verification/import dialogs.
- Preserve label generation, ZPL/output, print queue, import, and verification logic.

## Phase 12 - Wallet/Gift Cards

Files:

- `frontend/src/posapp/components/pos/wallet/GiftCardsView.vue`
- `frontend/src/posapp/components/pos/wallet/GiftCardDialog.vue`

Instruction:

- Redesign gift card list, form, actions, and empty states.
- Preserve issue/redeem/search and wallet behavior.

## Phase 13 - Reports Dashboard

Files:

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
- `frontend/src/posapp/components/reports/components/reports.css`

Contract files:

- `frontend/src/posapp/composables/useReportDashboardPayload.ts`
- `frontend/src/posapp/composables/useReportDashboardTabs.ts`
- `frontend/src/posapp/composables/useReportDerivations.ts`
- `frontend/src/posapp/composables/useReportFormatters.ts`
- `frontend/src/posapp/services/dashboardService.ts`
- `frontend/src/posapp/services/exportService.ts`

Instruction:

- Redesign as dense operational dashboard, not a landing page.
- Preserve report data derivation, tabs, filters, exports, and service calls.

## Phase 14 - Customer Display

Files:

- `frontend/src/posapp/components/customer_display/CustomerDisplay.vue`
- `frontend/src/posapp/layouts/CustomerDisplayLayout.vue`
- `frontend/src/posapp/utils/customerDisplay.ts`
- `frontend/src/posapp/composables/pos/shared/useCustomerDisplayPublisher.ts`

Instruction:

- Redesign customer-facing cart and totals view.
- Preserve broadcast/publisher payload shape and display route behavior.

## Phase 15 - System/Offline/Update Screens

Files:

- `frontend/src/posapp/components/system/OfflineRouteUnavailable.vue`
- `frontend/src/posapp/components/ui/UpdatePrompt.vue`
- `frontend/src/posapp/components/ui/LoadingOverlay.vue`
- `frontend/src/posapp/components/ui/Skeleton.vue`

Contract files:

- `frontend/src/posapp/composables/runtime/useBootSync.ts`
- `frontend/src/posapp/composables/runtime/useCustomerReadiness.ts`
- `frontend/src/posapp/composables/runtime/useNetworkLifecycle.ts`
- `frontend/src/posapp/composables/runtime/useQueueMetrics.ts`
- `frontend/src/posapp/composables/runtime/useUpdateChecks.ts`
- `frontend/src/posapp/stores/offlineSyncStore.ts`
- `frontend/src/posapp/stores/updateStore.ts`

Instruction:

- Redesign status, loading, update, offline unavailable, and skeleton states.
- Preserve offline readiness, cache, update, and queue logic.

## Phase 16 - Global CSS Cleanup

Files:

- Every `*.vue.css` next to the Vue files above.
- `frontend/src/posapp/styles/theme.css`
- `frontend/src/posapp/styles/shimmer.css`
- `frontend/src/posapp/components/pos/invoice/items-table-styles.css`
- `frontend/src/posapp/components/reports/components/reports.css`

Instruction:

- Gradually reduce scattered component CSS into shared tokens/classes.
- Remove duplicate one-off overrides only after the component using them has been migrated.
- Do not delete CSS blindly; search for every selector first.

## Do Not Redesign Directly Unless Needed

These are logic/data layers. They should usually be audited for UI contracts, not visually rewritten:

- `frontend/src/posapp/services/*.ts`
- `frontend/src/posapp/stores/*.ts`
- `frontend/src/posapp/modules/**/*.ts`
- `frontend/src/posapp/utils/*.ts`
- `frontend/src/posapp/composables/**/*.ts`
- `frontend/src/posapp/workers/*.js`
- `frontend/src/posapp/types/*.ts`
- `frontend/src/posapp/router/index.ts`
- `frontend/src/posapp/plugins/*.ts`
- `frontend/src/posapp/config/loading.ts`
- `frontend/src/posapp/format.ts`
- `frontend/src/posapp/bus.ts`
- `frontend/src/posapp/posapp.ts`

Rule:

- Touch these only for extracting UI adapters, moving display-only formatting, fixing layout measurements, or keeping backward-compatible contracts.

## Execution Order

1. Freeze contracts: document props/emits/store/service calls for the target component.
2. Build/adjust shared primitive if the target needs a reusable control.
3. Replace target template and CSS.
4. Keep method names, emitted events, and v-model names identical.
5. Run focused searches for removed selectors/props/events.
6. Run `git diff --check`.
7. Run `yarn type-check` from `frontend`.
8. Run `yarn build` from `frontend`.
9. Take screenshot/manual check for desktop and small screen.
10. Move to next target only after the current piece is visually acceptable.

## First Recommended Sprint

1. `ItemHeader.vue`
2. `ItemActionToolbar.vue`
3. `ItemCard.vue`
4. `ItemsSelectorCards.vue`
5. `ItemsSelectorTable.vue`
6. `ItemsSelector.vue`
7. `InvoiceItemsActionToolbar.vue`
8. `ItemsTable.vue`
9. `InvoiceSummary.vue`
10. `InvoiceActionButtons.vue`

Reason:

- This sprint owns the visible POS selling surface and gives the fastest design win while keeping the backend/API untouched.
