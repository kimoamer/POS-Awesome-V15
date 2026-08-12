<template>
	<v-dialog v-model="dialog" max-width="920" scrollable transition="dialog-bottom-transition">
		<v-card class="offline-invoices-card pos-themed-card">
			<header class="offline-dialog-header">
				<div class="offline-dialog-heading">
					<div class="offline-dialog-icon"><v-icon size="23">mdi-file-sync-outline</v-icon></div>
					<div class="offline-dialog-copy">
						<h2>{{ __("Offline Invoices") }}</h2>
						<p>{{ __("Review queued sales and synchronization status on this terminal.") }}</p>
					</div>
					<PosStatusPill :tone="invoices.length ? 'warning' : 'success'" dot>
						{{ invoices.length ? `${invoices.length} ${__('Pending')}` : __("All synchronized") }}
					</PosStatusPill>
				</div>
				<v-btn icon="mdi-close" variant="text" size="small" class="offline-dialog-close" :aria-label="__('Close offline invoices dialog')" @click="dialog = false" />
			</header>

			<section class="offline-dialog-body">
				<div v-if="!invoices.length" class="offline-empty-state">
					<div class="offline-empty-state__icon"><v-icon size="40">mdi-check</v-icon></div>
					<h3>{{ __("Everything is synchronized") }}</h3>
					<p>{{ __("There are no offline invoices waiting to be sent.") }}</p>
				</div>
				<div v-else class="offline-table-section">
					<div class="offline-table-heading">
						<h3>{{ __("Pending invoices") }}</h3>
						<p>{{ __("Queued sales remain on this device until the server accepts them.") }}</p>
					</div>
					<v-data-table :headers="headers" :items="invoices" class="offline-invoices-table" :items-per-page="15" :items-per-page-options="[15, 25, 50]">
						<template #item.customer="{ item }">
							<div class="offline-customer-cell">
								<v-avatar size="34" color="primary" variant="tonal"><v-icon size="18">mdi-account</v-icon></v-avatar>
								<div><strong>{{ item.invoice.customer_name || item.invoice.customer }}</strong><small>{{ __("Customer") }}</small></div>
							</div>
						</template>
						<template #item.posting_date="{ item }"><bdi>{{ item.invoice.posting_date }}</bdi></template>
						<template #item.grand_total="{ item }"><strong class="offline-amount"><bdi>{{ currencySymbol(item.invoice.currency) }}</bdi> <bdi>{{ formatCurrency(item.invoice.grand_total || item.invoice.rounded_total) }}</bdi></strong></template>
						<template #item.status="{ item }">
							<div class="offline-state-cell"><PosStatusPill :tone="statusTone(item.status)" dot>{{ statusLabel(item.status) }}</PosStatusPill><small v-if="item.last_error" class="offline-state-error">{{ item.last_error }}</small></div>
						</template>
						<template #item.actions="{ item, index }">
							<div class="offline-row-actions">
								<v-btn v-if="item.status === 'dead_letter' || item.status === 'retrying'" icon="mdi-refresh" color="primary" size="small" variant="text" :aria-label="__('Retry queued invoice')" @click="retryInvoice(item)" />
								<v-btn v-if="posProfile.posa_allow_delete_offline_invoice" icon="mdi-delete-outline" color="error" size="small" variant="text" :aria-label="__('Delete offline invoice')" @click="removeInvoice(index, item)" />
							</div>
						</template>
					</v-data-table>
				</div>
			</section>

			<footer class="offline-dialog-footer">
				<div class="offline-dialog-footer__status">
					<v-icon :color="invoices.length ? 'warning' : 'success'" size="18">{{ invoices.length ? 'mdi-clock-outline' : 'mdi-check-circle-outline' }}</v-icon>
					<span>{{ invoices.length ? __("Invoices are safely queued on this terminal") : __("No synchronization work is pending") }}</span>
				</div>
				<div class="offline-dialog-footer__actions">
					<v-btn v-if="invoices.length" color="primary" variant="flat" prepend-icon="mdi-sync" @click="$emit('sync-all')">{{ __("Sync All") }}</v-btn>
					<v-btn variant="outlined" class="offline-close-action" prepend-icon="mdi-close" @click="dialog = false">{{ __("Close") }}</v-btn>
				</div>
			</footer>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { formatUtils } from "../format";
