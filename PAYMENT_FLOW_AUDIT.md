# PAYMENT_FLOW_AUDIT.md — Payment Flow Audit & Contract Freeze

> **Pass 6.7.0 — Payment Flow Audit and Contract Freeze**
> This audit documents the exact architecture, data flows, payment calculations, POS Profile configurations, Mode of Payment contracts, submission lifecycles, and return/refund mechanics of POS Awesome before beginning Pass 6.7 UI redesigns.

---

## 1. Entry Point & Flow Sequence

```text
User clicks Pay Button (InvoiceActionButtons.vue / InvoiceSummary.vue)
  ├── Emits @show-payment
  ├── Handles handleShowPaymentRequest in Invoice.vue
  ├── Calls invoiceItemMethods.show_payment() -> Dialogs.show_payment(context)
  │    ├── Validates customer selection (toast error if missing)
  │    ├── Validates cart item presence (toast error if missing)
  │    ├── Validates cart items via context.validate()
  │    ├── Ensures auto-batch selection if required
  │    ├── Processes transient refundable cap (posa_refundable_amount)
  │    ├── Calls process_invoice() / process_invoice_from_order() backend API
  │    ├── Reloads fresh invoice doc from backend (if online and name exists)
  │    ├── Applies selected currency & conversion rate
  │    ├── Normalizes return amounts (forces negative totals & item Qty/Amounts if return)
  │    ├── Initializes payment lines via initializePaymentLinesForDialog()
  │    ├── Sets viewport mode: Desktop Dialog (>=992px) vs Mobile Active View ("payment")
  │    └── Emits eventBus.emit("show_payment", "true") & eventBus.emit("send_invoice_doc_payment", invoice_doc)
  └── Payments.vue receives eventBus.on("send_invoice_doc_payment", doc)
       ├── Sets invoice_doc
       ├── Initializes payment amounts, credit, loyalty, gift cards
       └── Renders Payment Screen / Dialog
```

---

## 2. Payment Components & Hierarchy

| Component | File Path | Role |
| --- | --- | --- |
| **`Payments.vue`** | `src/posapp/components/pos/Payments.vue` | Root payment shell component supporting inline view & dialog mode. |
| **`PaymentSummary.vue`** | `src/posapp/components/pos/payments/PaymentSummary.vue` | Displays invoice totals, paid amount, remaining balance / change due. |
| **`PaymentMethods.vue`** | `src/posapp/components/pos/payments/PaymentMethods.vue` | Renders mode of payment rows, quick tender buttons, M-Pesa / Phone triggers. |
| **`PaymentGiftCardSection.vue`** | `src/posapp/components/pos/payments/PaymentGiftCardSection.vue` | Inline gift card redemption input & balance checker. |
| **`PaymentRedemption.vue`** | `src/posapp/components/pos/payments/PaymentRedemption.vue` | Customer loyalty points redemption & customer credit redemption controls. |
| **`InvoiceTotals.vue`** | `src/posapp/components/pos/payments/InvoiceTotals.vue` | Detailed breakdown of Grand Total, Taxes, Item Discounts, Additional Discounts. |
| **`PaymentAdditionalInfo.vue`** | `src/posapp/components/pos/payments/PaymentAdditionalInfo.vue` | Delivery date, return validity date, shipping address controls. |
| **`PaymentPurchaseOrder.vue`** | `src/posapp/components/pos/payments/PaymentPurchaseOrder.vue` | Purchase order number & PO date inputs (for Sales Order doctype). |
| **`PaymentOptions.vue`** | `src/posapp/components/pos/payments/PaymentOptions.vue` | Settlement options: Write-off, Credit Sale, Cash Back, Credit Return, Due Date presets. |
| **`PaymentCustomerCreditDetails.vue`** | `src/posapp/components/pos/payments/PaymentCustomerCreditDetails.vue` | Detailed table of available customer credit / advance notes. |
| **`PaymentSelectionFields.vue`** | `src/posapp/components/pos/payments/PaymentSelectionFields.vue` | Sales person picker & print format selector. |
| **`PaymentActionButtons.vue`** | `src/posapp/components/pos/payments/PaymentActionButtons.vue` | Complete/Submit, Complete & Print, Cancel/Back buttons. |
| **`PaymentDialogs.vue`** | `src/posapp/components/pos/payments/PaymentDialogs.vue` | Modal dialogs for custom credit days, phone payments, M-Pesa. |
| **`GiftCardDialog.vue`** | `src/posapp/components/pos/wallet/GiftCardDialog.vue` | Dedicated gift card management dialog (issue, top-up, redeem). |

---

## 3. Props & Emits Contract

### `Payments.vue`
- **Props**:
  - `dialogMode: boolean` (default: `false`) — switches shell styling for desktop modal dialog vs full page view.
- **Emits**:
  - Communicates with parent shell via Pinia stores (`uiStore`, `invoiceStore`, `customersStore`) and global `eventBus`.

