<template>
	<v-card
		class="invoice-summary-card py-2 px-3 pos-themed-card"
		:class="{ 'invoice-summary-card--compact': useCompactSaleDock }"
	>
		<div class="invoice-summary-layout">
			<!-- Prorated Return Discount Alert (if active) -->
			<v-alert
				v-if="showReturnDiscountAlert && return_discount_meta"
				density="compact"
				type="info"
				variant="tonal"
				class="summary-field summary-field--alert mb-2"
			>
				{{ __("Prorated return discount") }}: {{ formatRatio(return_discount_meta.ratio) }} -
				{{ __("Original") }}: {{ formatCurrency ? formatCurrency(return_discount_meta.original_discount) : return_discount_meta.original_discount }},
				{{ __("Applied") }}: {{ formatCurrency ? formatCurrency(return_discount_meta.prorated_discount) : return_discount_meta.prorated_discount }}
			</v-alert>

			<!-- Compact Mode Layout for Mobile/Tablet (< 1200px) -->
			<div v-if="useCompactSaleDock" class="mobile-cart-command-bar">
				<div class="mobile-cart-command-bar__summary">
					<span class="mobile-cart-command-bar__label">{{ __("Total") }}</span>
					<strong class="mobile-cart-command-bar__total"><bdi>{{ formatMoney(subtotal, formatCurrency || ((v) => String(v)), currencySymbol || (() => ""), displayCurrency) }}</bdi></strong>
					<span class="mobile-cart-command-bar__qty">· {{ formatFloat ? formatFloat(total_qty, hide_qty_decimals ? 0 : undefined) : total_qty }} {{ __("qty") }}</span>
				</div>

				<v-btn
					variant="tonal"
					color="secondary"
					class="cmd-icon-btn mobile-cart-action-btn"
					:disabled="!canEditAdditionalDiscount"
					@click="showDiscountDialog = true"
					:aria-label="__('Additional Discount')"
				>
					<v-icon size="small">mdi-cash-minus</v-icon>
				</v-btn>

				<InvoiceActionButtons
					:compact-external-pay="compactExternalPay"
					:pos_profile="pos_profile"
					:has-items="Math.abs(Number(total_qty || 0)) > 0"
					:saveLoading="saveLoading"
					:loadDraftsLoading="loadDraftsLoading"
					:selectOrderLoading="selectOrderLoading"
					:cancelLoading="cancelLoading"
					:invoiceManagementLoading="invoiceManagementLoading"
					:returnsLoading="returnsLoading"
					:printLoading="printLoading"
					:paymentLoading="paymentLoading"
					:customerDisplayLoading="customerDisplayLoading"
					:subtotal="subtotal"
					:displayCurrency="displayCurrency"
					:formatCurrency="formatCurrency"
					:currencySymbol="currencySymbol"
					@save-and-clear="handleSaveAndClear"
					@load-drafts="handleLoadDrafts"
					@select-order="handleSelectOrder"
					@cancel-sale="handleCancelSale"
					@open-invoice-management="handleOpenInvoiceManagement"
					@open-returns="handleOpenReturns"
					@print-draft="handlePrintDraft"
					@show-payment="handleShowPayment"
					@open-customer-display="handleOpenCustomerDisplay"
				/>

				<v-dialog v-model="showDiscountDialog" max-width="360">
					<v-card class="pa-4 pos-themed-card">
						<div class="text-subtitle-1 font-weight-bold mb-3">{{ __("Additional Discount") }}</div>
						<v-text-field
							v-if="!usePercentageDiscount"
							ref="additionalDiscountField"
							v-model="additionalDiscountDisplay"
							@update:model-value="handleAdditionalDiscountUpdate"
							:label="frappe._('Discount Amount')"
							prepend-inner-icon="mdi-cash-minus"
							variant="outlined"
							density="compact"
							color="primary"
							hide-details
							class="mb-3"
						/>
						<v-text-field
							v-else
							ref="additionalDiscountField"
							v-model="additionalDiscountPercentageDisplay"
							@update:model-value="handleAdditionalDiscountPercentageUpdate"
							@change="$emit('update_discount_umount')"
							:label="frappe._('Discount %')"
							suffix="%"
							prepend-inner-icon="mdi-percent"
							variant="outlined"
							density="compact"
							color="primary"
							hide-details
							class="mb-3"
						/>
						<div class="d-flex justify-end gap-2">
							<v-btn variant="text" size="small" @click="showDiscountDialog = false">{{ __("Done") }}</v-btn>
						</div>
					</v-card>
				</v-dialog>
			</div>

			<!-- Desktop Standard Layout (>= 1200px) -->
			<template v-else>
				<div class="summary-hero mb-2">
					<div class="summary-hero__copy">
						<div class="summary-hero__eyebrow-row">
							<span class="summary-hero__eyebrow">{{ __("Active sale") }}</span>
						</div>

						<strong class="summary-hero__amount">
							{{ formatMoney(subtotal, formatCurrency || ((v) => String(v)), currencySymbol || (() => ""), displayCurrency) }}
						</strong>

						<div id="invoice-summary-breakdown" class="summary-hero__meta">
							<span>
								{{ formatFloat ? formatFloat(total_qty, hide_qty_decimals ? 0 : undefined) : total_qty }} {{ __("qty") }}
							</span>
							<span v-if="total_items_discount_amount">
								· {{ formatMoney(total_items_discount_amount, formatCurrency || ((v) => String(v)), currencySymbol || (() => ""), displayCurrency) }}
								{{ __("discount") }}
							</span>
						</div>
					</div>

					<div class="summary-hero__field-wrap">
						<v-text-field
							v-if="!usePercentageDiscount"
							ref="additionalDiscountField"
							v-model="additionalDiscountDisplay"
							@update:model-value="handleAdditionalDiscountUpdate"
							@focus="handleAdditionalDiscountFocus"
							@blur="handleAdditionalDiscountBlur"
							:label="frappe._('Additional Discount')"
							prepend-inner-icon="mdi-cash-minus"
							variant="outlined"
							density="compact"
							color="primary"
							:disabled="!canEditAdditionalDiscount"
							class="summary-field"
							hide-details
						/>

						<v-text-field
							v-else
							ref="additionalDiscountField"
							v-model="additionalDiscountPercentageDisplay"
							@update:model-value="handleAdditionalDiscountPercentageUpdate"
							@change="$emit('update_discount_umount')"
							@focus="handleAdditionalDiscountPercentageFocus"
							@blur="handleAdditionalDiscountPercentageBlur"
							:rules="isNumber ? [isNumber] : []"
							:label="frappe._('Additional Discount %')"
							suffix="%"
							prepend-inner-icon="mdi-percent"
							variant="outlined"
							density="compact"
							color="primary"
							:disabled="!canEditAdditionalDiscount"
							class="summary-field"
							hide-details
						/>
					</div>
				</div>

				<!-- Actions Region -->
				<div class="invoice-summary-actions">
					<InvoiceActionButtons
						:compact-external-pay="compactExternalPay"
						:pos_profile="pos_profile"
						:has-items="Math.abs(Number(total_qty || 0)) > 0"
						:saveLoading="saveLoading"
						:loadDraftsLoading="loadDraftsLoading"
						:selectOrderLoading="selectOrderLoading"
						:cancelLoading="cancelLoading"
						:invoiceManagementLoading="invoiceManagementLoading"
						:returnsLoading="returnsLoading"
						:printLoading="printLoading"
						:paymentLoading="paymentLoading"
						:customerDisplayLoading="customerDisplayLoading"
						:subtotal="subtotal"
						:displayCurrency="displayCurrency"
						:formatCurrency="formatCurrency"
						:currencySymbol="currencySymbol"
						@save-and-clear="handleSaveAndClear"
						@load-drafts="handleLoadDrafts"
						@select-order="handleSelectOrder"
						@cancel-sale="handleCancelSale"
						@open-invoice-management="handleOpenInvoiceManagement"
						@open-returns="handleOpenReturns"
						@print-draft="handlePrintDraft"
						@show-payment="handleShowPayment"
						@open-customer-display="handleOpenCustomerDisplay"
					/>
				</div>
			</template>
		</div>
	</v-card>

	<!-- Desktop Navigation Drawer for Drafts -->
	<v-navigation-drawer
		v-if="showDesktopDrafts"
		v-model="desktopDraftsDrawer"
		location="right"
		temporary
		width="360"
		class="drafts-drawer"
	>
		<div class="drafts-drawer__body">
			<DocumentSourceSelector
				v-if="showDraftSourceSelector"
				v-model="currentDraftSource"
				:options="availableDraftSources"
				compact
				:aria-label="__('Draft source')"
				class="drafts-drawer__sources"
			/>
			<ParkedOrdersList
				ref="desktopDraftsList"
				:parked-orders="allDrafts"
				:format-currency="formatCurrency || ((v) => String(v))"
				:currency-symbol="currencySymbol || (() => '')"
				:show-manage-all="true"
				:loading="loadDraftsLoading"
				:loading-title="__(currentDraftSourceOption.loadingLabel)"
				:title="currentDraftSourceOption.panelTitle"
				:eyebrow="currentDraftSourceOption.panelEyebrow"
				:subtitle="currentDraftSourceOption.panelSubtitle"
				:empty-title="__(currentDraftSourceOption.emptyTitle)"
				:empty-subtitle="__(currentDraftSourceOption.emptySubtitle)"
				@resume="handleResumeDraft"
				@manage-all="handleManageAllDrafts"
				@close="closeDraftsSurface"
			/>
		</div>
	</v-navigation-drawer>

	<!-- Mobile / Tablet Dialog for Drafts -->
	<v-dialog v-else v-model="mobileDraftsDialog" max-width="680" scrollable data-test="mobile-drafts-dialog">
		<v-card class="pos-themed-card">
			<v-card-title class="d-flex align-center justify-space-between">
				<span>{{ __(currentDraftSourceOption.panelTitle) }}</span>
				<v-btn variant="text" size="small" @click="mobileDraftsDialog = false">
					{{ __("Close") }}
				</v-btn>
			</v-card-title>
			<v-card-text class="pt-0">
				<DocumentSourceSelector
					v-if="showDraftSourceSelector"
					v-model="currentDraftSource"
					:options="availableDraftSources"
					compact
					:aria-label="__('Draft source')"
					class="drafts-drawer__sources"
				/>
				<ParkedOrdersList
					ref="mobileDraftsList"
					:parked-orders="allDrafts"
					:format-currency="formatCurrency || ((v) => String(v))"
					:currency-symbol="currencySymbol || (() => '')"
					:show-manage-all="true"
					:loading="loadDraftsLoading"
					:loading-title="__(currentDraftSourceOption.loadingLabel)"
					:title="currentDraftSourceOption.panelTitle"
					:eyebrow="currentDraftSourceOption.panelEyebrow"
					:subtitle="currentDraftSourceOption.panelSubtitle"
					:empty-title="__(currentDraftSourceOption.emptyTitle)"
					:empty-subtitle="__(currentDraftSourceOption.emptySubtitle)"
					@resume="handleResumeDraft"
					@manage-all="handleManageAllDrafts"
					@close="closeDraftsSurface"
				/>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