import {
	deleteInvoiceOutboxEntry,
	deleteOfflineInvoice,
	getInvoiceOutboxMode,
	getInvoiceOutboxRows,
	getOfflineInvoices,
	getPendingOfflineInvoiceCount,
	retryInvoiceOutboxEntry,
} from "../../offline/index";
import PosStatusPill from "./ui/PosStatusPill.vue";

defineOptions({
	name: "OfflineInvoicesDialog",
});

const props = defineProps({
	modelValue: Boolean,
	posProfile: {
		type: Object,
		default: () => ({}),
	},
});

const emit = defineEmits(["update:modelValue", "deleted", "sync-all"]);
const __ = window.__ || ((text) => text);
const get_currency_symbol = window.get_currency_symbol;
const currency_precision = ref(2);

const dialog = ref(props.modelValue);
const invoices = ref([]);
const headers = [
	{
		title: __("Customer"),
		value: "customer",
		align: "start",
		width: "35%",
	},
	{
		title: __("Date"),
		value: "posting_date",
		align: "center",
		width: "20%",
	},
	{
		title: __("Amount"),
		value: "grand_total",
		align: "end",
		width: "25%",
	},
	{
		title: __("Status"),
		value: "status",
		align: "start",
		width: "20%",
	},
	{
		title: __("Actions"),
		value: "actions",
		align: "center",
		width: "12%",
		sortable: false,
	},
];

watch(
	() => props.modelValue,
	(val) => {
		dialog.value = val;
		if (val) {
			void loadInvoices();
		}
	},
);

watch(dialog, (val) => {
	emit("update:modelValue", val);
});

function formatCurrency(value, precision) {
	if (value === null || value === undefined) {
		value = 0;
	}
	let number = Number(formatUtils.fromArabicNumerals(String(value)).replace(/,/g, ""));
	if (isNaN(number)) number = 0;
	let prec = precision != null ? Number(precision) : Number(currency_precision.value) || 2;
	if (!Number.isInteger(prec) || prec < 0 || prec > 20) {
		prec = Math.min(Math.max(parseInt(prec) || 2, 0), 20);
	}

	const locale = formatUtils.getNumberLocale();
	let formatted = number.toLocaleString(locale, {
		minimumFractionDigits: prec,
		maximumFractionDigits: prec,
		useGrouping: true,
	});

	formatted = formatUtils.toArabicNumerals(formatted);
	return formatted;
}

function currencySymbol(currency) {
	return get_currency_symbol?.(currency);
}

function statusTone(status) {
	if (status === "dead_letter") return "danger";
	if (status === "retrying") return "warning";
	if (status === "syncing") return "info";
	return "neutral";
}

function statusLabel(status) {
	const labels = {
		pending: __("Pending"),
		syncing: __("Sending"),
		retrying: __("Retry scheduled"),
		dead_letter: __("Action required"),
	};
	return labels[status] || __("Pending");
}

async function loadInvoices() {
	invoices.value =
		getInvoiceOutboxMode() === "coordinator"
			? await getInvoiceOutboxRows()
			: getOfflineInvoices();
}

async function retryInvoice(item) {
	if (!item?.outbox_id) return;
	await retryInvoiceOutboxEntry(item.outbox_id);
	await loadInvoices();
	emit("sync-all");
}

async function removeInvoice(index, item) {
	if (!props.posProfile.posa_allow_delete_offline_invoice) {
		return;
	}
	if (getInvoiceOutboxMode() === "coordinator" && item?.outbox_id) {
		await deleteInvoiceOutboxEntry(item.outbox_id);
	} else {
		await deleteOfflineInvoice(index);
	}
	await loadInvoices();
	emit("deleted", getPendingOfflineInvoiceCount());
}
</script>