### Subcomponent Props & Emits Summary
- **`PaymentSummary.vue`**:
  - Props: `invoice_doc`, `total_payments_display`, `diff_payment_display`, `diff_label`, `diff_payment`, `change_due`, `paid_change`, `credit_change`, `paid_change_rules`, `currencySymbol`, `formatCurrency`, `giftCardAppliedAmount`, `giftCardCode`.
  - Emits: `@show-paid-amount`, `@show-diff-payment`, `@show-paid-change`, `@update-credit-change`.
- **`PaymentMethods.vue`**:
  - Props: `payments`, `currency`, `isReturn`, `requestPaymentField`, `currencySymbol`, `formatCurrency`, `isNumber`, `getVisibleDenominations`, `isCashLikePayment`, `isMpesaC2bPayment`, `isGiftCardPayment`.
  - Emits: `@update-amount`, `@set-full-amount`, `@set-denomination`, `@mpesa-dialog`, `@request-payment`, `@set-rest-amount`, `@open-gift-card`.
- **`PaymentActionButtons.vue`**:
  - Props: `loading`, `validatePayment`, `highlightSubmit`, `compact`.
  - Emits: `@submit`, `@submit-and-print`, `@cancel`.

---

## 4. Stores & State Management

- **`useInvoiceStore()`**: Holds current `invoiceDoc`, `items`, `invoiceType` ("Invoice", "Order", "Quotation").
- **`useCustomersStore()`**: Holds `selectedCustomer`, `customerInfo`, loyalty point balances, and customer credit dictionaries.
- **`useUIStore()`**: Controls `activeView` ("invoice", "payment", etc.), `paymentDialogOpen`, `lastInvoice`, loading overlay freeze/unfreeze.
- **`useToastStore()`**: Displays user notifications and system alerts.
- **`useSyncStore()`**: Tracks offline status and pending queue counts.
- **`useEmployeeStore()`**: Holds `currentCashier` permissions and supervisor flags.

---

## 5. API Endpoints & Payloads

1. **Cart / Invoice Processing**:
   - Endpoint: `posawesome.posawesome.api.invoices.process_invoice` / `process_invoice_from_order`
   - Purpose: Validates items, calculates taxes/discounts, creates draft invoice on server.
2. **Stock Validation**:
   - Endpoint: `posawesome.posawesome.api.invoices.validate_cart_items`
   - Payload: `{ items: JSON.stringify(items), pos_profile: profile.name }`
3. **Invoice Submission**:
   - Endpoint: `posawesome.posawesome.api.invoices.submit_invoice`
   - Payload:
     ```ts
     {
       data: {
         total_change,
         paid_change,
         credit_change,
         is_credit_sale: 0 | 1,
         is_write_off_change: 0 | 1,
         write_off_amount,
         redeemed_customer_credit,
         customer_credit_dict,
         gift_card_redemptions,
         is_cashback: boolean
       },
       invoice: submissionDoc,
       invoice_type: "Invoice" | "Order" | "Quotation",
       pos_profile: profile.name
     }
     ```
4. **M-Pesa & Payment Requests**:
   - Endpoint: `posawesome.posawesome.api.m_pesa.get_mpesa_mode_of_payment`
   - Endpoint: `posawesome.posawesome.api.payments.create_payment_request`

---

## 6. Calculations & Math Contract

All payment calculations are centralized in `usePaymentCalculations.ts` and `paymentInitialization.ts`:

- **Total Payments**:
  $$\text{Total Payments} = \sum (\text{Payment Line Amounts}) + \text{Loyalty Amount} + \text{Redeemed Customer Credit} + \sum (\text{Gift Card Amounts})$$
- **Invoice Settlement Total**:
  $$\text{Settlement Total} = \begin{cases} \text{doc.grand\_total} & \text{if multi-currency and doc.currency} \neq \text{profile.currency} \\ \text{doc.rounded\_total} \parallel \text{doc.grand\_total} & \text{otherwise} \end{cases}$$
- **Difference Payment (`diff_payment`)**:
  $$\text{diff\_payment} = \text{Settlement Total} - \text{Total Payments}$$
  *(For returns: capped at $\le 0$; if diff $>0$ over-refunded, capped to $0$)*.
- **Change Due (`change_due`)**:
  $$\text{change\_due} = \max(\text{Total Payments} - \text{Settlement Total}, 0)$$
- **Effective Write-off Amount**:
  Capped by profile write-off limit field (`posa_max_write_off_amount` or `write_off_limit`).
- **Base Amount Conversion**:
  Uses `toCompanyCurrency(doc, amount)` for ERPNext multi-currency accounting.

> [!CAUTION]
> **Strict Rule**: The redesigned payment UI MUST display these exact calculated values without modifying sign conventions, precision rounding, or formulas.

---

## 7. POS Profile Settings Matrix

