# Base Page Foundation Registry

This registry collects the first UI foundation layer before redesigning the POS selling surface.
It covers app boot, layout, navbar, sidebar, global density, status surfaces, and shell-mounted dialogs.

Related registries:

- `FIRST_POS_SCREEN_REGISTRY.md`
- `REMAINING_SCREENS_REGISTRY.md`

## Foundation Boundary

Included:

- App boot and global styles.
- Route/layout selection.
- Default POS layout.
- Main app bar and sidebar.
- Navbar menu, settings, offline, notifications, QZ, cache, and status gadgets.
- Loading/update overlays.
- Shell-mounted employee, offline invoices, and closing shift surfaces.

Not included yet:

- POS selling content: item selector, cart, invoice summary, payment surface.
- Separate routes: payments route, barcode route, purchase order route, reports, customer display redesign.

## Source Chain

- `frontend/src/posapp/posapp.ts`
- `frontend/src/posapp/App.vue`
- `frontend/src/posapp/router/index.ts`
- `frontend/src/posapp/layouts/DefaultLayout.vue`
- `frontend/src/posapp/components/Navbar.vue`

## Foundation Counts

- Foundation Vue files reached from `App.vue`, `DefaultLayout.vue`, and `Navbar.vue`: 27
- Matching foundation `*.vue.css` sibling files: 27
- Foundation behavior files reached by crawl: 54
- Global CSS imported at app boot: 3

## Primary Foundation Files

- `frontend/src/posapp/posapp.ts`
- `frontend/src/posapp/App.vue`
- `frontend/src/posapp/App.vue.css`
- `frontend/src/posapp/layouts/DefaultLayout.vue`
- `frontend/src/posapp/layouts/DefaultLayout.vue.css`
- `frontend/src/posapp/components/Navbar.vue`
- `frontend/src/posapp/components/Navbar.vue.css`

## Global CSS Foundation

- `frontend/src/posapp/styles/theme.css`
- `frontend/src/style.css`
- `posawesome/public/css/rtl.css`

## Layout Foundation Components

- `frontend/src/posapp/components/ui/LoadingOverlay.vue`
- `frontend/src/posapp/components/ui/LoadingOverlay.vue.css`
- `frontend/src/posapp/components/ui/UpdatePrompt.vue`
- `frontend/src/posapp/components/ui/UpdatePrompt.vue.css`

## Navbar And Sidebar Components

- `frontend/src/posapp/components/navbar/NavbarAppBar.vue`
- `frontend/src/posapp/components/navbar/NavbarAppBar.vue.css`
- `frontend/src/posapp/components/navbar/NavbarDrawer.vue`
- `frontend/src/posapp/components/navbar/NavbarDrawer.vue.css`
- `frontend/src/posapp/components/navbar/NavbarMenu.vue`
- `frontend/src/posapp/components/navbar/NavbarMenu.vue.css`
- `frontend/src/posapp/components/navbar/NavbarSettingsPanel.vue`
- `frontend/src/posapp/components/navbar/NavbarSettingsPanel.vue.css`
- `frontend/src/posapp/components/navbar/NavbarCashierPinForm.vue`
- `frontend/src/posapp/components/navbar/NavbarCashierPinForm.vue.css`
- `frontend/src/posapp/components/navbar/NavbarInfoGadgets.vue`
- `frontend/src/posapp/components/navbar/NavbarInfoGadgets.vue.css`
- `frontend/src/posapp/components/navbar/StatusIndicator.vue`
- `frontend/src/posapp/components/navbar/StatusIndicator.vue.css`
- `frontend/src/posapp/components/navbar/OfflineStatusPanel.vue`
- `frontend/src/posapp/components/navbar/OfflineStatusPanel.vue.css`
- `frontend/src/posapp/components/navbar/NotificationBell.vue`
- `frontend/src/posapp/components/navbar/NotificationBell.vue.css`
- `frontend/src/posapp/components/navbar/CacheUsageMeter.vue`
- `frontend/src/posapp/components/navbar/CacheUsageMeter.vue.css`
- `frontend/src/posapp/components/navbar/ServerUsageGadget.vue`
- `frontend/src/posapp/components/navbar/ServerUsageGadget.vue.css`
- `frontend/src/posapp/components/navbar/DatabaseUsageGadget.vue`
- `frontend/src/posapp/components/navbar/DatabaseUsageGadget.vue.css`
- `frontend/src/posapp/components/navbar/QzTrayDialog.vue`
- `frontend/src/posapp/components/navbar/QzTrayDialog.vue.css`
- `frontend/src/posapp/components/navbar/AboutDialog.vue`
- `frontend/src/posapp/components/navbar/AboutDialog.vue.css`