<style>
.offline-state-cell {
	display: grid;
	gap: 6px;
	min-inline-size: 140px;
}

.offline-state-error {
	max-inline-size: 260px;
	overflow: hidden;
	color: var(--pos-error);
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* ========== REVAMPED OFFLINE INVOICES DIALOG ========== */

/* Main Card Styling */
.offline-invoices-card {
	border-radius: 20px !important;
	overflow: hidden;
	background-color: var(--pos-card-bg) !important;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
	border: 1px solid var(--pos-border);
}

/* ========== REVAMPED HEADER SECTION ========== */
.offline-header {
	background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%) !important;
	color: white !important;
	border-bottom: none !important;
	position: relative;
	overflow: hidden;
}

.offline-header::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
	pointer-events: none;
}

.offline-header::after {
	content: "";
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 1px;
	background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
}

/* Header Content Layout */
.header-content-wrapper {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	position: relative;
	z-index: 2;
}

.header-main-content {
	display: flex;
	align-items: center;
	gap: 24px;
	flex: 1;
}

.header-close-section {
	display: flex;
	align-items: center;
}

/* Revamped Icon Wrapper */
.header-icon-wrapper-revamped {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 80px;
	height: 80px;
}

.icon-background {
	position: relative;
	z-index: 2;
	width: 64px;
	height: 64px;
	background: rgba(255, 255, 255, 0.15);
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-radius: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	backdrop-filter: blur(10px);
	transition: all 0.3s ease;
}

.icon-glow {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 80px;
	height: 80px;
	background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
	border-radius: 50%;
	opacity: 0;
	transition: opacity 0.3s ease;
	animation: iconPulse 2s infinite ease-in-out;
}

@keyframes iconPulse {
	0%,
	100% {
		opacity: 0.3;
		transform: translate(-50%, -50%) scale(1);
	}
	50% {
		opacity: 0.6;
		transform: translate(-50%, -50%) scale(1.1);
	}
}

.header-icon-revamped {
	color: white !important;
	filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
}

.icon-background:hover {
	transform: scale(1.05);
	background: rgba(255, 255, 255, 0.25);
	border-color: rgba(255, 255, 255, 0.5);
}

.icon-background:hover + .icon-glow {
	opacity: 0.8;
}

/* Header Text Styling */
.header-text-revamped {
	flex: 1;
	color: white;
}

.header-title-revamped {
	margin: 0 0 8px 0;
	font-weight: 700;
	color: white !important;
	font-size: 2rem;
	letter-spacing: -0.5px;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle-revamped {
	margin: 0 0 16px 0;
	font-size: 16px;
	color: rgba(255, 255, 255, 0.9) !important;
	font-weight: 400;
	letter-spacing: 0.2px;
}

.header-stats-revamped {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}

/* Status Chips */
.status-chip-revamped {
	font-weight: 600 !important;
	border-radius: 12px !important;
	padding: 0 16px !important;
	height: 36px !important;
	backdrop-filter: blur(10px);
	transition: all 0.3s ease;
}

.pending-chip {
	background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%) !important;
	color: white !important;
	box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3) !important;
}

.synced-chip {
	background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%) !important;
	color: white !important;
	box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
}

.status-chip-revamped:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
}

/* Header Close Button - Neutral with Red Icon */
.header-close-btn {
	width: 48px !important;
	height: 48px !important;
	border-radius: 12px !important;
	background: rgba(255, 255, 255, 0.15) !important;
	border: 1px solid rgba(255, 255, 255, 0.2) !important;
	color: #f44336 !important;
	transition: all 0.3s ease !important;
	backdrop-filter: blur(10px);
}

.header-close-btn:hover {
	background: rgba(244, 67, 54, 0.1) !important;
	border-color: rgba(244, 67, 54, 0.3) !important;
	transform: scale(1.05) !important;
	color: #d32f2f !important;
}

/* Force red color for the close icon */
.header-close-btn .v-icon {
	color: #f44336 !important;
}

