<template>
	<v-dialog
		v-model="isOpen"
		persistent
		max-width="920"
		:fullscreen="$vuetify.display.smAndDown"
		class="opening-dialog-overlay"
		transition="dialog-bottom-transition"
	>
		<v-card class="opening-dialog-card" elevation="16">
			<header class="opening-dialog-header">
				<div class="opening-dialog-header__identity">
					<div class="opening-dialog-header__icon" aria-hidden="true">
						<v-icon size="26">mdi-store-clock-outline</v-icon>
					</div>
					<div class="opening-dialog-header__copy">
						<span class="opening-dialog-eyebrow">{{ __("Register setup") }}</span>
						<h1>{{ __("Open a new POS shift") }}</h1>
						<p>{{ __("Select the register context and confirm each opening balance.") }}</p>
					</div>
				</div>

				<div class="opening-dialog-header__status" aria-live="polite">
					<span class="opening-dialog-status-dot" aria-hidden="true"></span>
					<span>{{ __("Ready for opening") }}</span>
				</div>
			</header>

			<v-card-text class="opening-dialog-content">
				<v-alert
					v-if="error_message"
					type="error"
					variant="tonal"
					density="compact"
					closable
					class="opening-dialog-alert"
					@click:close="error_message = ''"
				>
					{{ error_message }}
				</v-alert>

				<section class="opening-register-context" :aria-label="__('Register context')">
					<div class="opening-register-context__fields">
						<div class="opening-field-group">
							<label class="opening-field-label" for="opening-company">
								{{ __("Company") }}
							</label>
							<v-autocomplete
								id="opening-company"
								v-model="company"
								:items="companies"
								:placeholder="__('Select company')"
								required
								variant="outlined"
								density="comfortable"
								prepend-inner-icon="mdi-domain"
								hide-details
								class="opening-context-field"
							/>
						</div>

						<div class="opening-field-group">
							<label class="opening-field-label" for="opening-profile">
								{{ __("POS Profile") }}
							</label>
							<v-autocomplete
								id="opening-profile"
								v-model="pos_profile"
								:items="pos_profiles"
								:placeholder="__('Select POS profile')"
								required
								variant="outlined"
								density="comfortable"
								prepend-inner-icon="mdi-point-of-sale"
								hide-details
								class="opening-context-field"
							/>
						</div>
					</div>

					<aside class="opening-summary" :aria-label="__('Opening summary')">
						<div class="opening-summary__icon" aria-hidden="true">
							<v-icon size="22">mdi-cash-register</v-icon>
						</div>
						<div class="opening-summary__content">
							<span>{{ __("Total opening balance") }}</span>
							<strong>
								<bdi>{{ formatOpeningTotal }}</bdi>
							</strong>
							<small> {{ payments_methods.length }} {{ __("payment methods") }} </small>
						</div>
					</aside>
				</section>

				<section class="opening-balances-section" :aria-label="__('Opening balances')">
					<div class="opening-section-heading">
						<div>
							<span class="opening-section-heading__eyebrow">{{ __("Cash drawer") }}</span>
							<h2>{{ __("Opening balances") }}</h2>
							<p>{{ __("Enter the amount physically available for each payment method.") }}</p>
						</div>
						<v-chip size="small" variant="tonal" color="primary" class="opening-method-count">
							{{ payments_methods.length }} {{ __("methods") }}
						</v-chip>
					</div>

					<div v-if="payments_methods.length" class="opening-balance-list">
						<article
							v-for="(payment, index) in payments_methods"
							:key="payment.mode_of_payment"
							class="opening-balance-row"
						>
							<div class="opening-balance-row__identity">
								<div class="opening-balance-row__icon" aria-hidden="true">
									<v-icon size="20">{{
										paymentMethodIcon(payment.mode_of_payment)
									}}</v-icon>
								</div>
								<div>
									<strong>{{ payment.mode_of_payment }}</strong>
									<span>{{ payment.currency || __("Register currency") }}</span>
								</div>
							</div>

							<div class="opening-balance-row__amount">
								<label :for="`opening-amount-${index}`">{{ __("Opening amount") }}</label>
								<v-text-field
									:id="`opening-amount-${index}`"
									v-model="payment.amount"
									:rules="[validOpeningAmount]"
									type="number"
									inputmode="decimal"
									min="0"
									step="any"
									density="comfortable"
									variant="outlined"
									hide-details="auto"
									:prefix="currencySymbol(payment.currency)"
									class="opening-amount-input"
									@blur="normalizeOpeningAmount(payment)"
								/>
							</div>
						</article>
					</div>

					<div v-else class="opening-empty-state">
						<div class="opening-empty-state__icon">
							<v-icon size="28">mdi-credit-card-off-outline</v-icon>
						</div>
						<strong>{{ __("No payment methods available") }}</strong>
						<p>
							{{
								__(
									"Add payment methods to the selected POS Profile before opening the shift.",
								)
							}}
						</p>
					</div>
				</section>
			</v-card-text>

			<footer class="opening-dialog-footer">
				<v-btn
					variant="text"
					class="opening-footer-btn opening-logout-btn"
					prepend-icon="mdi-logout-variant"
					:disabled="is_loading"
					@click="logout"
				>
					{{ __("Logout") }}
				</v-btn>

				<div class="opening-dialog-footer__primary-actions">
					<v-btn
						variant="outlined"
						class="opening-footer-btn opening-close-btn"
						prepend-icon="mdi-view-dashboard-outline"
						:disabled="is_loading"
						@click="go_desk"
					>
						{{ __("Back to Desk") }}
					</v-btn>
					<v-btn
						variant="flat"
						class="opening-footer-btn opening-submit-btn"
						prepend-icon="mdi-lock-open-check-outline"
						:disabled="!canSubmit"
						:loading="is_loading"
						@click="submit_dialog"
					>
						{{ __("Open shift") }}
					</v-btn>
				</div>
			</footer>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import {
	getOpeningDialogStorage,
	setOpeningDialogStorage,
	setOpeningStorage,
	getBootstrapSnapshot,
	setBootstrapSnapshot,
	initPromise,
	checkDbHealth,
} from "../../../../offline/index";
import { createBootstrapSnapshotFromRegisterData } from "../../../../offline/bootstrapSnapshot";
import authService from "../../../services/authService";

