<template>
	<v-dialog
		v-model="dialog"
		:fullscreen="viewportMode === 'phone'"
		:width="viewportMode === 'phone' ? undefined : 'min(800px, calc(100vw - 24px))'"
		:transition="viewportMode === 'phone' ? 'dialog-bottom-transition' : 'dialog-transition'"
	>
		<v-card class="mpesa-dialog" :class="[`mpesa-dialog--${viewportMode}`]">
			<div class="mpesa-dialog__header">
				<h3 class="mpesa-dialog__title">{{ __("Select M-Pesa Payment") }}</h3>
				<v-btn
					icon="mdi-close"
					variant="text"
					density="compact"
					class="mpesa-dialog__close"
					:aria-label="__('Close')"
					@click="close_dialog"
				></v-btn>
			</div>

			<div class="mpesa-dialog__body">
				<div class="mpesa-search-grid">
					<v-text-field
						color="primary"
						variant="outlined"
						:label="__('Full Name')"
						class="sleek-field pos-themed-input"
						hide-details
						v-model="full_name"
						density="compact"
						clearable
					></v-text-field>

					<v-text-field
						color="primary"
						variant="outlined"
						:label="__('Mobile No')"
						class="sleek-field pos-themed-input"
						hide-details
						v-model="mobile_no"
						density="compact"
						clearable
					></v-text-field>

					<v-btn
						variant="tonal"
						color="primary"
						class="mpesa-search-btn"
						:loading="isLoading"
						:disabled="isLoading || isSubmitting"
						@click="search"
					>
						{{ __("Search") }}
					</v-btn>
				</div>

				<div v-if="errorMessage" class="mpesa-error-box">
					<v-icon size="16" color="error">mdi-alert-circle-outline</v-icon>
					<span>{{ errorMessage }}</span>
				</div>

				<div v-if="dialog_data" class="mpesa-table-container">
					<v-data-table
						:headers="headers"
						:items="dialog_data"
						item-key="name"
						class="mpesa-data-table border rounded"
						show-select
						v-model="selected"
						return-object
						select-strategy="single"
						density="compact"
					>
						<template v-slot:item.amount="{ item }">
							<bdi>{{ formatCurrency(item.amount) }}</bdi>
						</template>
						<template v-slot:item.posting_date="{ item }">
							{{ item.posting_date.slice(0, 16) }}
						</template>
					</v-data-table>
				</div>
			</div>

			<div class="mpesa-dialog__footer">
				<v-btn variant="outlined" class="dialog-action-btn" @click="close_dialog">{{ __("Close") }}</v-btn>
				<v-btn
					v-if="selected.length"
					color="primary"
					variant="flat"
					class="dialog-action-btn"
					:loading="isSubmitting"
					:disabled="isSubmitting"
					@click="submit_dialog"
				>
					{{ __("Submit") }}
				</v-btn>
			</div>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { inject, onBeforeUnmount, onMounted, ref } from "vue";
import { formatUtils } from "../../../format";

defineOptions({
	name: "MpesaPayments",
});

const props = defineProps({
	viewportMode: {
		type: String,
		default: "desktop",
	},
});

const __ = (s) =>
	typeof window !== "undefined" && (window.__ || window.frappe?._)
		? (window.__ || window.frappe._)(s)
		: s;
const eventBus = inject("eventBus");

const dialog = ref(false);
const selected = ref([]);
const dialog_data = ref("");
const company = ref("");
const customer = ref("");
const mode_of_payment = ref("");
const full_name = ref("");
const mobile_no = ref("");
const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref("");

const headers = [
	{
		title: __("Full Name"),
		value: "full_name",
		align: "start",
		sortable: true,
	},
	{
		title: __("Mobile No"),
		value: "mobile_no",
		align: "start",
		sortable: true,
	},
	{
		title: __("Amount"),
		value: "amount",
		align: "start",
		sortable: true,
	},
	{
		title: __("Date"),
		align: "start",
		sortable: true,
		value: "posting_date",
	},
];

function close_dialog() {
	dialog.value = false;
}

async function search() {
	if (isLoading.value || isSubmitting.value) {
		return;
	}

	errorMessage.value = "";
	isLoading.value = true;

	try {
		const { message } = await frappe.call({
			method: "posawesome.posawesome.api.m_pesa.get_mpesa_draft_payments",
			args: {
				company: company.value,
				mode_of_payment: mode_of_payment.value,
				mobile_no: mobile_no.value,
				full_name: full_name.value,
			},
		});

		dialog_data.value = message;
	} catch (error) {
		console.error("Failed to search M-Pesa payments:", error);
		errorMessage.value = __("Unable to fetch M-Pesa payments");
	} finally {
		isLoading.value = false;
	}
}