.header-close-btn:hover .v-icon {
	color: #d32f2f !important;
}

/* Footer Divider */
.footer-divider {
	border-color: rgba(25, 118, 210, 0.1) !important;
	background: linear-gradient(90deg, transparent 0%, rgba(25, 118, 210, 0.2) 50%, transparent 100%);
	height: 2px;
}

/* Content containers */

.white-background {
	background: var(--pos-card-bg);
}

.empty-state {
	padding: var(--dynamic-xl) var(--dynamic-md);
	background: var(--pos-card-bg);
}

.empty-icon-wrapper {
	display: inline-block;
	padding: 20px;
	background: rgba(76, 175, 80, 0.1);
	border-radius: 50%;
}

.empty-icon {
	filter: drop-shadow(0 2px 8px rgba(76, 175, 80, 0.3));
}

.table-container {
	background: var(--pos-card-bg);
}

.table-header {
	padding: 0 var(--dynamic-xs);
	color: var(--pos-text-secondary);
}

.white-table {
	background: var(--pos-card-bg);
	border: 1px solid var(--pos-border);
	border-radius: var(--border-radius-lg);
	overflow: hidden;
}

.white-table :deep(th),
.white-table :deep(td) {
	border-bottom: 1px solid var(--pos-border);
}

:deep(.v-data-table-header) {
	background: var(--pos-table-header-bg);
	border-bottom: 2px solid var(--pos-border);
}

:deep(.v-data-table-header th) {
	font-weight: 600;
	color: var(--pos-text-primary);
	font-size: 0.875rem;
	padding: var(--dynamic-md);
}

:deep(.v-data-table__tr) {
	border-bottom: 1px solid var(--pos-border);
}

:deep(.v-data-table__tr:hover) {
	background-color: var(--pos-table-row-hover);
}

:deep(.v-data-table__td) {
	padding: var(--dynamic-md);
	border-bottom: 1px solid var(--pos-border);
}

/* Enhanced Cell Styling */
.customer-cell {
	display: flex;
	align-items: center;
}

.amount-cell {
	font-family: "Roboto Mono", monospace;
}

.date-chip {
	border-radius: var(--border-radius-sm);
	font-weight: 500;
}

.delete-btn {
	border-radius: var(--border-radius-sm);
	transition: all 0.2s ease;
}

.delete-btn:hover {
	background-color: rgba(244, 67, 54, 0.08);
	transform: scale(1.05);
}

.close-btn {
	border-radius: var(--border-radius-sm);
	text-transform: none;
	font-weight: 500;
	padding: var(--dynamic-sm) var(--dynamic-lg);
}

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 768px) {
	.offline-invoices-card {
		margin: 16px !important;
		border-radius: 16px !important;
	}

	.offline-header {
		padding: 24px !important;
	}

	.header-main-content {
		gap: 16px;
	}

	.header-icon-wrapper-revamped {
		width: 60px;
		height: 60px;
	}

	.icon-background {
		width: 48px;
		height: 48px;
	}

	.header-title-revamped {
		font-size: 1.5rem;
	}

	.header-subtitle-revamped {
		font-size: 14px;
	}

	.dialog-actions-container-revamped {
		flex-direction: column-reverse;
		gap: 16px !important;
		padding: 20px !important;
		min-height: auto;
	}

	.actions-left-section,
	.actions-right-section {
		width: 100%;
		justify-content: center;
	}

	.sync-action-btn-revamped,
	.close-action-btn-revamped {
		min-width: 100% !important;
		margin: 0;
	}

	.table-container {
		overflow-x: auto;
		margin: 0 -16px;
		padding: 0 16px;
	}
}

@media (max-width: 480px) {
	.header-content-wrapper {
		flex-direction: column;
		gap: 16px;
		align-items: flex-start;
	}

	.header-close-section {
		align-self: flex-end;
		position: absolute;
		top: 16px;
		right: 16px;
	}

	.header-main-content {
		width: 100%;
		padding-right: 60px;
	}
}