defineOptions({
	name: "OpeningDialog",
});

const props = defineProps({
	dialog: Boolean,
});

const emit = defineEmits(["close", "register"]);
const __ = window.__ || ((text) => text);
const get_currency_symbol = window.get_currency_symbol;
const BUILD_VERSION = typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : null;

const isOpen = ref(props.dialog ? props.dialog : false);
const is_loading = ref(false);
const error_message = ref("");
const companies = ref([]);
const company = ref("");
const pos_profiles_data = ref([]);
const pos_profiles = ref([]);
const pos_profile = ref("");
const payments_method_data = ref([]);
const payments_methods = ref([]);

const currencySymbol = (currency) => get_currency_symbol?.(currency) || currency || "";

const openingTotal = computed(() =>
	payments_methods.value.reduce((total, payment) => {
		const amount = Number(payment?.amount || 0);
		return total + (Number.isFinite(amount) ? amount : 0);
	}, 0),
);

const openingCurrency = computed(() => payments_methods.value[0]?.currency || "");

const formatOpeningTotal = computed(() => {
	const formatted = openingTotal.value.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	const symbol = currencySymbol(openingCurrency.value);
	return symbol ? `${symbol} ${formatted}` : formatted;
});

const canSubmit = computed(
	() =>
		!is_loading.value &&
		Boolean(company.value && pos_profile.value && payments_methods.value.length) &&
		payments_methods.value.every((payment) => {
			const amount = Number(payment?.amount || 0);
			return Number.isFinite(amount) && amount >= 0;
		}),
);

