# POS Keyboard & Scanner Contract

Authoritative specification of keyboard shortcuts, focus traps, barcode scanning flow, and input safety guards across POSAwesome.

---

## Keyboard Shortcut Registry

| Shortcut Combo | Target Action | Controlling Component | Capability Guard | Focus Constraint |
| --- | --- | --- | --- | --- |
| `Ctrl + F` / `/` | Focus Item Search | ItemsSelector.vue | Always Allowed | Active only when no modal owns focus |
| `Ctrl + Shift + C` | Open Customer Selector | Pos.vue / Cart.vue | `customer.allowSelection` | Active only when no modal owns focus |
| `Ctrl + Enter` | Open Payment Screen | CartTotals.vue | `actions.allowSubmit` | Active when Cart has non-zero items |
| `Escape` | Close Dialog / Clear Search | Active Modal / Search | Always Allowed | Closes top-most dialog |
| `Ctrl + Shift + L` | Clear Cart | Cart.vue | Always Allowed | Active when Cart has items |

---

## Barcode Scanner Sequence & Guard Rules

1. **Input Interception**: Barcode scanners emit rapid keyboard events followed by an `Enter` key.
2. **Buffer Accumulation**: Scanner input is accumulated in a dedicated memory buffer without debouncing delay.
3. **Exact Lookup**: The accumulated string is queried against local item codes, barcodes, and alternative barcodes.
4. **Item Addition**:
   - If exact match found: Item added to active invoice immediately.
   - Buffer cleared.
   - Search input cleared and focus recovered.
5. **Double-Add Protection**: Duplicate scans within 250ms of the same barcode hash are debounced to prevent accidental double addition.
6. **Modal Guard**: When a modal or dialog owns focus (e.g., Customer creation form), scanner input is directed to active focused input elements and will not trigger background cart additions.