## Shell-Mounted Support Components

- `frontend/src/posapp/components/OfflineInvoices.vue`
- `frontend/src/posapp/components/OfflineInvoices.vue.css`
- `frontend/src/posapp/components/pos/employee/EmployeeSwitchDialog.vue`
- `frontend/src/posapp/components/pos/employee/EmployeeSwitchDialog.vue.css`
- `frontend/src/posapp/components/pos/shell/ClosingDialog.vue`
- `frontend/src/posapp/components/pos/shell/ClosingDialog.vue.css`
- `frontend/src/posapp/components/pos/closing/ClosingHeader.vue`
- `frontend/src/posapp/components/pos/closing/ClosingHeader.vue.css`
- `frontend/src/posapp/components/pos/closing/ShiftOverview.vue`
- `frontend/src/posapp/components/pos/closing/ShiftOverview.vue.css`
- `frontend/src/posapp/components/pos/closing/PaymentReconciliation.vue`
- `frontend/src/posapp/components/pos/closing/PaymentReconciliation.vue.css`

## App-Level Customer Display Branch

These are reached from `App.vue`, but are not part of normal `/pos` foundation work unless customer display is being redesigned:

- `frontend/src/posapp/layouts/CustomerDisplayLayout.vue`
- `frontend/src/posapp/layouts/CustomerDisplayLayout.vue.css`
- `frontend/src/posapp/components/customer_display/CustomerDisplay.vue`
- `frontend/src/posapp/components/customer_display/CustomerDisplay.vue.css`

## Foundation Behavior Contracts

Treat these as behavior contracts. Touch only when a UI-safe adapter or layout measurement fix is needed.

- `frontend/src/offline.ts`
- `frontend/src/offline/bootstrapSnapshot.ts`
- `frontend/src/offline/cache.ts`
- `frontend/src/offline/db.ts`
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
- `frontend/src/offline_print_template.ts`
- `frontend/src/posapp/components/pos/pos.png`
- `frontend/src/posapp/composables/core/useClientLoad.ts`
- `frontend/src/posapp/composables/core/useDatabaseStats.ts`
- `frontend/src/posapp/composables/core/useLastInvoicePrinting.ts`
- `frontend/src/posapp/composables/core/useLoading.ts`
- `frontend/src/posapp/composables/core/useNetwork.ts`
- `frontend/src/posapp/composables/core/useRtl.ts`
- `frontend/src/posapp/composables/core/useServerStats.ts`
- `frontend/src/posapp/composables/pos/closing/useClosingShift.ts`
- `frontend/src/posapp/composables/pos/closing/useClosingSummary.ts`
- `frontend/src/posapp/composables/pos/shared/usePosShift.ts`
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
- `frontend/src/posapp/services/documentPrint.ts`
- `frontend/src/posapp/services/qzTray.ts`
- `frontend/src/posapp/services/rawDocumentPrint.ts`
- `frontend/src/posapp/stores/employeeStore.ts`
- `frontend/src/posapp/stores/invoiceStore.ts`
- `frontend/src/posapp/stores/offlineSyncStore.ts`
- `frontend/src/posapp/stores/pricingRulesStore.ts`
- `frontend/src/posapp/stores/toastStore.ts`
- `frontend/src/posapp/stores/uiStore.ts`
- `frontend/src/posapp/stores/updateStore.ts`
- `frontend/src/posapp/types/models.ts`
- `frontend/src/posapp/utils/bootstrapRuntimeEvents.ts`
- `frontend/src/posapp/utils/bootstrapWarningVisibility.ts`
- `frontend/src/posapp/utils/bootstrapWarnings.ts`
- `frontend/src/posapp/utils/customerDisplay.ts`
- `frontend/src/posapp/utils/openingCache.ts`
- `frontend/src/posapp/utils/stock.ts`
- `frontend/src/utils/clearAllCaches.ts`

