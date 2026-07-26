# Payment Feature Parity & Capabilities Manifest

This document records the complete component inventory, POS Profile settings, cashier role permissions, and visibility rules for the POS Payment Screen.

## Mandatory Component Inventory

| Feature Component | Baseline File | Baseline Condition / Trigger | POS Profile Setting | Role / Permission | Invoice State | Section Destination | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PaymentSummary** | `PaymentSummary.vue` | Always rendered in payment shell | N/A | Cashier | All Invoices | Header Overview (Row 2) | Active ✅ |
| **PaymentMethods** | `PaymentMethods.vue` | Always rendered when methods loaded | `posa_allow_partial_payment` (validation only) | Cashier | All Invoices | Left Primary Column | Active ✅ |
| **PaymentGiftCardSection** | `PaymentGiftCardSection.vue` | Profile allows gift cards & not return | `posa_use_gift_cards` | `is_supervisor` for issue/topup | Non-return invoices | Left Primary Column | Active ✅ |
| **InvoiceTotals** | `InvoiceTotals.vue` | Always rendered in summary | N/A | Cashier | All Invoices | Right Secondary Column | Active ✅ |
| **PaymentRedemption** | `PaymentRedemption.vue` | Has loyalty points OR customer credit enabled | `use_customer_credit` / `posa_use_customer_credit` | Cashier | Non-return invoices with customer | Right Secondary Column (Redemption) | Active ✅ |
| **PaymentOptions** | `PaymentOptions.vue` | Any settlement feature enabled | `posa_allow_credit_sale`, `posa_allow_write_off_change`, `use_cashback`, `use_customer_credit` | Cashier | Returns / Credit Sales / Write-Offs | Right Secondary Column (Settlement Options) | Active ✅ |
| **PaymentCustomerCreditDetails** | `PaymentCustomerCreditDetails.vue` | Redeem customer credit active with sources | `use_customer_credit` / `posa_use_customer_credit` | Cashier | Non-return invoices | Right Secondary Column (Settlement Options) | Active ✅ |
| **PaymentAdditionalInfo** | `PaymentAdditionalInfo.vue` | Order fulfillment / return validity / notes / auth code | `posa_allow_sales_order`, `posa_enable_return_validity`, `posa_display_additional_notes`, `posa_display_authorization_code` | Cashier | Orders / Returns / Sales | Right Secondary Column (Order & Fulfillment) | Active ✅ |
| **PaymentPurchaseOrder** | `PaymentPurchaseOrder.vue` | Sales Order allow PO enabled | `posa_allow_customer_purchase_order` | Cashier | Order invoices | Right Secondary Column (Order & Fulfillment) | Active ✅ |
| **PaymentSelectionFields** | `PaymentSelectionFields.vue` | Sales Person OR Print Format allowed | `posa_allow_select_print_format_in_payments` | Cashier | All Invoices | Right Secondary Column (Sales & Receipt) | Active ✅ |
| **PaymentActionButtons** | `PaymentActionButtons.vue` | Always rendered in action footer | N/A | Cashier | All Invoices | Fixed Footer (Row 4) | Active ✅ |
| **PaymentDialogs** | `PaymentDialogs.vue` | Dialog events triggered | N/A | Cashier | Interactive | Dialog Overlays | Active ✅ |
| **GiftCardDialog** | `GiftCardDialog.vue` | Gift card action triggered | `posa_use_gift_cards` | `is_supervisor` for issue/topup | Interactive | Dialog Overlays | Active ✅ |
| **Mpesa-Payments** | `Mpesa-Payments.vue` | Mpesa payment method selected | M-Pesa Mode of Payment | Cashier | Interactive | Dialog Overlays | Active ✅ |