const showDiscountDialog = ref(false);
import { storeToRefs } from "pinia";
import { loadItemSelectorSettings } from "../../../utils/itemSelectorSettings";
import { useResponsive } from "../../../composables/core/useResponsive";
import { useUIStore } from "../../../stores/uiStore";
import { parseBooleanSetting } from "../../../composables/pos/items/useItemPermissions";
import { formatMoney } from "../../../composables/pos/shared/useMoneyFormatter";
import {
	getAvailableDocumentSources,
	getDefaultDocumentSource,
	getDocumentSourceOption,
	shouldShowDocumentSourceSelector,
} from "../../../utils/documentSources";
import InvoiceActionButtons from "./InvoiceActionButtons.vue";
import ParkedOrdersList from "./ParkedOrdersList.vue";
import DocumentSourceSelector from "../shared/DocumentSourceSelector.vue";

defineOptions({
	name: "InvoiceSummary",
});

interface Props {
	compactExternalPay?: boolean;
	pos_profile?: any;
	total_qty?: number | string;
	additional_discount?: number;
	additional_discount_percentage?: number;
	total_items_discount_amount?: number;
	subtotal?: number;
	displayCurrency?: string;
	formatFloat?: (_val: any, _precision?: number) => string;
	formatCurrency?: (_val: any, _precision?: number) => string;
	currencySymbol?: (_currency?: string) => string;
	discount_percentage_offer_name?: string | number;
	isNumber?: (_val: any) => boolean | string;
	return_discount_meta?: any;
}

