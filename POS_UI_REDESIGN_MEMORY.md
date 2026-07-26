# POS UI Redesign Memory

## Goal

Redesign POSAwesome into POSMate with a premium, compact, responsive UI while preserving all APIs, stores, router behavior, emits, handlers, calculations, dialogs, and item actions.

## Active Contracts

- Presentation-only unless explicitly agreed otherwise.
- Do not change filtering logic, item add flow, payment behavior, stores, APIs, or backend calls.
- Preserve `RecycleScroller` for product cards.
- Keep click, keyboard Enter/Space, dragstart, dragend, highlighting, rate info, multi-currency, stock formatting, and scanner behavior intact.
- Use compact premium density: consistent icons, 44px minimum hit areas, controlled padding/margins, responsive typography, no oversized controls.
- RTL support should use logical CSS properties and intentional layout, not accidental reversal.

## Completed Design Passes

- Unified header/navigation foundation: sidebar merged into POSMate header, mobile drawer restyled, compact controls.
- POS Page Shell Redesign: layout-only regions for products and cart, preserving compact panel switching and dialogs.
- Pass 1 ItemsSelector shell: command, filter, results, and overlay regions; results-only scrolling.
- Pass 2 ItemHeader: premium command bar, search/qty/tools/sync presentation preserved.
- Pass 3 ItemActionToolbar: compact category/filter strip with scrollable categories and fixed actions.
- Pass 4 Product Grid Foundation: results pane and `RecycleScroller` fill behavior cleaned up.
- Pass 4.1 Container-Aware Product Grid Metrics: product columns now use measured `.items-card-container` width via `ResizeObserver`.

## Recently Completed

- Pass 4.2 Product Card Spacing and Virtual Slot Alignment: `ItemCard.vue` uses fixed CSS Grid rows; product card metrics and virtual slots stay aligned.

Pass 6.7.1 — Payment Screen Shell and Responsive Layout (Complete ✅).

Scope:

