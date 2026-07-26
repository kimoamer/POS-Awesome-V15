# POS Event & Payload Contract

Authoritative contract of all event bus signals, payload schemas, feature capability guards, permission checks, offline conditions, and cleanup handlers across POSAwesome.

---

## Event Bus Registry

| Event Name | Emitter Component | Listener Component | Payload Schema | Feature Capability Gate | Permission Gate | Invoice Condition | Profile Condition | Offline Condition | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `set_mpesa_payment` | MpesaPayments | Payments | `{ mode: string, amount: number, reference: string }` | `capabilities.showPaymentMethods` | Active Cashier | `!is_return` | Profile has M-Pesa row | Queue payment if offline | `paymentRowCapabilities.spec.ts` |
| `clear_invoice` | Navbar / Pos | Payments, Cart, Customer | None | Always active | Active Cashier | Any | Any | Clears active cart | `invoiceStore.spec.ts` |
| `register_pos_profile` | BootController | Payments, Cart, Items | `{ profile: object, settings: object }` | Always active | Logged in user | Any | Profile loaded | Store profile snapshot | `posProfileFullLifecycle.spec.ts` |
| `send_invoice_doc_payment` | Payments | Pos, Outbox | `{ doc: object, print: boolean }` | `capabilities.allowSubmit` | Active Cashier | Valid totals | Active profile | Save to outbox if offline | `usePaymentSubmission.spec.ts` |
| `focus_item_search` | Shortcut / Navbar | ItemSelector | None | `capabilities.products.allowSearch` | Active Cashier | Any | Any | Focus input | `itemSearchFocusClearGuard.spec.ts` |
| `scanned_barcode` | BarcodeListener | ItemSelector, Cart | `{ barcode: string }` | `capabilities.products.allowBarcode` | Active Cashier | Any | Any | Search local index | `posBarcodeFlow.spec.ts` |
| `update_customer` | CustomerSelection | Payments, Invoice | `{ customer: string, customer_info: object }` | `capabilities.customer.allowSelection` | Active Cashier | Any | Any | Load cached customer | `posCustomerFlow.spec.ts` |
| `queue_submit_payment_shortcut` | KeyboardShortcut | Payments | `{ print: boolean }` | `capabilities.actions.allowSubmit` | Active Cashier | Valid return config | Active profile | Blocked if misconfigured | `posKeyboardWorkflow.spec.ts` |
| `submit_payment_shortcut` | KeyboardShortcut | Payments | `{ print: boolean }` | `capabilities.actions.allowSubmit` | Active Cashier | Valid return config | Active profile | Blocked if misconfigured | `posKeyboardWorkflow.spec.ts` |
| `invoice_submission_failed` | Payments | Pos, Toast | `{ invoice: string, reason: string }` | Always active | Active Cashier | Any | Any | Toast error | `usePaymentSubmission.spec.ts` |

---

## Event Payload Contracts

### 1. `set_mpesa_payment`
```json
{
  "mode_of_payment": "M-Pesa",
  "amount": 150.00,
  "mpesa_receipt_number": "QFH892K11",
  "account": "M-Pesa - C",
  "phone_number": "254712345678"
}
```
**Guard Rules**: Execution halts immediately if `!capabilities.showPaymentMethods.value`.

---

### 2. `register_pos_profile`
```json
{
  "name": "Main POS Profile",
  "company": "Company Inc",
  "use_cashback": 1,
  "use_customer_credit": 1,
  "posa_use_gift_cards": 1,
  "payments": [
    { "mode_of_payment": "Cash", "type": "Cash", "default": 1 },
    { "mode_of_payment": "M-Pesa", "is_mpesa_c2b": 1 }
  ]
}
```
**Guard Rules**: Profile payload must undergo strict boolean parsing (`parseBooleanSetting`) before assigning capabilities.

---

### 3. `submit_payment_shortcut`
```json
{
  "print": true,
  "paymentReceived": false
}
```
**Guard Rules**: Shortcut execution is rejected if `returnSettlementConfigurationError` is truthy or if submission is already in flight.