const props = withDefaults(defineProps<Props>(), {
	compactExternalPay: false,
	pos_profile: () => ({}),
});

const emit = defineEmits([
	"update:additional_discount",
	"update:additional_discount_percentage",
	"update_discount_umount",
	"save-and-clear",
	"load-drafts",
	"select-order",
	"cancel-sale",
	"open-invoice-management",
	"open-returns",
	"print-draft",
	"show-payment",
	"open-customer-display",
	"resume-parked-order",
]);

const saveLoading = ref(false);
const loadDraftsLoading = ref(false);
const selectOrderLoading = ref(false);
const cancelLoading = ref(false);
const invoiceManagementLoading = ref(false);
const returnsLoading = ref(false);
const printLoading = ref(false);
const paymentLoading = ref(false);
const customerDisplayLoading = ref(false);
const isEditingAdditionalDiscount = ref(false);
const isEditingAdditionalDiscountPercentage = ref(false);
const additionalDiscountField = ref<any>(null);
const desktopDraftsDrawer = ref(false);
const mobileDraftsDialog = ref(false);
const desktopDraftsList = ref<any>(null);
const mobileDraftsList = ref<any>(null);
const expandedBreakdown = ref(false);
const responsive = useResponsive();
const uiStore = useUIStore();
const { parkedOrders, draftSource } = storeToRefs(uiStore);