async function submit_dialog() {
	if (isSubmitting.value || selected.value.length === 0) {
		return;
	}

	errorMessage.value = "";
	isSubmitting.value = true;

	try {
		const selected_payment = selected.value[0].name;
		const { message } = await frappe.call({
			method: "posawesome.posawesome.api.m_pesa.submit_mpesa_payment",
			args: {
				mpesa_payment: selected_payment,
				customer: customer.value,
			},
		});

		eventBus?.emit("set_mpesa_payment", message);
		dialog.value = false;
	} catch (error) {
		console.error("Failed to submit M-Pesa payment:", error);
		errorMessage.value = __("Unable to submit the selected payment");
	} finally {
		isSubmitting.value = false;
	}
}

function formatCurrency(value) {
	if (value === null || value === undefined) {
		value = 0;
	}
	let number = Number(formatUtils.fromArabicNumerals(String(value)).replace(/,/g, ""));
	if (isNaN(number)) number = 0;
	let prec = 2;
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

onMounted(() => {
	eventBus?.on("open_mpesa_payments", (data) => {
		dialog.value = true;
		full_name.value = "";
		mobile_no.value = "";
		company.value = data.company;
		customer.value = data.customer;
		mode_of_payment.value = data.mode_of_payment;
		dialog_data.value = "";
		selected.value = [];
		errorMessage.value = "";
		isLoading.value = false;
		isSubmitting.value = false;
	});
});

onBeforeUnmount(() => {
	eventBus?.off("open_mpesa_payments");
});
</script>

<style scoped>
.mpesa-dialog {
	display: flex;
	flex-direction: column;
	background: var(--pos-surface-raised, #ffffff);
	border-radius: var(--payment-radius-md, 10px);
}

.mpesa-dialog--phone {
	height: 100dvh;
	border-radius: 0;
}

.mpesa-dialog__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--payment-space-3, 12px) var(--payment-space-4, 16px);
	border-bottom: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	min-height: 54px;
}

.mpesa-dialog__title {
	margin: 0;
	font-size: var(--payment-font-section, 14px);
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
}

.mpesa-dialog__close {
	width: 40px;
	min-width: 40px;
	height: 40px;
}

.mpesa-dialog--tablet-portrait .mpesa-dialog__close,
.mpesa-dialog--tablet-landscape .mpesa-dialog__close {
	width: 42px;
	min-width: 42px;
	height: 42px;
}

.mpesa-dialog--phone .mpesa-dialog__close {
	width: 44px;
	min-width: 44px;
	height: 44px;
}

.mpesa-dialog__body {
	display: flex;
	flex-direction: column;
	gap: var(--payment-space-3, 12px);
	padding: var(--payment-space-4, 16px);
	flex: 1;
	overflow-y: auto;
}

.mpesa-search-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
	gap: var(--payment-space-2, 8px);
	align-items: center;
}

.mpesa-search-btn {
	min-height: 40px;
}

.mpesa-error-box {
	display: flex;
	align-items: center;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-2, 8px);
	font-size: var(--payment-font-caption, 11px);
	color: rgb(220, 38, 38);
	background: rgba(220, 38, 38, 0.06);
	border-radius: var(--payment-radius-sm, 8px);
}

.mpesa-table-container {
	min-width: 0;
	overflow-x: auto;
}

.mpesa-dialog__footer {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: var(--payment-space-2, 8px);
	padding: var(--payment-space-3, 12px) var(--payment-space-4, 16px);
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
}

.dialog-action-btn {
	min-height: 40px;
}

.mpesa-dialog--tablet-portrait .dialog-action-btn,
.mpesa-dialog--tablet-landscape .dialog-action-btn {
	min-height: 42px;
}

.mpesa-dialog--phone .dialog-action-btn {
	min-height: 44px;
}

.pos-themed-input :deep(.v-field__input) {
	font-weight: 500;
}

@media (max-width: 899px) {
	.mpesa-search-grid {
		grid-template-columns: 1fr;
	}

	.mpesa-search-btn {
		min-height: 44px;
	}

	.mpesa-dialog__footer {
		flex-direction: column;
		align-items: stretch;
	}

	.mpesa-dialog--phone .mpesa-dialog__footer {
		padding-bottom: max(var(--payment-space-3, 12px), env(safe-area-inset-bottom));
	}
}
</style>
