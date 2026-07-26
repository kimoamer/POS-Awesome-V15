# Payment Secondary Flows & POSMate UI Contract

This document establishes the permanent inventory and layout contract for all secondary payment sections, customer balances, loyalty, Gift Cards, order fulfillment, receipt options, and responsive dialogs in POSAwesome.

## 1. Feature & Permission Inventory

| Component | Feature / Control | POS Profile Condition | Permissions | Event / Emit | Responsive Destination |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `InvoiceTotals.vue` | Net Total, Taxes, Discounts | Always | Cashier | N/A | Summary List |
| `InvoiceTotals.vue` | Grand Total | Always | Cashier | N/A | Summary List & Collapsed Header Meta |
| `PaymentOptions.vue` | Credit Sale | `posa_allow_credit_sale` | Cashier | `update-credit-sale` | Settlement Row + Switch |
| `PaymentOptions.vue` | Credit Due Date | Credit Sale Enabled | Cashier | `update:credit-due-date` | Date Picker |
| `PaymentOptions.vue` | Write Off Difference | `posa_allow_write_off_change` | Cashier / Supervisor | `toggle-write-off` | Settlement Row + Switch |
| `PaymentOptions.vue` | Cashback | `posa_allow_cashback` | Cashier | `toggle-cashback` | Settlement Row + Switch |
| `PaymentCustomerCreditDetails.vue` | Use Customer Balance | `posa_allow_customer_credit` | Cashier | `toggle-customer-credit` | Settlement Row / Balance Block |
| `PaymentCustomerCreditDetails.vue` | Store Return as Credit | `is_return` active | Cashier | `toggle-return-credit` | Refund Option Row |
| `PaymentRedemption.vue` | Loyalty Points Redeem | Customer Eligible | Cashier | `redeem-loyalty` | Loyalty Section |
| `PaymentGiftCardSection.vue` | Gift Card Redeem | Always | Cashier | `open-gift-card`, `redeem-card` | Gift Card Section |
| `GiftCardDialog.vue` | Issue / Top-Up Gift Card | Always | Supervisor Only | `issue-card`, `topup-card` | Section Menu / Dialog |
| `PaymentAdditionalInfo.vue` | Delivery Date | `posa_allow_sales_order` | Cashier | `update:newDeliveryDate` | Fulfillment Grid |
| `PaymentAdditionalInfo.vue` | Return Valid Until | `posa_enable_return_validity` | Cashier | `update:returnValidUptoDate` | Fulfillment Grid |
| `PaymentAdditionalInfo.vue` | Shipping Address | Delivery Date Set | Cashier | `new-address` | Fulfillment Grid |
| `PaymentAdditionalInfo.vue` | Additional Notes | `posa_display_additional_notes` | Cashier | N/A | Textarea |
| `PaymentAdditionalInfo.vue` | Authorization Code | `posa_display_authorization_code` | Cashier | N/A | Text Field |
| `PaymentPurchaseOrder.vue` | Customer PO & Date | `posa_allow_customer_purchase_order` | Cashier | `update:newPoDate` | Fulfillment Grid |
| `PaymentSelectionFields.vue` | Sales Person | Always | Cashier | `update:sales-person` | Sales & Receipt Section |
| `PaymentSelectionFields.vue` | Print Format | `posa_allow_select_print_format_in_payments` | Cashier | `update:print-format` | Sales & Receipt Section |
| `Mpesa-Payments.vue` | M-Pesa Request / Fetch | `posa_allow_mpesa_payment` | Cashier | `request-payment`, `mpesa-dialog` | M-Pesa Dialog |

---

## 2. Preserved Events Contract

All of the following 10 core payment events and secondary events MUST be preserved with exact payload structure:

- `update-amount(payment, amount)`
- `set-full-amount(payment, isReturn)`
- `set-rest-amount(payment, isReturn)`
- `set-denomination(amount)`
- `mpesa-dialog`
- `request-payment(phone, amount)`
- `open-gift-card`
- `cancel`
- `submit`
- `submit-and-print`

---

## 3. Responsive Section Expansion Matrix

| Viewport Mode | Invoice Summary | Settlement Options | Loyalty | Gift Card | Order & Fulfillment | Sales & Receipt |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop** (`>=1200px`) | Expanded | Expanded | Expanded | Expanded | Collapsed | Collapsed |
| **Tablet Landscape** (`900–1199px`) | Expanded | Expanded | Collapsed | Expanded | Collapsed | Collapsed |
| **Tablet Portrait** (`600–899px`) | Expanded | Collapsed | Collapsed | Collapsed | Collapsed | Collapsed |
| **Phone** (`<600px`) | Collapsed (with Grand Total) | Collapsed | Collapsed | Collapsed | Collapsed | Collapsed |

---

## 4. Spacing, Typography & Color Tokens

- Space tokens: `--payment-space-1` (4px), `--payment-space-2` (8px), `--payment-space-3` (12px), `--payment-space-4` (16px).
- Font hierarchy: Caption `10–11px`, Label `11–12px`, Body/Input `13px`, Section `13–14px`, Title `17px`, Money `18–22px`.
- Controls height: Desktop `40px`, Tablet `42px`, Phone `44px`.
- RTL support: Logical CSS properties `padding-inline`, `margin-inline`, `text-align: start`, `<bdi>` wrapper for monetary amounts.