const __ = (window as any).__ || ((s: string) => s);
const frappe = (window as any).frappe || { _: (s: string) => s };

const additionalDiscountDisplay = ref(normalizeAdditionalDiscountDisplay(props.additional_discount));
const additionalDiscountPercentageDisplay = ref(
	normalizeDiscountDisplay(props.additional_discount_percentage),
);
const useCompactSaleDock = computed(() => responsive.windowWidth.value < 1200);
const showDesktopDrafts = computed(() => Boolean(responsive.isDesktop.value));

const allowAdditionalDiscount = computed(() =>
	parseBooleanSetting(props.pos_profile?.posa_allow_user_to_edit_additional_discount),
);

const usePercentageDiscount = computed(() =>
	parseBooleanSetting(props.pos_profile?.posa_use_percentage_discount),
);

const canEditAdditionalDiscount = computed(
	() => allowAdditionalDiscount.value && !props.discount_percentage_offer_name,
);

const showReturnDiscountAlert = computed(
	() =>
		!!props.return_discount_meta &&
		!usePercentageDiscount.value &&
		!isFullReturnDiscount(props.return_discount_meta?.ratio),
);

const allDrafts = computed(() => (Array.isArray(parkedOrders.value) ? parkedOrders.value : []));
const availableDraftSources = computed(() => getAvailableDocumentSources(props.pos_profile));
const showDraftSourceSelector = computed(() => shouldShowDocumentSourceSelector(availableDraftSources.value));
const currentDraftSource = computed({
	get() {
		return getDefaultDocumentSource(props.pos_profile, draftSource.value);
	},
	async set(value) {
		const nextSource = getDefaultDocumentSource(props.pos_profile, value);
		if (draftSource.value === nextSource) {
			return;
		}
		uiStore.setDraftSource(nextSource);
		uiStore.setParkedOrders([]);
		await emit("load-drafts", nextSource);
	},
});
const currentDraftSourceOption = computed(() => getDocumentSourceOption(currentDraftSource.value));

const hide_qty_decimals = computed(() => {
	const opts = loadItemSelectorSettings();
	return !!opts?.hide_qty_decimals;
});

watch(
	useCompactSaleDock,
	(isCompact) => {
		if (!isCompact) {
			expandedBreakdown.value = true;
		}
	},
	{ immediate: true },
);

watch(
	() => props.pos_profile,
	() => {
		const nextSource = getDefaultDocumentSource(props.pos_profile, draftSource.value);
		if (draftSource.value !== nextSource) {
			uiStore.setDraftSource(nextSource);
		}
	},
	{ deep: true, immediate: true },
);

watch(
	() => [
		props.additional_discount,
		props.return_discount_meta?.prorated_discount,
		props.pos_profile?.posa_use_percentage_discount,
	],
	([value]) => {
		if (!isEditingAdditionalDiscount.value) {
			additionalDiscountDisplay.value = normalizeAdditionalDiscountDisplay(value);
		}
	},
);

watch(
	() => props.additional_discount_percentage,
	(value) => {
		if (!isEditingAdditionalDiscountPercentage.value) {
			additionalDiscountPercentageDisplay.value = normalizeDiscountDisplay(value);
		}
	},
);