| Setting Field | Default | Type / Normalization | UI Control | Backend Enforced |
| --- | --- | --- | --- | --- |
| `posa_allow_credit_sale` | 0 | `parseBooleanSetting()` | Shows "Credit Sale" toggle in PaymentOptions | Yes |
| `posa_allow_partial_payment` | 1 | `parseBooleanSetting()` | Allows paid amount < invoice total | Yes |
| `posa_allow_write_off_change` | 0 | `parseBooleanSetting()` | Shows "Write-off" toggle | Yes |
| `posa_max_write_off_amount` | 0 | `flt()` | Caps write-off amount limit | Yes |
| `posa_use_customer_credit` | 0 | `parseBooleanSetting()` | Enables customer credit redemption section | Yes |
| `posa_allow_customer_credit_for_returns` | 0 | `parseBooleanSetting()` | Allows return refunds to be stored as credit note | Yes |
| `posa_use_gift_cards` | 0 | `parseBooleanSetting()` | Shows Gift Card redemption section | Yes |
| `posa_allow_select_print_format_in_payments` | 0 | `parseBooleanSetting()` | Shows print format selector | No |
| `posa_cash_mode_of_payment` | "Cash" | String | Identifies default cash payment method | Yes |
| `posa_allow_submissions_in_background_job` | 0 | `parseBooleanSetting()` | Asynchronous background invoice submission | Yes |

---

## 8. Mode of Payment Contract

Each payment line object in `doc.payments` follows:

```ts
export type PaymentLine = {
  mode_of_payment: string;
  amount: number;
  base_amount?: number;
  default?: number | boolean;
  type?: "Cash" | "Bank" | "General" | "Phone";
  account?: string;
  currency?: string;
  exchange_rate?: number;
  allow_in_returns?: number | boolean;
};
```

- **Default Method Allocation**:
  - Function `resolvePreferredPaymentLine()` selects method where `default === 1` or cash-like method.
  - Function `initializePaymentLinesForDialog()` fills 100% of settlement total into preferred line.
- **Manual Amount Change**:
  - Updating one line auto-rebalances or calculates difference (`diff_payment`).
  - Function `autoBalancePayments()` reduces larger non-edited payment lines when total exceeds invoice total.

---

## 9. Return & Refund Rules

- **Sign Conventions**:
  - Normal Invoice: Grand Total $> 0$, Payment Amounts $\ge 0$.
  - Return Invoice: Grand Total $< 0$, Payment Amounts $\le 0$.
- **Refund Cap Rule (`posa_refundable_amount`)**:
  - When returning against an existing invoice (`return_against`), maximum cash refund is capped at what was actually paid on the original invoice.
  - Excess return amount must be stored as Customer Credit Note.
- **Backend Guard Sync**:
  - `ensureReturnPaymentsAreNegative()` converts positive inputs to negative before submission.
  - `restoreReturnPayments()` restores positive numbers if submission fails and user returns to editing.

---

## 10. Customer Credit & Loyalty

- **Customer Credit**:
  - Available credit balance loaded via `customersStore` / backend API.
  - Redeeming credit reduces `diff_payment` and attaches `customer_credit_dict` array to submission.
- **Loyalty Program**:
  - Available points converted using `customerInfo.conversion_factor`.
  - Redeeming loyalty calculates `loyalty_amount` and `loyalty_points`.

---

## 11. Multi-Currency

- **Invoice Currency vs Company Currency**:
  - `doc.currency` holds transaction currency; `posProfile.currency` holds base currency.
  - Multi-currency mode uses `grand_total` directly without rounding total overrides.
  - Base amounts are calculated via `toCompanyCurrency(doc, amount)`.

---

## 12. Reference Fields Requirements

- **Payment Methods requiring reference**:
  - Bank / Cheque / Card methods may require `reference_no` and `reference_date`.
  - Phone / M-Pesa methods trigger custom payment request APIs.

---

## 13. Current Responsive State

- **Desktop (>=992px)**: Renders as centered dialog modal overlay (`payment-shell--dialog`, width 920px).
- **Tablet / Mobile (<992px)**: Renders as full view panel (`uiStore.setActiveView("payment")`).

---

## 14. Redesign-Safe Freeze Guarantees & Sub-Pass Architecture

To ensure 100% regression safety, the Payment Screen redesign will be executed in 4 controlled sub-passes:

1. **Pass 6.7.1 — Payment Screen Shell & Responsive Layout**: Modernize outer dialog shell, grid breakdown, and summary header without altering inputs or handlers.
2. **Pass 6.7.2 — Payment Methods & Amount Allocation**: Redesign payment method list, quick tender pills, and amount input controls.
3. **Pass 6.7.3 — Credit, Loyalty, References & Returns**: Redesign credit redemption, gift cards, return refund banners, and reference input fields.
4. **Pass 6.7.4 — Submission, Success & Regression Acceptance**: Redesign payment footer, submission loading states, success dialogs, and verify end-to-end flow.

---

## 15. Automated Contract Tests

The following contract tests have been created:
- `tests/paymentCalculationsContract.spec.ts`: Tests `usePaymentCalculations`, `diff_payment`, `change_due`, and return refund caps.
- `tests/paymentFlowContract.spec.ts`: Tests `initializePaymentLinesForDialog`, `applyPreferredPaymentAmount`, and `rebalancePreferredPaymentLine`.
- `tests/paymentProfileMatrix.spec.ts`: Tests `parseBooleanSetting` for all POS profile payment settings.
