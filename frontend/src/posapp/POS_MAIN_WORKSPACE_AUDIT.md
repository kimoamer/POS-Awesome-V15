# POS Main Workspace Component & Action Audit

Authoritative source audit of all production workspace components, parent-child hierarchies, props, events, store bindings, API endpoints, POS Profile capability controls, and viewport behaviors across POSAwesome.

---

## Component Inventory Matrix

| Component Name | File Path | Parent Component | Child Components | Primary Stores | API Endpoints | Capability Controls | Desktop (1200px+) | Tablet (600-1199px) | Phone (0-599px) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Pos Shell** | `src/posapp/components/pos/shell/Pos.vue` | DefaultLayout.vue | ItemsSelector, Invoice, Payments, MpesaPayments, Variants | `invoiceStore`, `uiStore` | `get_pos_profile` | All capabilities | Side-by-side (Products + Cart) | Dedicated view via bottom dock | Dedicated view via bottom dock |
| **Navbar Header** | `src/posapp/components/Navbar.vue` | DefaultLayout.vue | ShiftStatus, Menu | `uiStore`, `employeeStore` | `logout`, `get_pos_shift` | `isSupervisor` | Full identity & status | Compact icons & menu | Title + status + menu |
| **Items Selector** | `src/posapp/components/pos/items/ItemsSelector.vue` | Pos.vue | ItemCard, ItemsSelectorCards, ItemsSelectorTable | `itemsStore`, `uiStore` | `get_items`, `get_item_groups` | `posa_use_item_groups`, `posa_display_items_in_stock` | Inline search + group chips | Responsive search + filter sheet | Sticky search + filter sheet |
| **Item Card** | `src/posapp/components/pos/items/ItemCard.vue` | ItemsSelectorCards.vue | Image, StockBadge, AddButton | `itemsStore` | N/A | `posa_display_items_in_stock`, `posa_allow_change_uom` | 40px target, compact card | 42px touch target | 44px touch target, full width |
| **Invoice Cart** | `src/posapp/components/pos/Invoice.vue` | Pos.vue | InvoiceCustomerSection, CartItemRow, InvoiceSummary | `invoiceStore`, `customersStore` | N/A | `posa_allow_discount_on_grand_total`, `posa_allow_coupon_code` | Right panel (36-42%) | Dedicated view | Dedicated view |
| **Cart Item Row** | `src/posapp/components/pos/invoice/CartItemRow.vue` | Invoice.vue | QtyInput, RateInput, DiscountModal | `invoiceStore` | N/A | `posa_allow_user_to_edit_rate`, `posa_allow_user_to_edit_discount` | Inline inputs (40px) | Inline inputs (42px) | Touch row + Menu (44px) |
| **Invoice Summary** | `src/posapp/components/pos/invoice/InvoiceSummary.vue` | Invoice.vue | PayButton, DiscountButton | `invoiceStore` | N/A | `posa_allow_discount_on_grand_total`, `actions.allowSubmit` | Fixed bottom footer | Sticky above bottom dock | Sticky above bottom dock |
| **Customer Section** | `src/posapp/components/pos/invoice/InvoiceCustomerSection.vue` | Invoice.vue | CustomerCard, AddressSummary | `customersStore`, `invoiceStore` | `get_customer_list`, `get_available_credit` | `use_customer_credit`, `posa_use_customer_credit` | Top Cart card | Top Cart card | Header customer strip |
| **Customer Selection Dialog** | `src/posapp/components/pos/customer/Customer.vue` | Pos.vue | CustomerList, SearchInput | `customersStore` | `get_customer_list` | `posa_allow_customer_creation` | Centered modal | Adaptive modal | Fullscreen sheet (100dvh) |

---

## Action Parity Table

| Action Name | Trigger Element | Component | Event / Store Method | Capability Gate | Viewport Adaption |
| --- | --- | --- | --- | --- | --- |
| **Item Search** | Search Input | ItemsSelector.vue | `itemsStore.searchItems(query)` | Always Allowed | Debounced text field across all viewports |
| **Barcode Scanning** | Listener / Input | ItemsSelector.vue | `eventBus.emit("scanned_barcode")` | Always Allowed | Global listener active across all viewports |
| **Item Group Filter** | Chip / Tab | ItemsSelector.vue | `itemsStore.setSelectedGroup(group)` | `posa_use_item_groups` | Horizontal scrolling chips (Desktop) / Sheet (Phone) |
| **Add Item to Cart** | Product Card click | ItemCard.vue | `invoiceStore.addItem(item)` | Always Allowed | Direct click / tap target |
| **Quantity Increment** | `+` Button | CartItemRow.vue | `invoiceStore.updateQty(item, qty + 1)` | Always Allowed | 40px (Desktop), 42px (Tablet), 44px (Phone) |
| **Quantity Decrement** | `-` Button | CartItemRow.vue | `invoiceStore.updateQty(item, qty - 1)` | Always Allowed | 40px (Desktop), 42px (Tablet), 44px (Phone) |
| **Remove Item** | Trash Icon | CartItemRow.vue | `invoiceStore.removeItem(item)` | Always Allowed | Action icon / swipe row |
| **Edit Item Rate** | Rate Input | CartItemRow.vue | `invoiceStore.updateItemRate(item, rate)` | `posa_allow_user_to_edit_rate` | Editable input field |
| **Edit Item Discount**| Discount Input | CartItemRow.vue | `invoiceStore.updateItemDiscount(item, discount)`| `posa_allow_user_to_edit_discount` | Editable input field / modal |
| **Clear Cart** | Clear Button | Invoice.vue | `invoiceStore.clear()` | Always Allowed | Header action button |
| **Select Customer** | Customer Card / Button | InvoiceCustomerSection.vue | `eventBus.emit("open_customer_dialog")` | Always Allowed | Card tap / modal trigger |
| **Create Customer** | Add Customer Button | Customer.vue | `open_new_customer_dialog()` | `posa_allow_customer_creation` | Modal trigger |
| **Open Payment** | Pay Button | InvoiceSummary.vue | `triggerInvoicePay()` | `actions.allowSubmit` | Primary CTA button |
| **Workspace Dock Switch**| Dock Button | Pos.vue | `setSelectorView(view)` | Always Allowed | Bottom dock (Tablet Portrait, Tablet Landscape & Phone) |
