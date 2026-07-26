# POSMate Payment Secondary Flows & Business Contract

This document is the authoritative reference for all secondary payment flows, POS Profile permissions, event signatures, and responsive layouts in POSAwesome.

## 1. POS Profile Canonical Setting Names

All boolean profile flags MUST be checked using `parseBooleanSetting(profileSetting)`. String `"0"` or `"false"` MUST evaluate to `false`.

| Feature | Canonical POS Profile Setting | Secondary / Fallback Setting |
| :--- | :--- | :--- |
| **Credit Sale** | `posa_allow_credit_sale` | N/A |
| **Write Off Difference** | `posa_allow_write_off_change` | N/A |
| **Cashback** | `use_cashback` | `posa_allow_cashback` |
| **Customer Credit** | `use_customer_credit` | `posa_use_customer_credit` |
| **Loyalty Points** | Customer eligibility / `loyalty_program` | N/A |
| **Gift Cards** | `posa_allow_gift_cards` | N/A |
| **Sales Order / Delivery Date** | `posa_allow_sales_order` | N/A |
| **Return Validity** | `posa_enable_return_validity` | N/A |
| **Additional Notes** | `posa_display_additional_notes` | N/A |
| **Authorization Code** | `posa_display_authorization_code` | N/A |
| **Customer Purchase Order** | `posa_allow_customer_purchase_order` | N/A |
| **Print Format Selection** | `posa_allow_select_print_format_in_payments` | N/A |
| **M-Pesa Payment** | `posa_allow_mpesa_payment` | N/A |

---

## 2. Mandatory Core Event Signatures & Payloads

The following 10 core payment events MUST preserve their exact names, argument order, and payload structure:

1. `update-amount(payment, amount)`
2. `set-full-amount(payment, isReturn)`
3. `set-rest-amount(payment, isReturn)`
4. `set-denomination(payment, denomination)`
5. `mpesa-dialog(payment)`
6. `request-payment(payment)`
7. `open-gift-card(payment)`
8. `cancel()`
9. `submit()`
10. `submit-and-print()`

---

## 3. Secondary Flow Emits & Component Contracts

| Component | Event Name | Argument Order & Payload |
| :--- | :--- | :--- |
| `PaymentOptions.vue` | `update:isCreditSale` | `(value: boolean)` |
| `PaymentOptions.vue` | `update:isWriteOffChange` | `(value: boolean)` |
| `PaymentOptions.vue` | `update:isCashback` | `(value: boolean)` |
| `PaymentOptions.vue` | `update:isCreditReturn` | `(value: boolean)` |
| `PaymentOptions.vue` | `update:newCreditDueDate` | `(value: string)` |
| `PaymentOptions.vue` | `update:creditDueDays` | `(days: number)` |
| `PaymentOptions.vue` | `update:writeOffAmount` | `(amount: number)` |
| `PaymentOptions.vue` | `update:redeemCustomerCredit` | `(value: boolean)` |
| `PaymentOptions.vue` | `get-available-credit` | `(val: boolean)` |
| `PaymentCustomerCreditDetails.vue` | `set-formatted-currency` | `{ target, field, value }` |
| `PaymentRedemption.vue` | `set-formatted-currency` | `{ field, value }` |
| `PaymentGiftCardSection.vue` | `toggle`, `check-balance`, `apply`, `clear` | `()` |
| `GiftCardDialog.vue` | `set-mode`, `check-balance`, `apply-redemption`, `issue-card`, `top-up-card` | `()` / `(mode)` |
| `PaymentAdditionalInfo.vue` | `update:newDeliveryDate`, `update:returnValidUptoDate`, `new-address` | `(val)` / `()` |
| `PaymentPurchaseOrder.vue` | `update:newPoDate` | `(val)` |
| `PaymentSelectionFields.vue` | `update:sales-person`, `update:print-format` | `(val)` |

---

## 4. Responsive Layout & Expansion Matrix

| Viewport Mode | Invoice Summary | Settlement Options | Loyalty | Gift Card | Order & Fulfillment | Sales & Receipt |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Desktop** (`>=1200px`) | Expanded | Expanded | Expanded | Expanded | Collapsed | Collapsed |
| **Tablet Landscape** (`900–1199px`) | Expanded | Expanded | Collapsed | Expanded | Collapsed | Collapsed |
| **Tablet Portrait** (`600–899px`) | Expanded | Collapsed | Collapsed | Collapsed | Collapsed | Collapsed |
| **Phone** (`<600px`) | Collapsed (with Grand Total) | Collapsed | Collapsed | Collapsed | Collapsed | Collapsed |

Default expansion matrix is applied ONCE on payment screen entry; user toggles are preserved and component state is kept intact via `v-show`.
