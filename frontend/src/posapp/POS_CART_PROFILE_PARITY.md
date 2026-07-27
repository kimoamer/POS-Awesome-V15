# POS Cart Profile Parity Audit

This document audits all 24 POS Profile settings, permissions, and controls for the POS Cart application to ensure zero feature regression, exact setting parity, and verified fallback behavior across Desktop, Tablet, and Mobile viewports.

## 1. Setting Resolver Fallback Rule

To prevent missing or `undefined` payload fields from incorrectly disabling legacy features, all boolean POS Profile settings must be resolved using this unified logic:

- Explicit `0`, `"0"`, `false`, `"false"`, `"off"`, `"no"` $\rightarrow$ **Disabled** (`false`)
- Explicit `1`, `"1"`, `true`, `"true"`, `"on"`, `"yes"` $\rightarrow$ **Enabled** (`true`)
- Missing or `undefined` or `null` $\rightarrow$ **Preserve verified legacy behavior** (default `true` for standard features).

---

## 2. Complete POS Profile Controls Parity Table

| # | Feature / Control | Controlling Field in POS Profile | Explicit Disabled Result | Explicit Enabled Result | Undefined Fallback | Phone Location | Tablet Location | Desktop Location | Handler | Test |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Additional Discount Amount | `posa_allow_user_to_edit_additional_discount` | Discount action locked | Discount dialog opens amount input | Enabled (`true`) | Command Bar $\rightarrow$ Discount | Checkout Summary | Invoice Summary Card | `handleAdditionalDiscountUpdate` | `posCartProfileSettings.spec.ts` |
| 2 | Additional Discount Percentage | `posa_use_percentage_discount` | Amount mode active | Percentage mode active | Amount mode (`false`) | Command Bar $\rightarrow$ Discount | Checkout Summary | Invoice Summary Card | `handleAdditionalDiscountPercentageUpdate` | `posCartProfileSettings.spec.ts` |
| 3 | Rate Edit | `posa_allow_user_to_edit_rate` | Rate field read-only | Rate field editable / dialog | Enabled (`true`) | Item Card Details / Edit | Cart Row Rate Cell | Cart Table Rate Cell | `change_price_list_rate` | `posCartItemMobileActions.spec.ts` |
| 4 | Item Discount | `posa_allow_user_to_edit_discount` | Discount field read-only | Discount field editable / dialog | Enabled (`true`) | Item Card Details / Edit | Cart Row Discount Cell | Cart Table Discount Cell | `update_discount_umount` | `posCartItemMobileActions.spec.ts` |
| 5 | UOM Change | `posa_allow_change_uom` | UOM chip read-only | UOM selector active | Enabled (`true`) | Item Card Meta / Edit | Cart Row UOM Cell | Cart Table UOM Cell | `calcUom` | `posCartItemMobileActions.spec.ts` |
| 6 | Warehouse Change | `posa_allow_change_warehouse` | Warehouse selector locked | Warehouse selector active | Enabled (`true`) | Item Card Details / Edit | Cart Row Details | Item Details Dialog | `set_warehouse` | `posCartItemMobileActions.spec.ts` |
| 7 | Batch Selection | `has_batch_no` | Batch badge read-only | Batch selector dialog active | Enabled if item has batch | Item Card Meta / Edit | Cart Row Batch Cell | Cart Table Batch Cell | `setBatchQty` | `posCartItemMobileActions.spec.ts` |
| 8 | Serial Selection | `has_serial_no` | Serial badge read-only | Serial selector dialog active | Enabled if item has serial | Item Card Meta / Edit | Cart Row Serial Cell | Cart Table Serial Cell | `setSerialNo` | `posCartItemMobileActions.spec.ts` |
| 9 | Item Note | `posa_allow_item_notes` | Note action hidden | Note action active | Enabled (`true`) | Item Card Actions $\rightarrow$ More | Cart Row More | Cart Table Actions | `set_item_note` | `posCartItemMobileActions.spec.ts` |
| 10 | Offer Action | `posa_allow_offers` | Offer action hidden | Offer action active | Enabled (`true`) | Item Card Actions $\rightarrow$ More | Cart Row More | Cart Table Actions | `toggleOffer` | `posCartItemMobileActions.spec.ts` |
| 11 | Delivery Charges | `posa_use_delivery_charges` | Delivery section hidden | Delivery section visible | Disabled (`false`) | Customer Section | Customer Section | Invoice Top Grid | `update_delivery_charges` | `posCartProfileSettings.spec.ts` |
| 12 | Posting Date | `posa_allow_change_posting_date` | Posting date card hidden | Posting date card visible | Disabled (`false`) | Header / Settings | Command Region | Command Region | `update_posting_date` | `posCartProfileSettings.spec.ts` |
| 13 | Price List Selection | `selected_price_list` | Default price list | Selected price list | System Default | Header / Settings | Command Region | Command Region | `update_price_list` | `posCartProfileSettings.spec.ts` |
| 14 | Multi-Currency | `posa_allow_multi_currency` | Multi-currency card hidden | Multi-currency card visible | Disabled (`false`) | Header / Settings | Command Region | Command Region | `update_currency` | `posCartProfileSettings.spec.ts` |
| 15 | Sales Order Actions | `posa_allow_sales_order` | Select Order menu item hidden | Select Order active in More | Enabled (`true`) | Command Bar $\rightarrow$ More | Checkout Summary | Invoice Action Buttons | `get_draft_orders` | `posMobileCartActionParity.spec.ts` |
| 16 | Save & Clear | `hasItems` condition | Save button disabled | Save button active | Enabled when cart has items | Command Bar $\rightarrow$ Save | Checkout Summary | Invoice Action Buttons | `save_and_clear_invoice` | `posMobileCartActionParity.spec.ts` |
| 17 | Drafts | `hasItems` / draft store | Drafts button active | Drafts drawer/modal active | Enabled (`true`) | Command Bar $\rightarrow$ Drafts | Checkout Summary | Invoice Action Buttons | `get_draft_invoices` | `posMobileCartActionParity.spec.ts` |
| 18 | Select Order | `posa_allow_sales_order` | Hidden in More menu | Visible in More menu | Enabled (`true`) | Command Bar $\rightarrow$ More | Checkout Summary | Invoice Action Buttons | `get_draft_orders` | `posMobileCartActionParity.spec.ts` |
| 19 | Invoice Management | Always available | Active in More menu | Active in More menu | Enabled (`true`) | Command Bar $\rightarrow$ More | Checkout Summary | Invoice Action Buttons | `open_invoice_management` | `posMobileCartActionParity.spec.ts` |
| 20 | Returns | `posa_allow_returns` | Hidden in More menu | Visible in More menu | Enabled (`true`) | Command Bar $\rightarrow$ More | Checkout Summary | Invoice Action Buttons | `open_returns` | `posMobileCartActionParity.spec.ts` |
| 21 | Print Draft | Always available | Active in More menu | Active in More menu | Enabled (`true`) | Command Bar $\rightarrow$ More | Checkout Summary | Invoice Action Buttons | `print_draft_invoice` | `posMobileCartActionParity.spec.ts` |
| 22 | Customer Display | `posa_allow_customer_display` | Hidden in More menu | Visible in More menu | Enabled (`true`) | Command Bar $\rightarrow$ More | Checkout Summary | Invoice Action Buttons | `handleOpenCustomerDisplayRequest` | `posMobileCartActionParity.spec.ts` |
| 23 | Cancel Sale | Always available | Active in More menu | Active in More menu | Enabled (`true`) | Command Bar $\rightarrow$ More | Checkout Summary | Invoice Action Buttons | `cancel_sale` | `posMobileCartActionParity.spec.ts` |
| 24 | Pay | `hasItems` condition | Pay CTA disabled | Pay CTA active in global dock | Enabled when cart has items | Global Nav Dock $\rightarrow$ Pay | Global Nav Dock $\rightarrow$ Pay | Invoice Action Buttons | `handleShowPaymentRequest` | `posMobileCartActionParity.spec.ts` |
