# POS Profile Payment Feature Gate Matrix

This document defines the authoritative POS Profile feature gate matrix for the POSAwesome payment experience. Every feature setting is evaluated through `parseBooleanSetting()` where `0`, `"0"`, `false`, `"false"`, `null`, and `undefined` mean **disabled**, and `1`, `"1"`, `true`, and `"true"` mean **enabled**.

---

| Feature Name | Canonical POS Profile Setting Field | Fallback / Context Requirement | Visible Control & Section Shell | Request / API Gate | Profile-Change State Cleanup |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Credit Sale** | `posa_allow_credit_sale` | — | Switch in Settlement Options (`showCreditSale`) | — | Clears `is_credit_sale = false`, resets credit due days and date |
| **Write Off Change** | `posa_allow_write_off_change` | — | Switch in Settlement Options (`showWriteOff`) | — | Clears `is_write_off_change = false`, resets write-off amount to `0` |
| **Cashback** | `use_cashback` | Return Invoices only | Switch in Settlement Options (`showCashback`) | — | Resets cashback toggle defaults |
| **Use Customer Credit** | `use_customer_credit` / `posa_use_customer_credit` | Customer must be selected | Switch in Settlement & Credit Details (`showCustomerCreditRedemption`) | `loadCustomerCredit("preview")` gated | Sets `redeem_customer_credit = false`, `redeemed_customer_credit = 0`, clears `customer_credit_dict = []` |
| **Store Return as Credit** | `use_customer_credit` / `posa_use_customer_credit` | Return Invoice & Customer selected | Switch in Settlement Options (`showStoreAsCredit` / `showCreditReturn`) | — | Resets `is_credit_return = false` |
| **Gift Cards** | `posa_use_gift_cards` | Immediate settlement, Non-return invoice | Gift Card Section Shell & Dialog (`showGiftCards`) | Card lookup / issue / topup APIs gated | Closes `giftCardDialogOpen = false`, clears gift card redemptions |
| **Loyalty Redemption** | `posa_use_loyalty_points` (or Customer Points Eligibility) | Non-return invoice, positive points | Redemption Section Shell (`showLoyaltyRedemption`) | — | Resets `loyalty_amount = 0` |
| **Sales Order / Delivery Date** | `posa_allow_sales_order` | Invoice Type == 'Order' or delivery date set | Delivery Date Picker in Order Details (`showDeliveryDate`) | — | Resets delivery date selections if feature disabled |
| **Shipping Address** | `posa_allow_sales_order` | Delivery date set | Address Select in Order Details (`showShippingAddress`) | `loadAddresses()` gated | Clears `shipping_address_name = null` if delivery date or feature disabled |
| **Return Validity** | `posa_enable_return_validity` | Non-return invoice | Return Validity Picker (`showReturnValidity`) | — | Clears return validity date if feature disabled |
| **Additional Notes** | `posa_display_additional_notes` | — | Additional Notes field (`showAdditionalNotes`) | — | Clears notes input state if feature disabled |
| **Authorization Code** | `posa_display_authorization_code` | — | Auth Code field (`showAuthorizationCode`) | — | Clears auth code input state if feature disabled |
| **Customer Purchase Order** | `posa_allow_customer_purchase_order` | — | PO Number & Date fields (`showPurchaseOrder`) | — | Clears PO fields if feature disabled |
| **Sales Person Selector** | Standard field | `showSalesPerson` capability | Sales Person Select in Sales & Receipt (`showSalesPerson`) | `loadSalesPersons()` gated | Resets sales team array if feature disabled |
| **Print Format Selector** | `posa_allow_select_print_format_in_payments` | — | Print Format Select in Sales & Receipt (`showPrintFormat`) | `loadPrintFormats()` gated | Resets print format selection if feature disabled |

---