- **4-Tier Fixed/Scroll Layout**: Restructured `Payments.vue` into 4 distinct regions:
  1. Fixed Header ([PaymentScreenHeader.vue](file:///home/frappe/frappe-bench/apps/posawesome/frontend/src/posapp/components/pos/payments/PaymentScreenHeader.vue))
  2. Fixed Overview Summary (`.payment-shell__overview` holding `<PaymentSummary>`)
  3. Single Scrollable Body (`.payment-shell__body`)
  4. Fixed Action Footer (`.payment-shell__footer` holding `<PaymentActionButtons>`)
- **Presentation Section Shells**: Created [PaymentSectionShell.vue](file:///home/frappe/frappe-bench/apps/posawesome/frontend/src/posapp/components/pos/payments/PaymentSectionShell.vue) wrapping Payment Methods, Invoice Summary, Redemption, Settlement Options, and Additional Details.
- **Desktop & Mobile Responsive Grid**: Implemented 2-column desktop grid (`1.08fr` / `0.92fr`) and 1-column mobile/tablet responsive layout in [Payments.vue.css](file:///home/frappe/frappe-bench/apps/posawesome/frontend/src/posapp/components/pos/Payments.vue.css).
- **POS Profile Setting Normalization**: Normalized `posa_use_gift_cards` and `is_supervisor` using `parseBooleanSetting()` preventing string `"0"` false-positives.
- **Automated Tests**: Created [paymentShellLayout.spec.ts](file:///home/frappe/frappe-bench/apps/posawesome/frontend/tests/paymentShellLayout.spec.ts) validating header rendering, section shell collapse/expand, and back event emitters.

Pass 6.7.0 — Payment Flow Audit and Contract Freeze (Complete ✅).

Scope:

- **Audit Document (`PAYMENT_FLOW_AUDIT.md`)**: Documented entry point sequence, component hierarchy (`Payments.vue`, `PaymentSummary.vue`, `PaymentMethods.vue`, `PaymentRedemption.vue`, `PaymentOptions.vue`), store dependencies, API endpoints, math formulas (`diff_payment`, `change_due`), POS Profile payment settings matrix, return/refund rules, customer credit, loyalty, multi-currency, and submission lifecycle.
- **Contract Freeze Guarantees**: Guaranteed zero changes to payment UI, calculations, APIs, event names, or accounting logic in Pass 6.7.0.
- **Sub-Pass Architecture**:
  - Pass 6.7.1 — Payment Screen Shell & Responsive Layout
  - Pass 6.7.2 — Payment Methods & Amount Allocation
  - Pass 6.7.3 — Credit, Loyalty, References & Returns
  - Pass 6.7.4 — Submission, Success & Regression Acceptance
- **Contract Tests**: Created `tests/paymentCalculationsContract.spec.ts`, `tests/paymentFlowContract.spec.ts`, and `tests/paymentProfileMatrix.spec.ts`.

Pass 6.6.3 — Final Invoice Row Actions & Column Contract Cleanup (Complete ✅).

Scope:

- **Single Source of Truth Sizing (`96px`)**: Standardized `INVOICE_ACTIONS_COLUMN_WIDTH = 96` across `useItemsTableResponsive.ts`, `ItemsTable.vue` CSS Grid track builder, and `items-table-styles.css`.
- **System Required Actions Column**: Defined `INVOICE_ACTIONS_COLUMN` (`key: "actions"`, `width: 96`, `required: true`). Actions column is always attached and can never be hidden by Column Selector.
- **Removed Legacy Expand Column**: Completely removed `DATA_TABLE_EXPAND_COLUMN`, `"data-table-expand"` tracks, and fallback cells from `ItemsTable.vue`, `CartItemRow.vue`, and `useItemsTableResponsive.ts`.
- **Mobile Touch Sizing (`44x44px`)**: Set explicit `44x44px` touch targets for mobile viewports in `InvoiceItemRowActions.vue`.
- **Cleaned Up Unused Imports & Double Filtering**: Removed unused capability imports from `InvoiceItemCard.vue` and removed unused `:search` / `:custom-filter` double-filtering props from `InvoiceItemsTableView.vue`.
- **Automated Tests**: Updated `tests/itemsTableResponsiveColumns.spec.ts` and `tests/cartItemRowActions.spec.ts` confirming exact 96px column width, absence of `data-table-expand`, and event payload forwarding.

Pass 6.6.2 — Invoice Action Integrity & Item Row Actions Fix (Complete ✅).

Scope:

- **Unified Action Cluster (`InvoiceItemRowActions.vue`)**: Standardized item row action buttons (`Details` primary tonal `mdi-tune-variant`, `Delete` error tonal `mdi-delete-outline`) across Premium List and Classic Table.
- **Fixed Table Event Contract**: Removed old `isExpanded` prop, `toggle-expand` emit, and inline chevron icons from `CartItemRow.vue` and `InvoiceItemsTableView.vue`. Details button now directly emits `open-details(item)` so the exact item is passed to Details Dialog.
- **Widened Actions Column**: Increased `actions` column width in `useItemsTableResponsive.ts` to `96px` and added `overflow: visible` styling in `items-table-styles.css`.
- **v-memo Reactivity & Offer Guard**: Included all capabilities in `memoDeps` (`editQty`, `editRate`, `editDiscount`, `changeUom`, `changePriceListRate`, `overrideItemName`, `removeItem`, `toggleOffer`). Added `toggleOffer` capability guard in `useItemPermissions.ts`.
- **Table Money Parity**: Updated `CartItemRow.vue` line amount calculation (`item.amount` priority) and formatted all amounts via `formatMoney(...)`.
- **Automated Tests**: Created `tests/cartItemRowActions.spec.ts` testing row action emits, promotional item locks, offer capabilities, and footer event regression tests.

Pass 6.6.1 — Footer Reactivity & Action Safety Acceptance (Complete ✅).

Scope:

- **Reactive Composable Inputs**: Updated `useInvoiceFooterActions.ts` with `MaybeRefOrGetter` and `toValue()`. Passed `toRef(props, ...)` refs from `InvoiceActionButtons.vue` ensuring instant reactivity on POS profile switches and loading updates.
- **Action Execution Guard & Loading Spinners**: Added map lookup `actionByKey` preventing action emits during loading, hidden state, or double click. Added `<v-progress-circular>` loading spinners inside `More` menu items.
- **Empty Cart Pay Guard**: Added `:has-items="Math.abs(Number(total_qty || 0)) > 0"` prop disabling Pay button when cart is empty while allowing Pay for return invoices (`total_qty < 0`).
- **Double Pay Lock**: Added `payClickLocked` guard preventing duplicate `show-payment` emissions.
- **Accessibility & Mobile Expansion**: Bound `:aria-expanded` and `:aria-controls` on summary breakdown and `More` menu activator. Added `useCompactSaleDock` watcher setting `expandedBreakdown = true` on Desktop.

Pass 6.6 — Invoice Summary & Action Footer Redesign (Complete ✅).

Scope:

- **Redesigned Action Footer (`InvoiceActionButtons.vue`)**: Replaced the multi-colored button grid with a clean action bar: Primary `Pay` button (`Pay · formatMoney(...)`), direct secondary buttons (`Save & Clear`, `Drafts`), and `More` overflow dropdown menu.
- **Action Descriptor Architecture (`useInvoiceFooterActions.ts`)**: Created `useInvoiceFooterActions` composable returning `footerActions`, `directActions`, and `menuActions` descriptors dynamically filtered by POS Profile permissions.
- **POS Profile Permission Matrix**: Action visibility driven by `parseBooleanSetting` (`select-order`: `custom_allow_select_sales_order`, `return`: `posa_allow_return`, `print`: `posa_allow_print_draft_invoices`, `customer-display`: `posa_enable_customer_display`). `Cancel Sale` placed in danger section inside `More` menu.
- **Always-Visible Total & Summary (`InvoiceSummary.vue`)**: Guaranteed Total and Summary remain visible across Desktop (`>=1200px`), Tablet (`768-1199px`), and Mobile (`<=767px`) with expandable breakdown panel for compact viewports.
- **Automated Tests**: Created `tests/invoiceSummaryFooter.spec.ts` testing descriptor matrix, permission parsing, and additional discount rules.

Pass 6.5.5.2 — Final Invoice Items UI Capability Parity (Pass 6.5 Complete ✅).

Scope:

- **Centralized Capability Matrix Helper**: Created `getItemUiCapabilities()` in `useItemPermissions.ts` returning `editQty`, `editRate`, `editDiscount`, `changeUom`, `changePriceListRate`, `overrideItemName`, `removeItem`, `showAdditionalNotes`, and `showDeliveryDate`.
- **Unified Component Capabilities**: Integrated `getItemUiCapabilities()` across `InvoiceItemCard.vue` (Premium List), `CartItemRow.vue` (Classic Table), and `InvoiceItemDetailsDialog.vue`.
- **Premium List Inline Rate Editing Parity**: Added inline rate editing to `InvoiceItemCard.vue` using `capabilities.editRate`. Displays hover pencil icon on Desktop and opens numeric `<v-text-field>` on click/enter.
- **Double-Submit & Numeric Guarding**: `submitRateEdit` prevents double-submits (`isSubmittingRate`) and validates raw inputs (ignores empty, negative, NaN, or unchanged rate entries).
- **Details Dialog Style & Delivery Date Cleanup**: Conditioned Delivery Date section on `capabilities.showDeliveryDate`. Merged duplicate `.details-dialog__thumb` CSS blocks into a single 36x36px block. Removed duplicate `:prefix` on Price List Rate text field and computed `lineAmount` prioritizing `item.amount`.
- **Component & Capability Tests**: Expanded `tests/itemPermissions.spec.ts` and `tests/invoiceItemCard.spec.ts` testing capability matrix and rate editing logic.

Pass 6.5.5.1 — Guard Acceptance & Regression Cleanup.

Scope:

- **Qty Decimal Formatting Parity**: Restored `hideQtyDecimals` formatting contract in `CartItemRow.vue` (`formatFloat(item.qty, hideQtyDecimals ? 0 : undefined)`).
- **UOM Select Value Contract**: Restored `item-title="uom"` and `item-value="uom"` on `<v-select>` in `CartItemRow.vue` ensuring `submitUomEdit` receives string UOM names.
- **Details Dialog Image Resolver**: Updated `InvoiceItemDetailsDialog.vue` to use `resolveItemImage(item, catalogItem)`, error state `@error="imageFailed = true"`, and `object-fit: contain`. Passed `:catalog-item` from `itemMediaByCode` in `ItemsTable.vue`.
- **Boolean Setting Normalization**: Added `parseBooleanSetting` helper in `useItemPermissions.ts` to normalize `"0"`, `"1"`, `"false"`, `"true"`, `0`, `1`, `false`, and `true`.
- **Offer Action Button Guard**: `canToggleOffer` in `InvoiceItemDetailsDialog.vue` hides/disables offer actions on Return, Replacement, and Free Item lines.
- **Fixtures Verification**: Verified `POS Profile-posa_allow_price_list_rate_change` and `POS Profile-posa_allow_line_item_name_override` exist as complete JSON objects in `posawesome/fixtures/custom_field.json` and are listed under `fixtures` in `hooks.py`.

Pass 6.5.5 — POS Profile UI & Item Action Guard Audit.

Scope:

- **Centralized Item UI Permission Guards**: Created `useItemPermissions.ts` providing `isLockedPromotionLine`, `isPricingLocked`, `canEditRate`, `canEditItemDiscount`, `canChangePriceListRate`, `canOverrideItemName`, `canEditQty`, `canChangeUom`, and `canRemoveItem`.
- **Consistent Guarding across All Views**: Integrated `useItemPermissions` into `InvoiceItemCard.vue` (Premium List), `CartItemRow.vue` (Classic Table), and `InvoiceItemDetailsDialog.vue`.
- **Strict Upstream Parity**: Disallows Rate and Discount editing for Offer, Replacement, Offer Applied, and Return lines. Locks Qty, UOM, and Delete actions on promotional/replacement lines.
- **Restored Additional Notes UI**: Restored POS Profile-driven `item.posa_notes` section in `InvoiceItemDetailsDialog.vue` when `pos_profile.posa_display_additional_notes` is enabled (`1`/`true`).
- **Fixtures Audit**: Added `"POS Profile-posa_allow_price_list_rate_change"` and `"POS Profile-posa_allow_line_item_name_override"` to the `fixtures` Custom Field filter list in `hooks.py`.

Pass 6.5.4 — Product Media & Classic Table Column Contract Fix.

Scope:

- **Shared Product Image Resolver**: Created `itemImage.ts` (`resolveItemImage`, `normalizeItemImageUrl`) supporting `image`, `item_image`, `thumbnail`, `item_image_url`, `website_image`, `image_url`.
- **URL Normalization**: Normalizes relative `files/` and `private/files/` by prepending `/`, preserving absolute URLs (`http://`, `https://`, `data:`, `blob:`, `/`).
- **Image Presentation & Error Handling**: Updated `ItemCard.vue`, `InvoiceItemCard.vue`, and `CartItemRow.vue` to use `contain` (no cover cropping!) and package variant icon on image load failure.
- **Loaded Invoice Media Index**: Computed `itemMediaByCode` in `ItemsTable.vue` from `itemsStore.items` catalog cache to supply missing images on loaded Draft, Order, and Return rows without N+1 API calls.
- **Classic Table Selected Columns Contract**: Refactored `collapseOptional` in `useItemsTableResponsive.ts` to support tri-state (`boolean | "auto"`). On Desktop Table mode (`>= 1200px`), `collapseOptional` is set to `false`, guaranteeing user-selected columns stay visible even when cart container width is < 680px.
- **Internal Table Horizontal Scroll**: Calculated `--cart-table-min-width` from `finalVisibleColumns` and enabled internal horizontal scrolling in `.v-table__wrapper` without scrolling main workspace.

Pass 6.5.3 — Dual View Final Functional, Responsive and POS Profile Acceptance.

Scope:

- **Toolbar Contract**: Resolved columns button duplication. On wide toolbar (`table` view), renders `[ List | Table ] [ Columns ]` (No More button). On narrow toolbar (`table` view), renders `[ List | Table ] [ More -> Columns ]`. In `list` view, renders `[ List | Table ]` (No Columns, No More button). On Tablet/Mobile (< 1200px), renders only `[ Search ]`.
- **Single-Source Search**: Search filtering performed once in `ItemsTable.vue` via `filteredItems` and passed to both `InvoiceItemsListView` and `InvoiceItemsTableView`. Double-filtering removed from table view.
- **Viewport Guard vs Layout Mode**: Window width (`< 1200px`) forces `list` mode and hides view toggle. Container width (`< 620px`) controls card layout modes (`row`, `stacked`, `phone`).
- **Card Layout & Rate Visibility**: Direct grid mapping for `.invoice-item-card--row`, `--stacked`, and `--phone`. **Rate remains visible** across all layouts and responsive breakpoints.
- **Unified Money Formatter**: Created `useMoneyFormatter.ts` with `formatMoney` helper to prevent duplicate currency symbols and maintain proper RTL/LTR bidi alignment.
- **Line Amount Priority**: Prioritizes `item.amount` over `qty * rate` calculation.
- **POS Profile Matrix & Offers**: All POS Profile permissions respected (Name override, Rate edit, Discount edit, Price list rate change). Added `Apply Offer` / `Remove Offer` action button inside `InvoiceItemDetailsDialog.vue`.
- **Responsive Dialog / Sheet**: `InvoiceItemDetailsDialog.vue` becomes fullscreen on Mobile (`<= 767px`) with sticky header and footer.

## Current Pass

Pass 6.6 — Invoice Summary and Action Footer.

Scope:

- Redesign `InvoiceSummary.vue` and `InvoiceActionButtons.vue` into a modern compact POS footer.
- Clear out obsolete "Active Sale" headers and legacy grid layouts.

## Recently Completed

Pass 5.5 POS Vertical Space Acceptance Fix.

Scope:

- Desktop `showBottomDock === false` now forces `--bottom-safe-space: 0px`.
- POS workspace vertical padding is removed on desktop; only inline page gap remains.
- Bottom Dock safe spacing is applied only below `1200px`.
- `--pos-page-content-padding-top` is now `0px`.
- DefaultLayout main/page content now use a full-height flex contract with hidden outer overflow.
- No fixed Browse view stack, Offers/Coupons navigation, product scroll restoration, product column calculation, `RecycleScroller`, stores, APIs, or item actions changed.

Acceptance:

- `1200px+` desktop should have no white top gap between header and workspace.
- `1200px+` desktop should have no reserved bottom gap below workspace.
- `1199px`, tablet, and mobile should keep Bottom Dock safe space so the last product/cart row is not covered.

## Recently Completed

Pass 5.4 Browse View Stability & Adaptive Product Grid.

Scope:

- Browse, Offers, and Coupons now share a fixed view stack with equal space.
- Inactive browse views remain mounted without `display: none`, preserving product grid measurement.
- Returning from Offers/Coupons refreshes layout metrics after two animation frames and restores product scroll.
- Product card metrics are driven by measured `.items-card-container` width.
- Adaptive product grid targets: 1 column below 320px, 2 below 560px, 3 below 740px, 4 below 900px, 5 below 1100px, 6 at 1100px+ measured container width.
- `checkItemContainerOverflow` no longer writes stale inline `max-height`; height comes from the CSS grid/flex contract.
- No filtering, item actions, stores, APIs, props, emits, card/list state, or `RecycleScroller` behavior changed.

Acceptance:

- Offers/Coupons do not change Browse height when opened or closed.
- Back to Items preserves selected item group, search text, card/list view, price list, loaded items, and product scroll.
- Tablet full Browse view can use the whole products pane and is not capped by viewport-based column limits.
- Product grid does not leave large unused side gaps or create horizontal overflow.
- Visual acceptance still needs screenshots/checks at `1440px`, `1280px`, `1199px`, `1024px`, `768px`, `430px`, and `390px`.

POS Responsive Layout + Customer Region + Browse Subviews Acceptance Fix.

Scope:

- Desktop split view is now `>= 1200px` only.
- Tablet landscape, tablet portrait, and mobile use the existing `compactPanel` flow: Browse view OR Cart view, not products and cart side by side.
- Compact Cart view has a dedicated Back to products header while preserving the bottom dock flow.
- `Invoice.vue` uses explicit rows for Customer, Invoice command, Cart items, and Footer so Customer cannot be clipped by Invoice Items.
- Customer and Invoice command regions reserve their real height and use `overflow: visible`.
- Delivery Charges remain behaviorally unchanged, but the presentation can sit beside Customer on wide desktop and stack at tablet/mobile widths.
- Browse, Cart, and Summary bottom-dock safe spacing now follow the `1200px` compact breakpoint.
- No stores, APIs, calculations, actions, props, emits, filtering, virtualization, customer behavior, delivery charge logic, or payment behavior changed.

Acceptance:

- Customer selector, Add, and Actions are fully visible and do not overlap Invoice Items.
- Invoice Items begins after the Customer region with a consistent gap/border.
- `1440px` and `1280px` show Products + Cart side by side.
- `1024px`, `768px`, `430px`, and `390px` show Browse or Cart as a dedicated full panel.
- Returning from Cart keeps Browse state because the selector remains mounted with `v-show`.
- Cart footer respects the bottom dock safe area below `1200px`.
- RTL uses intentional Back arrow direction and keeps customer/cart regions intact.
- Follow-up acceptance cleanup removed floating labels from POS/cart search fields, removed duplicate native titles from Columns/subview Back tooltips, tightened Customer strip top spacing, and hid legacy Offers/Coupons inner titles/back buttons inside the modern Browse subview frame.

## Recently Completed

Pass 6.4.1 Cart Table Visual Acceptance Fix.

Scope:

- `ItemsTable.vue`: hid the visual `Action` column label while preserving the column and accessibility label.
- `items-table-styles.css`: made the no-data row span and center within the full cart table body area.
- Column contract, `CartItemRow.vue`, qty/delete behavior, responsive logic, stores, APIs, props, and emits remained unchanged.

## Recently Completed

Pass 6.4 Cart Item Row Premium Redesign and Column Contract Alignment.

Scope:

- `ItemsTable.vue`: presentation-only table layout, header density, compact empty state, and virtual row-height alignment.
- `items-table-styles.css`: unified CSS grid columns for header and rows via `--cart-table-columns`.
- `Invoice.vue`: only necessary cart-items region overflow guards.
- `CartItemRow.vue`: presentation-only row density, image/name/meta layout, compact Qty stepper, numeric alignment, delete/expand icon sizing.
- `useItemsTableResponsive.ts`: align presentation widths and mobile optional-column collapse with the row contract.
- No qty/delete/focus/pricing/tax/discount actions, stores, APIs, props, or emits changed.

## Recently Completed Browse Fix

Pass 5.3 POS Profile Compatibility and Browse Subview Navigation Fix.

Scope:

- `ItemsSelector.vue`: respects `posa_default_card_view` once per POS Profile and preserves user Card/List changes across same-profile refreshes.
- Offers/Coupons render as internal Browse subviews with Back to Items and Escape-to-items behavior while keeping Items mounted.

## Recently Completed Cart Work

Pass 6.2 Cart Header / Customer Region Density Refinement.

Scope:

- `Invoice.vue`: presentation-only heading/count refinements inside existing customer and command regions.
- `InvoiceCustomerSection.vue`: compact grid wrapper for the customer selector and optional invoice type selector.
- `Customer.vue`: compact selector with 44px add/action buttons while preserving search, create, edit/update, reload, and selection behavior.
- `InvoiceItemsActionToolbar.vue`: compact cart search with Columns and More icon controls; Columns remains available directly on larger screens and via More on mobile.
- Do not touch `ItemsTable`, `CartItemRow`, `InvoiceSummary`, `InvoiceActionButtons`, stores, APIs, calculations, taxes, discounts, or payment behavior.

## Completed Invoice Foundation

Pass 6.1 POS Invoice Panel Redesign: Cart Workspace Foundation.

Scope:

- `Invoice.vue` only.
- Convert the invoice panel into four named regions: customer, command, cart items, footer.
- Keep customer/payment/cart actions, props, emits, calculations, stores, APIs, and child component behavior unchanged.
- Move `InvoiceSummary` into the invoice footer region without redesigning its internal behavior.
- Move `InvoiceItemsActionToolbar` into the command region while `ItemsTable` owns the cart items region.

Acceptance:

- Customer region stays fixed.
- Invoice command region stays fixed.
- Cart items area receives the remaining height.
- Footer summary/actions stay fixed inside the invoice panel.
- No body scroll or outer invoice-card scroll on desktop.
- Compact/mobile cart panel respects bottom dock safe spacing.
- No changes to `CartItemRow`, `InvoiceSummary`, `InvoiceItemsActionToolbar`, or `InvoiceActionButtons` visuals except region-level overrides.

## Next Step

After Pass 6.5 visual acceptance:

1. Continue with Pass 6.6 Invoice Summary and Action Footer, presentation-only.
2. Then review payment dialogs and invoice management overlays against the same density tokens.
