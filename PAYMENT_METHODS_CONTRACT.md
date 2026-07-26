# PAYMENT METHODS CONTRACT (Pass 6.7.2 Audit)

This document freezes the functionality, events, arguments, mutations, and permissions contracts for Payment Methods in POSAwesome.

## 1. Function & Emission Inventory

### `visiblePaymentMethods`
- **Source**: Computed in `Payments.vue` from `invoiceDoc.payments`.
- **Filtering**: Returns payment lines allowed by current POS Profile and payment mode settings.
- **Contract**: Never alter array items order or filter logic in presentation components.

### `set_full_amount(payment, isReturn)`
- **Trigger**: Click `Set Remaining` / Primary Method Action button.
- **Emitted Event**: `set-full-amount`
- **Arguments**: `(payment: object, isReturn: boolean)`
- **Mutation**: Calculates unallocated remaining invoice amount and sets `payment.amount`.
- **Contract**: Argument order `(payment, isReturn)` MUST BE PRESERVED.

### `set_rest_amount(payment, isReturn)`
- **Trigger**: Focus on Amount text field (`@focus`).
- **Emitted Event**: `set-rest-amount`
- **Arguments**: `(payment: object, isReturn: boolean)`
- **Mutation**: Focus helper to set remaining balance if input is zero.
- **Contract**: Event name and argument order MUST BE PRESERVED.

### `setPaymentToDenomination(payment, amount)`
- **Trigger**: Click Denomination quick button (`50`, `100`, `200`, `500`, etc.).
- **Emitted Event**: `set-denomination`
- **Arguments**: `(payment: object, amount: number)`
- **Mutation**: Sets `payment.amount` to selected denomination value.
- **Contract**: Must pass exact numeric denomination value.

### `handlePaymentAmountChange(payment, amount)`
- **Trigger**: Input change on Amount field (`@change`).
- **Emitted Event**: `update-amount`
- **Arguments**: `(payment: object, amount: number | string)`
- **Mutation**: Validates numeric input and updates `payment.amount`.
- **Contract**: Preserves raw numeric input without inline currency formatting inside editable field.

### `isCashLikePayment(payment)`
- **Trigger**: Evaluated for denomination quick button rendering.
- **Contract**: Returns true if mode of payment is cash or cash-equivalent.

### `is_mpesa_c2b_payment(payment)` / `mpesa_c2b_dialog(payment)`
- **Trigger**: M-Pesa / Mobile C2B button click (`Get Payments`).
- **Emitted Event**: `mpesa-dialog`
- **Arguments**: `(payment: object)`
- **Contract**: Displays M-Pesa transaction query dialog.

### `isGiftCardPayment(payment)` / `openGiftCardDialog(payment)`
- **Trigger**: Gift Card method action (`Redeem / Scan`).
- **Emitted Event**: `open-gift-card`
- **Arguments**: `(payment: object)`
- **Contract**: Opens Gift Card scanner / redemption dialog. Readonly amount field.

### `request_payment(payment)` / `request_payment_field`
- **Trigger**: Click `Request Payment` for Phone mode payments.
- **Emitted Event**: `request-payment`
- **Arguments**: `(payment: object)`
- **Contract**: Triggers mobile push payment request API.

---

## 2. Emission Signature Matrix

| Event Name | Emitter | Payload | Receiver Handler in `Payments.vue` |
| :--- | :--- | :--- | :--- |
| `update-amount` | `PaymentMethods.vue` | `(payment, amount)` | `handlePaymentAmountChange` |
| `set-full-amount` | `PaymentMethods.vue` | `(payment)` | `set_full_amount` |
| `set-denomination` | `PaymentMethods.vue` | `(payment, denomination)` | `setPaymentToDenomination` |
| `mpesa-dialog` | `PaymentMethods.vue` | `(payment)` | `mpesa_c2b_dialog` |
| `request-payment` | `PaymentMethods.vue` | `(payment)` | `request_payment` |
| `set-rest-amount` | `PaymentMethods.vue` | `(payment)` | `set_rest_amount` |
| `open-gift-card` | `PaymentMethods.vue` | `(payment)` | `openGiftCardDialog` |
