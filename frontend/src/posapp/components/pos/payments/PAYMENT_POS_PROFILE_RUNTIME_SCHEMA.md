# POS Profile Payment Runtime Schema

Verified against `posawesome/fixtures/custom_field.json`.

## Confirmed POS Profile Custom Fields (Payment-Relevant)

| # | Fieldname | Label | Fieldtype | DocType | Fixture Line | Runtime Key |
|---|-----------|-------|-----------|---------|-------------|-------------|
| 1 | `posa_allow_credit_sale` | Allow Credit Sale | Check | POS Profile | 1792 | `pos_profile.posa_allow_credit_sale` |
| 2 | `posa_allow_write_off_change` | Allow Write Off Change | Check | POS Profile | 3807 | `pos_profile.posa_allow_write_off_change` |
| 3 | `use_cashback` | Use Cashback | Check | POS Profile | 1954 | `pos_profile.use_cashback` |
| 4 | `use_customer_credit` | Use Customer Credit | Check | POS Profile | 2008 | `pos_profile.use_customer_credit` |
| 5 | `posa_use_gift_cards` | Use Gift Cards | Check | POS Profile | 8421 | `pos_profile.posa_use_gift_cards` |
| 6 | `posa_allow_sales_order` | Allow Sales Order | Check | POS Profile | 2406 | `pos_profile.posa_allow_sales_order` |
| 7 | `posa_enable_return_validity` | Enable Return Validity | Check | POS Profile + POS Settings | 8093 / 7985 | `pos_profile.posa_enable_return_validity` or `pos_settings.posa_enable_return_validity` |
| 8 | `posa_display_additional_notes` | Display Additional Notes | Check | POS Profile | 3699 | `pos_profile.posa_display_additional_notes` |
| 9 | `posa_display_authorization_code` | Display Authorization Code | Check | POS Profile | 6905 | `pos_profile.posa_display_authorization_code` |
| 10 | `posa_allow_customer_purchase_order` | Allow Customer Purchase Order | Check | POS Profile | 3159 | `pos_profile.posa_allow_customer_purchase_order` |
| 11 | `posa_allow_select_print_format_in_payments` | Allow Select Print Format in Payments | Check | POS Profile | 199 | `pos_profile.posa_allow_select_print_format_in_payments` |

## Fields NOT in POS Profile Fixture

| Feature | Guessed Fieldname | Status | Actual Control Source |
|---------|-------------------|--------|---------------------|
| Loyalty Points | `posa_use_loyalty_points` | ❌ Does NOT exist | ERPNext Loyalty Program + Customer eligibility (`customer_info.loyalty_points > 0`) |
| Sales Person | `posa_allow_sales_person` | ❌ Does NOT exist | Always available (standard ERPNext field) |
| M-Pesa C2B | — | — | Controlled by payment row metadata (`is_mpesa_c2b`) |
| Phone Payment Request | — | — | Controlled by `request_for_payment` button in `invoice_fields` |

## Boolean Parsing Rule

All Check fields use `parseBooleanSetting()`:
- `"0"`, `0`, `false`, `"false"`, `null`, `undefined` → **disabled**
- `"1"`, `1`, `true`, `"true"` → **enabled**

## Legacy Fallback

| Canonical Field | Legacy Fallback | Reason |
|----------------|-----------------|--------|
| `use_customer_credit` | `posa_use_customer_credit` | Some older deployments may use the prefixed variant |

No other fallbacks are required. All other fields have a single canonical name.
