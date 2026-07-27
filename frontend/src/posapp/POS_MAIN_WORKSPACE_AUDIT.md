# POS Main Workspace Component & Action Audit

Authoritative source audit of all production workspace components, parent-child hierarchies, props, events, store bindings, API endpoints, POS Profile capability controls, and viewport behaviors across POSAwesome.

---

## Component Inventory Matrix

| Component Name | File Path | Parent Component | Child Components | Primary Stores | API Endpoints | Capability Controls | Desktop (1200px+) | Tablet (600-1199px) | Phone (0-599px) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Pos Root Shell** | `src/posapp/components/pos/Pos.vue` | Main App | Header, ItemsSelector, Cart, Payments, CustomerDialog | `invoiceStore`, `uiStore`, `customersStore` | `get_items`, `get_customer_list` | All capabilities | Side-by-side (Products + Cart) | Split (Landscape) / Dock (Portrait) | Bottom Dock (Browse / Cart) |
| **Navbar Header** | `src/posapp/components/Navbar.vue` | Pos.vue | NavbarMenu, ShiftStatus, UserAvatar | `uiStore`, `employeeStore`, `syncStore` | `logout`, `get_pos_shift` | `isSupervisor` | Full actions & status | Compact icons & menu | Title + More Menu |
| **Product Browser Toolbar** | `src/posapp/components/pos/ItemsSelector.vue` | Pos.vue | ItemCard, ItemGroupChips, SearchInput | `itemsStore`, `uiStore` | `get_items`, `get_item_groups` | `products.allowItemGroups`, `products.allowStockDisplay` | Inline search + group chips | Responsive search + filter sheet | Sticky search + filter modal |
| **Product Card** | `src/posapp/components/pos/items/ItemCard.vue` | ItemsSelector.vue | Image, Badge, AddButton | `itemsStore` | N/A | `products.allowStockDisplay`, `products.allowAlternateUom` | 40px target, compact card | 42px touch target | 44px touch target, full width |
| **Cart Workspace** | `src/posapp/components/pos/Cart.vue` | Pos.vue | CartItemRow, CartTotals, CustomerSummary | `invoiceStore`, `customersStore` | N/A | `cart.allowOrderDiscount`, `cart.allowCoupon` | Right panel (36-42%) | Right panel / Dedicated tab | Dedicated Cart tab |
| **Cart Item Row** | `src/posapp/components/pos/cart/CartItemRow.vue` | Cart.vue | QtyInput, DiscountModal, BatchModal | `invoiceStore` | N/A | `products.allowRateChange`, `products.allowDiscount` | Inline inputs (40px) | Inline inputs (42px) | Touch row + Menu (44px) |
| **Cart Totals & Footer** | `src/posapp/components/pos/cart/CartTotals.vue` | Cart.vue | PayButton, DiscountButton | `invoiceStore` | N/A | `cart.allowOrderDiscount`, `actions.allowSubmit` | Fixed bottom footer | Fixed bottom footer | Sticky above bottom dock |
| **Customer Hub** | `src/posapp/components/pos/customer/CustomerSummary.vue` | Cart.vue | CustomerCard, AddressSummary | `customersStore`, `invoiceStore` | `get_customer_list`, `get_available_credit` | `customer.allowCredit`, `customer.allowLoyalty` | Integrated top Cart card | Compact customer row | Header customer strip |
| **Customer Selection Dialog** | `src/posapp/components/pos/customer/CustomerSelectionDialog.vue` | Pos.vue | CustomerList, SearchInput | `customersStore` | `get_customer_list` | `customer.allowCreate`, `customer.allowEdit` | Centered modal (600px) | Adaptive modal | Fullscreen sheet (100dvh) |

---

## Action Parity Table

Every action currently available in POSAwesome is documented below to ensure 100% action preservation during Pass 6.9:

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
| **Clear Cart** | Clear Button | Cart.vue | `invoiceStore.clear()` | Always Allowed | Header action button |
| **Select Customer** | Customer Card / Button | CustomerSummary.vue | `open_customer_dialog()` | Always Allowed | Card tap / modal trigger |
| **Create Customer** | Add Customer Button | CustomerSelectionDialog | `open_new_customer_dialog()` | `posa_allow_customer_creation` | Modal trigger |
| **Open Payment** | Pay Button | CartTotals.vue | `open_payment()` | `actions.allowSubmit` | Primary CTA button |
| **Workspace Dock Switch**| Dock Button | Pos.vue | `uiStore.setActiveWorkspaceView(view)` | Always Allowed | Bottom dock (Tablet Portrait & Phone) |
