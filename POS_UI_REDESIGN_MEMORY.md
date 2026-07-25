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

## Current Pass
Pass 6.4 Cart Item Row Premium Redesign and Column Contract Alignment.

Scope:
- `ItemsTable.vue`: presentation-only table layout, header density, compact empty state, and virtual row-height alignment.
- `items-table-styles.css`: unified CSS grid columns for header and rows via `--cart-table-columns`.
- `Invoice.vue`: only necessary cart-items region overflow guards.
- `CartItemRow.vue`: presentation-only row density, image/name/meta layout, compact Qty stepper, numeric alignment, delete/expand icon sizing.
- `useItemsTableResponsive.ts`: align presentation widths and mobile optional-column collapse with the row contract.
- Do not change qty/delete/focus/pricing/tax/discount actions, stores, APIs, props, or emits.

Acceptance:
- Table header height is about 42px.
- Header and row tracks share one grid column variable.
- Desktop contract uses flexible Name, practical Qty width, compact Rate/Amount, and 44px Delete.
- Qty no longer conflicts with its column width; the old 140px minimum is removed.
- Name column is flexible; numeric/action columns are constrained and use tabular numbers.
- Last action/expand columns are not cropped.
- No horizontal overflow inside the cart panel.
- Empty cart state is compact, centered, and has no large gradient.
- Vertical scrolling remains contained inside the invoice cart table area, not the page body.
- Mobile cart rows switch to a two-line presentation while preserving existing responsive column visibility logic.

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
After Pass 6.4 acceptance:
1. Commit Pass 6.3 + 6.4 together as the compact POS cart table and row foundation.
2. Continue with Pass 6.5 Invoice Summary and Action Footer, presentation-only.