/* ========== REVAMPED FOOTER ACTIONS ========== */
.dialog-actions-container-revamped {
	background-color: var(--pos-card-bg) !important;
	border-top: 1px solid var(--pos-border) !important;
	padding: 24px 32px !important;
	display: flex !important;
	align-items: center !important;
	justify-content: space-between !important;
	gap: 24px !important;
	min-height: 80px !important;
	width: 100% !important;
	visibility: visible !important;
	opacity: 1 !important;
}

.actions-left-section {
	display: flex;
	align-items: center;
	flex: 1;
}

.actions-right-section {
	display: flex;
	align-items: center;
	gap: 16px;
	flex-shrink: 0;
}

/* Sync Button */
.sync-action-btn-revamped {
	background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%) !important;
	color: white !important;
	border-radius: 14px !important;
	text-transform: none !important;
	font-weight: 600 !important;
	padding: 12px 28px !important;
	min-width: 180px !important;
	height: 48px !important;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3) !important;
	letter-spacing: 0.5px;
	font-size: 15px !important;
}

.sync-action-btn-revamped:hover {
	transform: translateY(-3px) scale(1.02) !important;
	box-shadow: 0 8px 25px rgba(25, 118, 210, 0.4) !important;
	background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%) !important;
}

.sync-action-btn-revamped:active {
	transform: translateY(-1px) scale(0.98) !important;
}

/* Close Button - Neutral with Red Text and Icon */
.close-action-btn-revamped {
	background: var(--pos-button-bg) !important;
	color: #f44336 !important;
	border: 2px solid #f44336 !important;
	border-radius: 14px !important;
	text-transform: none !important;
	font-weight: 600 !important;
	padding: 12px 24px !important;
	min-width: 120px !important;
	height: 48px !important;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
	box-shadow: 0 2px 8px rgba(244, 67, 54, 0.2) !important;
	font-size: 15px !important;
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	visibility: visible !important;
	opacity: 1 !important;
}

.close-action-btn-revamped:hover {
	background: rgba(244, 67, 54, 0.05) !important;
	border-color: #d32f2f !important;
	transform: translateY(-2px) !important;
	box-shadow: 0 4px 16px rgba(244, 67, 54, 0.3) !important;
	color: #d32f2f !important;
}

.close-action-btn-revamped:active {
	transform: translateY(0px) !important;
}

/* Force red color for icon and text */
.close-action-btn-revamped .v-icon,
.close-action-btn-revamped span {
	color: #f44336 !important;
}

.close-action-btn-revamped:hover .v-icon,
.close-action-btn-revamped:hover span {
	color: #d32f2f !important;
}

/* Sync Status Indicator */
.sync-status-indicator {
	display: flex;
	align-items: center;
	padding: 12px 20px;
	background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%);
	border: 1px solid rgba(76, 175, 80, 0.2);
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.sync-status-indicator span {
	font-size: 15px;
	letter-spacing: 0.3px;
}

/* Compact terminal-first dialog. These selectors intentionally supersede the
   legacy decorative rules above while existing installations transition. */
.offline-invoices-card {
	max-height: min(76vh, 650px);
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	border-radius: 16px !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18) !important;
	overflow: hidden;
}

.offline-dialog-header,
.offline-dialog-heading,
.offline-dialog-footer,
.offline-dialog-footer__status,
.offline-dialog-footer__actions,
.offline-customer-cell,
.offline-row-actions {
	display: flex;
	align-items: center;
}

.offline-dialog-header {
	justify-content: space-between;
	gap: 16px;
	min-height: 74px;
	padding: 13px 16px;
	border-bottom: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-muted, #f8fafc);
}

.offline-dialog-heading {
	min-width: 0;
	gap: 12px;
}