function normalizeDiscountDisplay(value) {
	if (value === 0 || value === "0") {
		return "";
	}
	return value;
}

function normalizeAdditionalDiscountDisplay(value) {
	if (value === 0 || value === "0") {
		return "";
	}
	if (props.return_discount_meta && !usePercentageDiscount.value) {
		const proratedValue = Number(props.return_discount_meta.prorated_discount);
		if (Number.isFinite(proratedValue)) {
			return Math.abs(proratedValue);
		}
		const numericValue = Number(value);
		if (Number.isFinite(numericValue)) {
			return Math.abs(numericValue);
		}
	}
	return value;
}

function normalizeAdditionalDiscountInput(value) {
	if (props.return_discount_meta && !usePercentageDiscount.value) {
		const numericValue = Number(value);
		if (Number.isFinite(numericValue)) {
			const originalStoredValue = Number(props.additional_discount);
			const sign = Math.sign(
				Number.isFinite(originalStoredValue) && originalStoredValue !== 0 ? originalStoredValue : -1,
			);
			return sign * Math.abs(numericValue);
		}
	}
	return value;
}

function handleAdditionalDiscountUpdate(value) {
	emit("update:additional_discount", normalizeAdditionalDiscountInput(value));
}

function handleAdditionalDiscountFocus() {
	isEditingAdditionalDiscount.value = true;
}

function handleAdditionalDiscountBlur() {
	isEditingAdditionalDiscount.value = false;
}

function handleAdditionalDiscountPercentageUpdate(value) {
	emit("update:additional_discount_percentage", value);
}

function handleAdditionalDiscountPercentageFocus() {
	isEditingAdditionalDiscountPercentage.value = true;
}

function handleAdditionalDiscountPercentageBlur() {
	isEditingAdditionalDiscountPercentage.value = false;
}

function focusAdditionalDiscountField() {
	const field = additionalDiscountField.value;
	field?.focus?.();
	field?.$el?.querySelector?.("input")?.focus?.();
}

function formatRatio(value) {
	const ratio = Number.isFinite(Number(value)) ? Number(value) : 0;
	const percent = Math.round(ratio * 10000) / 100;
	return `${percent}%`;
}

function isFullReturnDiscount(value) {
	const ratio = Number.isFinite(Number(value)) ? Number(value) : 0;
	return Math.abs(ratio - 1) < 0.0001;
}

async function handleSaveAndClear() {
	saveLoading.value = true;
	try {
		await emit("save-and-clear");
	} finally {
		saveLoading.value = false;
	}
}

function handleLoadDrafts() {
	const nextSource = getDefaultDocumentSource(props.pos_profile, "invoice");
	uiStore.setDraftSource(nextSource);
	uiStore.setParkedOrders([]);
	openDraftsSurface({ focus: false });
	emit("load-drafts", nextSource);
}

function openDraftsSurface(options: { focus?: boolean } = {}) {
	if (showDesktopDrafts.value) {
		desktopDraftsDrawer.value = true;
		if (options.focus !== false) {
			void focusDraftsSurface();
		}
		return;
	}

	mobileDraftsDialog.value = true;
	if (options.focus !== false) {
		void focusDraftsSurface();
	}
}

function closeDraftsSurface() {
	desktopDraftsDrawer.value = false;
	mobileDraftsDialog.value = false;
}

async function focusDraftsSurface() {
	await nextTick();
	await new Promise((resolve) => {
		if (typeof requestAnimationFrame === "function") {
			requestAnimationFrame(resolve);
			return;
		}
		setTimeout(resolve, 0);
	});
	const list = showDesktopDrafts.value ? desktopDraftsList.value : mobileDraftsList.value;
	await list?.focusFirstDraft?.();
}

async function handleSelectOrder() {
	selectOrderLoading.value = true;
	try {
		await emit("select-order");
	} finally {
		selectOrderLoading.value = false;
	}
}

async function handleCancelSale() {
	cancelLoading.value = true;
	try {
		await emit("cancel-sale");
	} finally {
		cancelLoading.value = false;
	}
}

async function handleOpenInvoiceManagement() {
	invoiceManagementLoading.value = true;
	try {
		await emit("open-invoice-management");
	} finally {
		invoiceManagementLoading.value = false;
	}
}