const validOpeningAmount = (value) => {
	const rawValue = String(value ?? "").trim();
	if (rawValue.length > 12) return __("Amount is too long");
	const amount = Number(rawValue || 0);
	if (!Number.isFinite(amount)) return __("Enter a valid amount");
	if (amount < 0) return __("Amount cannot be negative");
	return true;
};

watch(
	() => props.dialog,
	(val) => {
		isOpen.value = val ? val : false;
	},
);

watch(company, (val) => {
	pos_profiles.value = pos_profiles_data.value
		.filter((element) => element.company === val)
		.map((element) => element.name);
	pos_profile.value = pos_profiles.value.includes(pos_profile.value)
		? pos_profile.value
		: pos_profiles.value[0] || "";
});

watch(pos_profile, (val) => {
	error_message.value = "";
	payments_methods.value = payments_method_data.value
		.filter((element) => element.parent === val)
		.map((element) => ({
			mode_of_payment: element.mode_of_payment,
			amount: 0,
			currency: element.currency,
		}));
});

function paymentMethodIcon(modeOfPayment) {
	const mode = String(modeOfPayment || "").toLowerCase();
	if (mode.includes("cash")) return "mdi-cash-multiple";
	if (mode.includes("card") || mode.includes("credit")) return "mdi-credit-card-outline";
	if (mode.includes("bank") || mode.includes("wire") || mode.includes("transfer")) {
		return "mdi-bank-transfer";
	}
	if (mode.includes("cheque") || mode.includes("check")) return "mdi-checkbook";
	if (mode.includes("mobile") || mode.includes("phone") || mode.includes("mpesa")) {
		return "mdi-cellphone-check";
	}
	return "mdi-wallet-outline";
}