## Foundation Contracts To Preserve

- `page-content` spacing and scroll behavior must stay coordinated with topbar and sidebar dimensions.
- `pos-theme-root`, `posapp`, and RTL classes must remain available for global CSS selectors.
- Navbar emits and `DefaultLayout` listeners must keep the same names.
- Offline/online status, sync, cache usage, QZ, notifications, employee switch, closing shift, and logout actions must keep the same handlers.
- App display branch for customer display must keep its route/layout behavior.

## Unified Header Redesign Contract

- Move primary navigation from the drawer surface into the header, but keep `NavbarDrawer.vue` for mobile navigation and overflow.
- Do not describe or treat the current `NavbarDrawer.vue` as a persistent desktop sidebar; it is already temporary and hidden until opened.
- Navigation items must have one source of truth: the `items` array in `Navbar.vue`.
- Pass that same `items` array into `NavbarAppBar.vue` as navigation data, then reuse it for desktop navigation, tablet navigation, mobile drawer, and overflow menus.
- Never hard-code fixed navigation labels inside `NavbarAppBar.vue`.
- Keep dynamic/permission-driven entries such as dashboard, gift cards, cash movement, purchase order, and barcode printing.
- Overflow behavior must use both breakpoint rules and real available-width measurement. If the nav capsule cannot fit all items, move lower-priority items into `More`; do not hide or delete them.
- Keep `Offline Invoices` separate from normal invoice list behavior. The existing pending invoice badge remains tied to offline/sync state unless a new invoice-list action is added intentionally.
- Use `Switch Cashier` for employee switching. Do not rename it to `Cashier Exchange`, because cash movement is a different route/action.
- Remove permanent sidebar layout spacing from `page-content` only after the header navigation owns desktop navigation.

## Responsive Typography And Density Contract

- Font and element sizes must be comfortable on desktop and compact enough on small screens.
- Do not use viewport-width font scaling. Use explicit density tokens and breakpoint-specific CSS variables instead.
- Typography must not wrap inside header controls. Use max-width, ellipsis, and tooltips for long app, company, employee, and navigation labels.
- The company name is visible on wide screens, truncated with tooltip on medium screens, and hidden on compact/mobile screens if space is tight.
- Icon buttons must keep a minimum hit area of `44px x 44px`.
- Desktop header target height: `80px` to `88px`.
- Laptop header target height: `72px` to `80px`.
- Tablet two-row header target height: `120px` to `132px`.
- Mobile header target height: `64px` to `68px`.
- Navigation capsule target height: about `52px` on desktop and `44px` to `48px` on compact widths.
- Header brand title target sizes: `18px` to `20px` desktop, `16px` to `18px` laptop/tablet, `14px` to `16px` mobile.
- Navigation label target sizes: `13px` to `14px` desktop, `12px` to `13px` laptop/tablet, hidden or drawer-only on mobile.
- Tool/action label target sizes: `12px` to `13px`; hide non-essential labels before shrinking text too far.
- Icons should stay visually consistent: generally `20px` to `22px` desktop, `18px` to `20px` compact.
- Preserve readable contrast and avoid text overflow in Arabic, English, and RTL mode.

## First Redesign Order

1. `frontend/src/posapp/styles/theme.css`
2. `frontend/src/posapp/layouts/DefaultLayout.vue`
3. `frontend/src/posapp/layouts/DefaultLayout.vue.css`
4. `frontend/src/posapp/components/Navbar.vue`
5. `frontend/src/posapp/components/navbar/NavbarAppBar.vue`
6. `frontend/src/posapp/components/navbar/NavbarDrawer.vue`
7. `frontend/src/posapp/components/navbar/NavbarMenu.vue`
8. `frontend/src/posapp/components/navbar/NavbarSettingsPanel.vue`
9. Support/status components under `frontend/src/posapp/components/navbar/`
10. `LoadingOverlay.vue`, `UpdatePrompt.vue`, `OfflineInvoices.vue`, and shell-mounted dialogs