function handleManageAllDrafts() {
	closeDraftsSurface();
	uiStore.setInvoiceManagementDraftSource(currentDraftSource.value);
	emit("open-invoice-management", "drafts", currentDraftSource.value);
}

async function handleOpenReturns() {
	returnsLoading.value = true;
	try {
		await emit("open-returns");
	} finally {
		returnsLoading.value = false;
	}
}

async function handlePrintDraft() {
	printLoading.value = true;
	try {
		await emit("print-draft");
	} finally {
		printLoading.value = false;
	}
}

async function handleShowPayment() {
	paymentLoading.value = true;
	try {
		await emit("show-payment");
	} finally {
		paymentLoading.value = false;
	}
}

async function handleOpenCustomerDisplay() {
	customerDisplayLoading.value = true;
	try {
		await emit("open-customer-display");
	} finally {
		customerDisplayLoading.value = false;
	}
}

function handleResumeDraft(draft) {
	closeDraftsSurface();
	emit("resume-parked-order", draft);
}

defineExpose({
	focusAdditionalDiscountField,
	focusDraftsSurface,
	handleManageAllDrafts,
	openDraftsSurface,
	closeDraftsSurface,
	setDraftsLoading(value) {
		loadDraftsLoading.value = Boolean(value);
	},
});
</script>

<style scoped>
.invoice-summary-card {
	position: relative;
	width: 100%;
	border-radius: var(--pos-radius-lg, 12px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	box-shadow: var(--pos-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05)) !important;
}

.invoice-summary-card--compact {
	padding: 4px 8px !important;
	border-radius: 8px !important;
	box-shadow: none !important;
	background: transparent !important;
	border: 0 !important;
}

.compact-checkout {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 2px 2px;
}

.compact-discount-field {
	max-width: 190px !important;
}

.mobile-cart-command-bar {
	display: grid;
	grid-template-columns: minmax(0, 1fr) repeat(4, 44px);
	align-items: center;
	gap: 4px;
	height: 56px;
	min-height: 56px;
	padding: 6px 8px;
	width: 100%;
}

.mobile-cart-command-bar__summary {
	display: flex;
	flex-direction: column;
	min-width: 0;
	overflow: hidden;
}

.mobile-cart-command-bar__label {
	font-size: 0.68rem;
	text-transform: uppercase;
	font-weight: 700;
	color: var(--pos-text-secondary, #64748b);
	line-height: 1;
}

.mobile-cart-command-bar__total {
	font-size: 1.05rem;
	font-weight: 800;
	line-height: 1.2;
	color: var(--pos-text-primary, #0f172a);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.mobile-cart-command-bar__qty {
	font-size: 0.7rem;
	color: var(--pos-text-secondary, #64748b);
	line-height: 1;
	white-space: nowrap;
}

.cmd-icon-btn {
	width: 44px !important;
	height: 44px !important;
	min-width: 44px !important;
	border-radius: 10px !important;
	padding: 0 !important;
}

.summary-hero {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 14px;
	border-radius: var(--pos-radius-md, 10px);
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 6%, var(--pos-surface-muted, #f8fafc));
	border: 1px solid color-mix(in srgb, var(--pos-primary, #2563eb) 12%, transparent);
}

.summary-hero__copy {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.summary-hero__eyebrow-row {
	display: flex;
	align-items: center;
	gap: 6px;
}

.summary-hero__eyebrow {
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--pos-text-secondary, #64748b);
}

.summary-hero__amount {
	font-size: 1.35rem;
	font-weight: 800;
	line-height: 1.15;
	color: var(--pos-text-primary, #0f172a);
}

.summary-hero__meta {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.78rem;
	font-weight: 550;
	color: var(--pos-text-secondary, #64748b);
}

.summary-hero__field-wrap {
	width: min(220px, 100%);
}

.drafts-drawer :deep(.v-navigation-drawer__content) {
	padding: 12px;
	background: var(--pos-surface-muted);
}

.drafts-drawer__body {
	padding: 4px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.drafts-drawer__sources {
	position: sticky;
	top: 0;
	z-index: 1;
	padding: 4px;
	background: var(--pos-surface-muted);
	border-radius: 16px;
}

@media (max-width: 1199px) {
	.summary-hero {
		flex-direction: column;
		align-items: stretch;
		padding: 8px 10px;
	}

	.summary-hero__field-wrap {
		width: 100%;
		margin-top: 4px;
	}
}
</style>