function normalizeOpeningAmount(payment) {
	if (!payment) return;
	const amount = Number(payment.amount || 0);
	payment.amount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

async function get_opening_dialog_data() {
	await initPromise;
	await checkDbHealth();

	// Load cached data first for offline usage
	const cached = getOpeningDialogStorage();
	if (cached) {
		try {
			companies.value = cached.companies.map((c) => c.name);
			pos_profiles_data.value = cached.pos_profiles_data || [];
			payments_method_data.value = cached.payments_method || [];
			company.value = companies.value[0] || "";
		} catch (e) {
			console.error("Failed to parse opening dialog cache", e);
		}
	}

	frappe.call({
		method: "posawesome.posawesome.api.shifts.get_opening_dialog_data",
		args: {},
		callback: function (r) {
			if (r.message) {
				companies.value = r.message.companies.map((element) => element.name);
				pos_profiles_data.value = r.message.pos_profiles_data;
				payments_method_data.value = r.message.payments_method;
				company.value = companies.value[0] || "";
				try {
					setOpeningDialogStorage(r.message);
				} catch (e) {
					console.error("Failed to cache opening dialog data", e);
				}
			}
		},
	});
}

async function submit_dialog() {
	if (!payments_methods.value.length || !company.value || !pos_profile.value) {
		error_message.value = __("Select a company, POS Profile, and valid payment methods first.");
		return;
	}

	is_loading.value = true;
	error_message.value = "";

	try {
		const r = await frappe.call("posawesome.posawesome.api.shifts.create_opening_voucher", {
			pos_profile: pos_profile.value,
			company: company.value,
			balance_details: payments_methods.value,
		});

		if (r.message) {
			emit("register", r.message);
			try {
				setOpeningStorage(r.message);
				setBootstrapSnapshot(
					createBootstrapSnapshotFromRegisterData(r.message, getBootstrapSnapshot(), {
						buildVersion: BUILD_VERSION,
					}),
				);
			} catch (e) {
				console.error("Failed to cache opening data", e);
			}
			// Close handles hiding the dialog, parent handles logic
			emit("close");
		}
	} catch (error) {
		console.error("Failed to create POS opening shift", error);
		error_message.value =
			error?.messages?.[0] ||
			error?.message ||
			__("Unable to open the shift. Review the balances and try again.");
	} finally {
		is_loading.value = false;
	}
}

function go_desk() {
	frappe.set_route("/");
	location.reload();
}

function logout() {
	const redirectTarget = "/app/posapp";
	const loginPath = `/login?redirect-to=${encodeURIComponent(redirectTarget)}`;
	authService.logout().finally(() => {
		const loginUrl =
			frappe?.utils?.get_url?.(loginPath) ??
			(frappe?.urllib?.get_base_url?.() ? `${frappe.urllib.get_base_url()}${loginPath}` : loginPath);
		window.location.href = loginUrl;
	});
}

onMounted(() => {
	get_opening_dialog_data();
});
</script>

<style scoped>
/* 2026 register-opening workspace */
.opening-dialog-card {
	width: 100%;
	height: min(760px, calc(100dvh - 28px));
	max-height: calc(100dvh - 28px);
	display: grid;
	grid-template-rows: auto minmax(0, 1fr) auto;
	border: 1px solid var(--pos-border-light, rgba(15, 23, 42, 0.08));
	border-radius: 22px !important;
	background: var(--pos-dialog-bg, #ffffff) !important;
	color: var(--pos-text-primary, #17202a) !important;
	box-shadow: 0 28px 80px rgba(15, 23, 42, 0.24) !important;
	overflow: hidden;
	animation: opening-dialog-enter 0.22s ease-out;
}

.opening-dialog-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20px;
	padding: 20px 24px !important;
	background:
		radial-gradient(circle at 0 0, rgba(0, 118, 129, 0.1), transparent 42%),
		var(--pos-surface-raised, #ffffff) !important;
	color: var(--pos-text-primary, #17202a) !important;
	border-bottom: 1px solid var(--pos-divider, rgba(15, 23, 42, 0.08)) !important;
}

.opening-dialog-header__identity {
	display: flex;
	align-items: center;
	gap: 14px;
	min-width: 0;
}

.opening-dialog-header__icon {
	width: 52px;
	height: 52px;
	flex: 0 0 52px;
	display: grid;
	place-items: center;
	border-radius: 16px;
	background: linear-gradient(145deg, var(--pos-primary, #007681), var(--pos-primary-variant, #005f68));
	color: var(--pos-on-primary, #ffffff);
	box-shadow: 0 10px 24px rgba(0, 118, 129, 0.2);
}

.opening-dialog-header__copy {
	min-width: 0;
}

.opening-dialog-eyebrow,
.opening-section-heading__eyebrow {
	display: block;
	margin-bottom: 3px;
	font-size: 10px;
	font-weight: 800;
	line-height: 1.2;
	letter-spacing: 0.11em;
	text-transform: uppercase;
	color: var(--pos-primary, #007681);
}

.opening-dialog-header h1 {
	margin: 0;
	font-size: clamp(20px, 2vw, 27px);
	font-weight: 800;
	line-height: 1.18;
	letter-spacing: -0.02em;
	color: var(--pos-text-primary, #17202a);
}

.opening-dialog-header p,
.opening-section-heading p,
.opening-empty-state p {
	margin: 4px 0 0;
	font-size: 13px;
	line-height: 1.45;
	color: var(--pos-text-secondary, #667085);
}

.opening-dialog-header__status {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-height: 34px;
	padding: 6px 11px;
	border: 1px solid color-mix(in srgb, var(--pos-success, #2e9d62) 30%, transparent);
	border-radius: 999px;
	background: var(--pos-success-container, #e8f5e8);
	color: color-mix(in srgb, var(--pos-success, #2e9d62) 78%, #123a28);
	font-size: 11px;
	font-weight: 750;
	white-space: nowrap;
}

.opening-dialog-status-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--pos-success, #2e9d62);
	box-shadow: 0 0 0 4px color-mix(in srgb, var(--pos-success, #2e9d62) 16%, transparent);
}

.opening-dialog-content {
	min-height: 0;
	padding: 20px 24px 24px !important;
	background: var(--pos-surface-container, #fafafa) !important;
	overflow-y: auto;
	overscroll-behavior: contain;
	scrollbar-gutter: stable;
}

.opening-dialog-alert {
	margin-bottom: 14px;
	border-radius: 12px;
}

.opening-register-context {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
	gap: 14px;
	margin-bottom: 18px;
}

.opening-register-context__fields {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
	padding: 16px;
	border: 1px solid var(--pos-border-light, rgba(15, 23, 42, 0.08));
	border-radius: 16px;
	background: var(--pos-surface-raised, #ffffff);
}

.opening-field-group {
	display: grid;
	gap: 6px;
	min-width: 0;
}

.opening-field-label,
.opening-balance-row__amount > label {
	font-size: 11px;
	font-weight: 750;
	line-height: 1.2;
	color: var(--pos-text-secondary, #667085);
}

.opening-context-field :deep(.v-field),
.opening-amount-input :deep(.v-field) {
	min-height: 46px !important;
	border-radius: 11px !important;
	background: var(--pos-input-bg, #f5f5f5) !important;
}

.opening-context-field :deep(.v-field:hover),
.opening-amount-input :deep(.v-field:hover) {
	background: var(--pos-action-hover-bg, #f0fafa) !important;
}

.opening-context-field :deep(.v-field--focused),
.opening-amount-input :deep(.v-field--focused) {
	background: var(--pos-surface-raised, #ffffff) !important;
	box-shadow: var(--pos-focus-ring, 0 0 0 3px rgba(0, 118, 129, 0.18));
}

.opening-context-field :deep(.v-field__input),
.opening-amount-input :deep(.v-field__input) {
	min-height: 46px !important;
	font-size: 14px;
	font-weight: 650;
	color: var(--pos-text-primary, #17202a) !important;
}

.opening-summary {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 16px;
	border: 1px solid color-mix(in srgb, var(--pos-primary, #007681) 22%, transparent);
	border-radius: 16px;
	background: linear-gradient(
		145deg,
		var(--pos-primary-container, #e0f7fa),
		var(--pos-surface-raised, #ffffff)
	);
	overflow: hidden;
}

.opening-summary__icon {
	width: 44px;
	height: 44px;
	flex: 0 0 44px;
	display: grid;
	place-items: center;
	border-radius: 13px;
	background: var(--pos-primary, #007681);
	color: var(--pos-on-primary, #ffffff);
}

.opening-summary__content {
	display: grid;
	gap: 1px;
	min-width: 0;
}

.opening-summary__content > span,
.opening-summary__content > small {
	font-size: 11px;
	font-weight: 650;
	color: var(--pos-text-secondary, #667085);
}

.opening-summary__content > strong {
	font-size: clamp(18px, 2vw, 24px);
	font-weight: 850;
	line-height: 1.25;
	color: var(--pos-primary-variant, #005f68);
	font-variant-numeric: tabular-nums;
	overflow-wrap: anywhere;
}

.opening-balances-section {
	padding: 16px;
	border: 1px solid var(--pos-border-light, rgba(15, 23, 42, 0.08));
	border-radius: 18px;
	background: var(--pos-surface-raised, #ffffff);
}

.opening-section-heading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 12px;
}

.opening-section-heading h2 {
	margin: 0;
	font-size: 17px;
	font-weight: 800;
	line-height: 1.25;
	color: var(--pos-text-primary, #17202a);
}

.opening-method-count {
	flex: 0 0 auto;
	font-weight: 750;
}

.opening-balance-list {
	display: grid;
	gap: 8px;
	max-height: clamp(230px, 36vh, 340px);
	padding-inline-end: 5px;
	overflow-y: auto;
	overscroll-behavior: contain;
	scrollbar-gutter: stable;
}

.opening-balance-row {
	display: grid;
	grid-template-columns: minmax(180px, 1fr) minmax(240px, 0.82fr);
	align-items: center;
	gap: 18px;
	min-height: 72px;
	padding: 10px 12px;
	border: 1px solid var(--pos-border-light, rgba(15, 23, 42, 0.08));
	border-radius: 13px;
	background: var(--pos-surface-container, #fafafa);
	transition:
		border-color 0.15s ease,
		background-color 0.15s ease,
		box-shadow 0.15s ease;
}

.opening-balance-row:hover,
.opening-balance-row:focus-within {
	border-color: color-mix(in srgb, var(--pos-primary, #007681) 36%, transparent);
	background: var(--pos-action-hover-bg, #f0fafa);
	box-shadow: 0 4px 14px var(--pos-shadow-light, rgba(15, 23, 42, 0.05));
}

.opening-balance-row__identity {
	display: flex;
	align-items: center;
	gap: 11px;
	min-width: 0;
}

.opening-balance-row__icon {
	width: 40px;
	height: 40px;
	flex: 0 0 40px;
	display: grid;
	place-items: center;
	border-radius: 11px;
	background: var(--pos-primary-container, #e0f7fa);
	color: var(--pos-primary, #007681);
}

.opening-balance-row__identity > div:last-child {
	display: grid;
	gap: 2px;
	min-width: 0;
}

.opening-balance-row__identity strong {
	font-size: 14px;
	font-weight: 750;
	line-height: 1.25;
	color: var(--pos-text-primary, #17202a);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.opening-balance-row__identity span {
	font-size: 11px;
	color: var(--pos-text-secondary, #667085);
}

.opening-balance-row__amount {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	align-items: center;
	gap: 10px;
	min-width: 0;
}

.opening-amount-input :deep(input) {
	font-weight: 800;
	text-align: end;
	font-variant-numeric: tabular-nums;
}

.opening-amount-input :deep(.v-field__prefix) {
	font-weight: 750;
	color: var(--pos-primary, #007681);
}

.opening-empty-state {
	display: grid;
	place-items: center;
	min-height: 190px;
	padding: 24px;
	text-align: center;
	border: 1px dashed var(--pos-border, rgba(15, 23, 42, 0.14));
	border-radius: 14px;
	background: var(--pos-surface-container, #fafafa);
}

.opening-empty-state__icon {
	width: 52px;
	height: 52px;
	display: grid;
	place-items: center;
	margin-bottom: 8px;
	border-radius: 16px;
	background: var(--pos-warning-container, #fff3e0);
	color: var(--pos-warning, #f79009);
}

.opening-empty-state strong {
	font-size: 15px;
	color: var(--pos-text-primary, #17202a);
}

.opening-dialog-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 24px;
	border-top: 1px solid var(--pos-divider, rgba(15, 23, 42, 0.08));
	background: var(--pos-surface-raised, #ffffff);
}

.opening-dialog-footer__primary-actions {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 9px;
}

.opening-footer-btn {
	min-height: 46px !important;
	border-radius: 11px !important;
	padding-inline: 18px !important;
	font-size: 13px !important;
	font-weight: 750 !important;
	text-transform: none !important;
	letter-spacing: 0 !important;
	transition:
		background-color 0.15s ease,
		border-color 0.15s ease,
		color 0.15s ease,
		transform 0.1s ease !important;
}

.opening-logout-btn {
	color: var(--pos-text-secondary, #667085) !important;
}

.opening-close-btn {
	border-color: var(--pos-border, rgba(15, 23, 42, 0.18)) !important;
	color: var(--pos-text-primary, #17202a) !important;
}

.opening-submit-btn {
	min-width: 160px;
	background: var(--pos-primary, #007681) !important;
	color: var(--pos-on-primary, #ffffff) !important;
	box-shadow: 0 8px 18px rgba(0, 118, 129, 0.2);
}

.opening-logout-btn:hover,
.opening-logout-btn:focus-visible,
.opening-close-btn:hover,
.opening-close-btn:focus-visible {
	background: var(--pos-action-hover-bg, #f0fafa) !important;
	color: var(--pos-action-active-fg, #006d77) !important;
}

.opening-submit-btn:hover,
.opening-submit-btn:focus-visible {
	background: var(--pos-primary-variant, #005f68) !important;
	color: var(--pos-on-primary, #ffffff) !important;
}

.opening-footer-btn:active {
	transform: translateY(1px);
}

.opening-logout-btn:active,
.opening-close-btn:active {
	background: var(--pos-action-pressed-bg, #d8f0f2) !important;
	color: var(--pos-action-pressed-fg, #005f68) !important;
}

.opening-submit-btn:active {
	background: color-mix(in srgb, var(--pos-primary-variant, #005f68) 88%, #000000) !important;
	color: var(--pos-on-primary, #ffffff) !important;
}

.opening-dialog-card :deep(.v-btn__content),
.opening-dialog-card :deep(.v-btn .v-icon) {
	position: relative;
	z-index: 1;
	color: inherit !important;
	opacity: 1 !important;
}

.opening-dialog-card :deep(.v-btn__overlay),
.opening-dialog-card :deep(.v-btn__underlay),
.opening-dialog-card :deep(.v-ripple__container) {
	display: none !important;
	opacity: 0 !important;
}

@media (max-width: 760px) {
	.opening-dialog-card {
		height: 100dvh;
		max-height: 100dvh;
		border: 0;
		border-radius: 0 !important;
	}

	.opening-dialog-header {
		padding: 14px 16px !important;
	}

	.opening-dialog-header__icon {
		width: 44px;
		height: 44px;
		flex-basis: 44px;
		border-radius: 13px;
	}

	.opening-dialog-header__status {
		display: none;
	}

	.opening-dialog-header p {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.opening-dialog-content {
		padding: 14px 16px 18px !important;
	}

	.opening-register-context {
		grid-template-columns: 1fr;
	}

	.opening-register-context__fields {
		grid-template-columns: 1fr;
		padding: 12px;
	}

	.opening-summary {
		padding: 12px;
	}

	.opening-balances-section {
		padding: 12px;
	}

	.opening-balance-list {
		max-height: none;
	}

	.opening-balance-row {
		grid-template-columns: 1fr;
		gap: 10px;
	}

	.opening-balance-row__amount {
		grid-template-columns: 1fr;
		gap: 5px;
	}

	.opening-dialog-footer {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		padding: 10px 12px;
	}

	.opening-dialog-footer__primary-actions {
		display: grid;
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
	}

	.opening-footer-btn {
		min-width: 0;
		padding-inline: 10px !important;
	}
}

@media (max-width: 480px) {
	.opening-dialog-header h1 {
		font-size: 19px;
	}

	.opening-section-heading {
		align-items: flex-start;
	}

	.opening-section-heading p {
		font-size: 12px;
	}

	.opening-dialog-footer {
		grid-template-columns: 44px minmax(0, 1fr);
	}

	.opening-logout-btn {
		width: 44px;
		min-width: 44px !important;
		padding: 0 !important;
		font-size: 0 !important;
	}

	.opening-logout-btn :deep(.v-icon) {
		margin: 0 !important;
		font-size: 20px !important;
	}

	.opening-footer-btn {
		font-size: 11px !important;
	}
}

@media (prefers-reduced-motion: reduce) {
	.opening-dialog-card,
	.opening-footer-btn,
	.opening-balance-row {
		animation: none !important;
		transition: none !important;
	}
}

@keyframes opening-dialog-enter {
	from {
		opacity: 0;
		transform: translateY(10px) scale(0.99);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style>
