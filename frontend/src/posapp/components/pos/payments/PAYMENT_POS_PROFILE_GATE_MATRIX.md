# Payment POS Profile Feature-Gate Matrix

This document defines the authoritative POS Profile capability matrix for all payment screen features, their data sources, section shells, request gates, submission invariants, and profile-switching cleanup rules.

## Matrix Summary

| # | Feature Key | Source Type | Canonical Field | Metadata Verified | Section Shell | Request Gate | Submission Invariant | Profile-Switch Cleanup |
|---|-------------|-------------|-----------------|-------------------|---------------|--------------|----------------------|------------------------|
| 1 | `immediateSettlement` | Invoice context | `invoiceDoc` + `isCashback` | N/A | Payment Methods | N/A | `is_cashback` mode enforced | N/A |
| 2 | `creditSale` | POS Profile | `posa_allow_credit_sale` | ✅ | Settlement Options | N/A | `is_credit_sale = false` if disabled | `is_credit_sale = false`, `credit_due_days = 0`, `new_credit_due_date = null` |
| 3 | `creditDueDate` | POS Profile | `posa_allow_credit_sale` | ✅ | Settlement Options | N/A | Ignored if `is_credit_sale = false` | Cleared with Credit Sale |
| 4 | `writeOff` | POS Profile | `posa_allow_write_off_change` | ✅ | Settlement Options | N/A | `is_write_off_change = false`, `write_off_amount = 0` | `is_write_off_change = false`, `write_off_amount = 0` |
| 5 | `cashback` | POS Profile | `use_cashback` | ✅ | Settlement Options | N/A | Ignored if `!allowCashback` | Recalculates `is_cashback` mode |
| 6 | `customerCredit` | POS Profile | `use_customer_credit` | ✅ | Settlement Options | `shouldLoadCustomerCredit()` | `redeem_customer_credit = false`, `redeemed_customer_credit = 0` | `redeem_customer_credit = false`, `redeemed_customer_credit = 0`, `customer_credit_dict = []` |
| 7 | `storeReturnAsCredit` | POS Profile | `use_customer_credit` | ✅ | Settlement Options | `shouldLoadCustomerCredit()` | `is_credit_return = false` if disabled | `is_credit_return = false` |
| 8 | `loyalty` | Customer context | Customer `loyalty_points > 0` | Standard ERPNext | Redemption | N/A | `loyalty_amount = 0` if disabled | `loyalty_amount = 0` |
| 9 | `giftCardRedeem` | POS Profile | `posa_use_gift_cards` | ✅ | Primary / Gift Card Section | `openGiftCardDialog` / `checkGiftCardBalance` | Unapplied redemption cleared | Dialog closed, redemption reset |
| 10 | `giftCardIssue` | POS Profile | `posa_use_gift_cards` | ✅ | Gift Card Dialog | Handler gated | Blocked if disabled | N/A |
| 11 | `giftCardTopUp` | POS Profile | `posa_use_gift_cards` | ✅ | Gift Card Dialog | Handler gated | Blocked if disabled | N/A |
| 12 | `salesOrder` | POS Profile | `posa_allow_sales_order` | ✅ | Order & Fulfillment | N/A | N/A | N/A |
| 13 | `deliveryDate` | POS Profile | `posa_allow_sales_order` | ✅ | Order & Fulfillment | N/A | Delivery validation skipped if disabled | N/A |
| 14 | `shippingAddress` | POS Profile | `posa_allow_sales_order` | ✅ | Order & Fulfillment | `shouldLoadAddresses()` | Address validation skipped if disabled | `addressesLoaded = false` |
| 15 | `returnValidity` | POS Profile / POS Settings | `posa_enable_return_validity` | ✅ | Order & Fulfillment | N/A | Validity date omitted if disabled | N/A |
| 16 | `additionalNotes` | POS Profile | `posa_display_additional_notes` | ✅ | Order & Fulfillment | N/A | Control hidden if disabled | N/A |
| 17 | `authorizationCode` | POS Profile | `posa_display_authorization_code` | ✅ | Order & Fulfillment | N/A | Control hidden if disabled | N/A |
| 18 | `customerPurchaseOrder` | POS Profile | `posa_allow_customer_purchase_order` | ✅ | Order & Fulfillment | N/A | Control hidden if disabled | N/A |
| 19 | `salesPerson` | Standard | Always available | Standard | Sales & Receipt | `shouldLoadSalesPersons()` | Default sales person used if disabled | `salesPersonsLoaded = false` |
| 20 | `printFormat` | POS Profile | `posa_allow_select_print_format_in_payments` | ✅ | Sales & Receipt | `shouldLoadPrintFormats()` | Default print format path used if disabled | `printFormatsLoaded = false` |
| 21 | `mpesaC2b` | Payment row | Row metadata `is_mpesa_c2b` | Standard | Payment Methods | Handler gated | Row action hidden if non-Mpesa | Dialog closed on mode change |
| 22 | `phonePaymentRequest` | POS Profile / Field | `request_for_payment` button field | Standard | Payment Methods | Handler gated | Action hidden if not configured | Dialog closed |
| 23 | `isSupervisor` | Cashier context | `currentCashier.is_supervisor` | Standard | Dialogs / Permissions | Handler gated | Gated in Gift Card Issue / Top-up | N/A |

## POS Profile Field Verification

All Check fields are evaluated via `parseBooleanSetting(val)`:
- `"0"`, `0`, `false`, `"false"`, `null`, `undefined` → **disabled**
- `"1"`, `1`, `true`, `"true"` → **enabled**

## Pre-Submission Invariant Guard

Before invoice submission, `assertPaymentFeatureInvariants()` is called to enforce:
1. `is_credit_sale = false` if Credit Sale capability is false.
2. `is_write_off_change = false` and `write_off_amount = 0` if Write Off capability is false.
3. `redeem_customer_credit = false` and `redeemed_customer_credit = 0` if Customer Credit capability is false.
4. `is_credit_return = false` if Store Return as Credit capability is false.
5. `loyalty_amount = 0` if Loyalty capability is false.
6. For return invoices where both Cashback and Store as Credit are disabled, both settlement modes are set to false to prevent hidden active modes.