.offline-dialog-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 42px;
	height: 42px;
	border-radius: 12px;
	color: var(--pos-primary, #0891a2);
	background: color-mix(in srgb, var(--pos-primary, #0891a2) 12%, transparent);
	border: 1px solid color-mix(in srgb, var(--pos-primary, #0891a2) 24%, transparent);
	flex-shrink: 0;
}

.offline-dialog-copy {
	min-width: 0;
}

.offline-dialog-copy h2,
.offline-table-heading h3,
.offline-empty-state h3 {
	margin: 0;
	color: var(--pos-text-primary, #0f172a);
}

.offline-dialog-copy h2 {
	font-size: 18px;
	font-weight: 750;
}

.offline-dialog-copy p,
.offline-table-heading p,
.offline-empty-state p {
	margin: 3px 0 0;
	font-size: 12px;
	line-height: 1.45;
	color: var(--pos-text-secondary, #64748b);
}

.offline-dialog-close {
	flex-shrink: 0;
	color: var(--pos-text-secondary, #64748b) !important;
}

.offline-dialog-close:hover {
	color: var(--pos-text-primary, #0f172a) !important;
	background: var(--pos-hover-bg, #eef2f7) !important;
}

.offline-dialog-body {
	min-height: 260px;
	max-height: min(58vh, 500px);
	padding: 18px;
	overflow: auto;
	background: var(--pos-surface-raised, #ffffff);
}

.offline-empty-state {
	display: grid;
	place-items: center;
	align-content: center;
	min-height: 235px;
	padding: 24px;
	text-align: center;
	border: 1px dashed var(--pos-border-light, #cbd5e1);
	border-radius: 14px;
	background: color-mix(in srgb, var(--pos-success, #16a34a) 3%, var(--pos-surface-raised, #ffffff));
}

.offline-empty-state__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 68px;
	height: 68px;
	margin-bottom: 12px;
	border-radius: 50%;
	color: var(--pos-success, #16a34a);
	background: color-mix(in srgb, var(--pos-success, #16a34a) 12%, transparent);
}

.offline-empty-state h3,
.offline-table-heading h3 {
	font-size: 16px;
	font-weight: 750;
}

.offline-table-heading {
	margin-bottom: 12px;
}

.offline-invoices-table {
	border: 1px solid var(--pos-border-light, #e2e8f0);
	border-radius: 12px;
	overflow: hidden;
	background: var(--pos-surface-raised, #ffffff) !important;
}

.offline-customer-cell {
	gap: 9px;
	min-width: 0;
}

.offline-customer-cell > div {
	display: grid;
	min-width: 0;
}

.offline-customer-cell strong {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.offline-customer-cell small {
	color: var(--pos-text-secondary, #64748b);
}

.offline-amount {
	color: var(--pos-success, #16a34a);
	white-space: nowrap;
}

.offline-row-actions {
	justify-content: center;
	gap: 4px;
}

.offline-dialog-footer {
	justify-content: space-between;
	gap: 16px;
	min-height: 64px;
	padding: 10px 16px;
	border-top: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-muted, #f8fafc);
}

.offline-dialog-footer__status,
.offline-dialog-footer__actions {
	gap: 8px;
}

.offline-dialog-footer__status {
	font-size: 12px;
	color: var(--pos-text-secondary, #64748b);
}

.offline-close-action {
	color: var(--pos-error, #dc2626) !important;
	border-color: color-mix(in srgb, var(--pos-error, #dc2626) 55%, transparent) !important;
}

.offline-close-action:hover {
	color: #ffffff !important;
	background: var(--pos-error, #dc2626) !important;
	border-color: var(--pos-error, #dc2626) !important;
}

@media (max-width: 700px) {
	.offline-invoices-card {
		max-height: calc(100dvh - 24px);
		border-radius: 14px !important;
	}

	.offline-dialog-heading > .pos-status-pill {
		display: none;
	}

	.offline-dialog-copy p {
		display: none;
	}

	.offline-dialog-body {
		padding: 12px;
	}

	.offline-dialog-footer {
		align-items: stretch;
		flex-direction: column;
	}

	.offline-dialog-footer__status {
		display: none;
	}

	.offline-dialog-footer__actions > * {
		flex: 1 1 0;
	}
}
</style>
