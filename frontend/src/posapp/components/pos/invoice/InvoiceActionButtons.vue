<template>
	<div class="invoice-action-bar" :class="{ 'invoice-action-bar--compact': compactExternalPay }">
		<!-- Compact 3-Icon Slots (Save, Drafts, More) -->
		<template v-if="compactExternalPay">
			<v-btn
				variant="tonal"
				color="secondary"
				class="cmd-icon-btn invoice-action-btn"
				:loading="saveLoading"
				:disabled="!hasItems || saveLoading"
				:aria-label="__('Save & Clear')"
				@click="handleAction('saveAndClear')"
			>
				<v-icon size="small">mdi-content-save-outline</v-icon>
			</v-btn>

			<v-btn
				variant="tonal"
				color="secondary"
				class="cmd-icon-btn invoice-action-btn"
				:loading="loadDraftsLoading"
				:disabled="loadDraftsLoading"
				:aria-label="__('Drafts')"
				@click="handleAction('loadDrafts')"
			>
				<v-icon size="small">mdi-file-document-outline</v-icon>
			</v-btn>

			<v-menu
				v-if="menuActions.length > 0"
				v-model="moreMenuOpen"
				location="top end"
				offset="6"
			>
				<template #activator="{ props: menuProps }">
					<v-btn
						v-bind="menuProps"
						variant="tonal"
						color="secondary"
						class="cmd-icon-btn invoice-action-btn"
						:aria-label="__('More invoice actions')"
					>
						<v-icon size="small">mdi-dots-horizontal</v-icon>
					</v-btn>
				</template>

				<v-list density="compact" class="invoice-actions-menu py-1">
					<v-list-item
						v-for="action in normalMenuActions"
						:key="action.key"
						:value="action.key"
						:disabled="action.loading"
						@click="handleAction(action.key)"
					>
						<template #prepend>
							<v-icon size="small" class="mr-2">{{ action.icon }}</v-icon>
						</template>
						<v-list-item-title>{{ action.label }}</v-list-item-title>
					</v-list-item>

					<v-divider v-if="dangerMenuActions.length > 0 && normalMenuActions.length > 0" class="my-1" />

					<v-list-item
						v-for="action in dangerMenuActions"
						:key="action.key"
						:value="action.key"
						color="error"
						class="text-error"
						:disabled="action.loading"
						@click="handleAction(action.key)"
					>
						<template #prepend>
							<v-icon size="small" color="error" class="mr-2">{{ action.icon }}</v-icon>
						</template>
						<v-list-item-title class="text-error font-weight-medium">
							{{ action.label }}
						</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
		</template>

		<!-- Desktop Standard Layout -->
		<template v-else>
			<div class="invoice-action-bar__secondary">
				<v-btn
					v-for="action in directActions"
					:key="action.key"
					variant="tonal"
					color="secondary"
					class="invoice-action-btn invoice-action-btn--secondary"
					:loading="action.loading"
					:disabled="action.loading"
					data-pos-keyboard-target="invoice-action"
					:title="action.label"
					:aria-label="action.label"
					@click="handleAction(action.key)"
				>
					<v-icon size="small" class="action-btn-icon">{{ action.icon }}</v-icon>
					<span class="action-btn-text ml-1">{{ action.label }}</span>
				</v-btn>

				<!-- More Actions Menu -->
				<v-menu
					v-if="menuActions.length > 0"
					v-model="moreMenuOpen"
					location="top end"
					offset="6"
					:aria-expanded="moreMenuOpen"
					aria-haspopup="menu"
				>
					<template #activator="{ props: menuProps }">
						<v-btn
							v-bind="menuProps"
							variant="tonal"
							color="secondary"
							class="invoice-action-btn invoice-action-btn--more"
							data-pos-keyboard-target="invoice-action"
							:title="__('More invoice actions')"
							:aria-label="__('More invoice actions')"
						>
							<v-icon size="small" class="action-btn-icon">mdi-dots-horizontal</v-icon>
							<span class="action-btn-text ml-1">{{ __("More") }}</span>
							<v-icon size="x-small" class="action-btn-chevron ml-1">mdi-chevron-down</v-icon>
						</v-btn>
					</template>

					<v-list density="compact" class="invoice-actions-menu py-1">
						<v-list-item
							v-for="action in normalMenuActions"
							:key="action.key"
							:value="action.key"
							:disabled="action.loading"
							@click="handleAction(action.key)"
						>
							<template #prepend>
								<v-progress-circular
									v-if="action.loading"
									indeterminate
									size="18"
									width="2"
									class="mr-2"
								/>
								<v-icon v-else size="small" class="mr-2">{{ action.icon }}</v-icon>
							</template>
							<v-list-item-title>{{ action.label }}</v-list-item-title>
						</v-list-item>

						<v-divider v-if="dangerMenuActions.length > 0 && normalMenuActions.length > 0" class="my-1" />

						<v-list-item
							v-for="action in dangerMenuActions"
							:key="action.key"
							:value="action.key"
							color="error"
							class="text-error"
							:disabled="action.loading"
							@click="handleAction(action.key)"
						>
							<template #prepend>
								<v-progress-circular
									v-if="action.loading"
									indeterminate
									size="18"
									width="2"
									color="error"
									class="mr-2"
								/>
								<v-icon v-else size="small" color="error" class="mr-2">{{ action.icon }}</v-icon>
							</template>
							<v-list-item-title class="text-error font-weight-medium">
								{{ action.label }}
							</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>

			<!-- Primary Pay Button -->
			<div class="invoice-action-bar__primary">
				<v-btn
					color="primary"
					size="large"
					variant="flat"
					class="invoice-pay-btn"
					:loading="paymentLoading"
					:disabled="!hasItems || paymentLoading || payClickLocked"
					data-pos-keyboard-target="pay"
					@click="handlePayClick"
				>
					<v-icon start size="medium">mdi-credit-card-outline</v-icon>
					<span class="pay-btn__label">{{ __("Pay") }}</span>
					<bdi class="pay-btn__amount" v-if="payableTotalFormatted">
						· {{ payableTotalFormatted }}
					</bdi>
				</v-btn>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import { useInvoiceFooterActions } from "../../../composables/pos/invoice/useInvoiceFooterActions";
import { formatMoney } from "../../../composables/pos/shared/useMoneyFormatter";

interface Props {
	compactExternalPay?: boolean;
	pos_profile?: any;
	hasItems?: boolean;
	saveLoading?: boolean;
	loadDraftsLoading?: boolean;
	selectOrderLoading?: boolean;
	cancelLoading?: boolean;
	invoiceManagementLoading?: boolean;
	returnsLoading?: boolean;
	printLoading?: boolean;
	paymentLoading?: boolean;
	customerDisplayLoading?: boolean;
	subtotal?: number;
	displayCurrency?: string;
	formatCurrency?: (_val: any) => string;
	currencySymbol?: (_currency?: string) => string;
}

const props = withDefaults(defineProps<Props>(), {
	pos_profile: () => ({}),
	hasItems: true,
});

const emit = defineEmits([
	"save-and-clear",
	"load-drafts",
	"select-order",
	"cancel-sale",
	"open-invoice-management",
	"open-returns",
	"print-draft",
	"show-payment",
	"open-customer-display",
]);

const __ = (window as any).__ || ((s: string) => s);

const moreMenuOpen = ref(false);
const payClickLocked = ref(false);

const posProfileRef = toRef(props, "pos_profile");
const saveLoadingRef = toRef(props, "saveLoading");
const loadDraftsLoadingRef = toRef(props, "loadDraftsLoading");
const selectOrderLoadingRef = toRef(props, "selectOrderLoading");
const cancelLoadingRef = toRef(props, "cancelLoading");
const invoiceManagementLoadingRef = toRef(props, "invoiceManagementLoading");
const returnsLoadingRef = toRef(props, "returnsLoading");
const printLoadingRef = toRef(props, "printLoading");
const customerDisplayLoadingRef = toRef(props, "customerDisplayLoading");

const { footerActions, directActions, menuActions } = useInvoiceFooterActions({
	posProfile: posProfileRef,
	saveLoading: saveLoadingRef,
	loadDraftsLoading: loadDraftsLoadingRef,
	selectOrderLoading: selectOrderLoadingRef,
	cancelLoading: cancelLoadingRef,
	invoiceManagementLoading: invoiceManagementLoadingRef,
	returnsLoading: returnsLoadingRef,
	printLoading: printLoadingRef,
	customerDisplayLoading: customerDisplayLoadingRef,
});

const normalMenuActions = computed(() => menuActions.value.filter((a) => !a.danger));
const dangerMenuActions = computed(() => menuActions.value.filter((a) => a.danger));

const actionByKey = computed(() => {
	return new Map(footerActions.value.map((action) => [action.key, action]));
});

const payableTotalFormatted = computed(() => {
	const amount = Number(props.subtotal || 0);
	if (!props.formatCurrency || !props.currencySymbol) return String(amount);
	return formatMoney(amount, props.formatCurrency, props.currencySymbol, props.displayCurrency);
});

function handleAction(key: string) {
	const action = actionByKey.value.get(key);
	if (!action || !action.visible || action.loading) {
		return;
	}

	moreMenuOpen.value = false;

	switch (key) {
		case "save":
			emit("save-and-clear");
			break;
		case "drafts":
			emit("load-drafts");
			break;
		case "select-order":
			emit("select-order");
			break;
		case "invoice-management":
			emit("open-invoice-management");
			break;
		case "return":
			emit("open-returns");
			break;
		case "print":
			emit("print-draft");
			break;
		case "customer-display":
			emit("open-customer-display");
			break;
		case "cancel":
			emit("cancel-sale");
			break;
	}
}

async function handlePayClick() {
	if (!props.hasItems || props.paymentLoading || payClickLocked.value) {
		return;
	}

	payClickLocked.value = true;
	try {
		emit("show-payment");
	} finally {
		window.setTimeout(() => {
			payClickLocked.value = false;
		}, 250);
	}
}
</script>

<style scoped>
.invoice-action-bar {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
}

.invoice-action-bar__secondary {
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: nowrap;
}

.invoice-action-bar__primary {
	flex: 1 1 auto;
	min-width: 0;
}

@container (max-width: 480px) {
	.invoice-action-bar {
		flex-direction: row !important;
		flex-wrap: nowrap !important;
		gap: 6px !important;
		width: 100% !important;
	}

	.invoice-action-bar__secondary {
		flex: 0 0 auto !important;
		width: auto !important;
		gap: 4px !important;
		flex-wrap: nowrap !important;
	}

	.invoice-action-bar__secondary .invoice-action-btn {
		width: 40px !important;
		min-width: 40px !important;
		height: 44px !important;
		padding: 0 !important;
		justify-content: center !important;
	}

	.invoice-action-bar__secondary .action-btn-text,
	.invoice-action-bar__secondary .action-btn-chevron {
		display: none !important;
	}

	.invoice-action-bar__secondary .action-btn-icon {
		margin: 0 !important;
	}

	.invoice-action-bar__primary {
		flex: 1 1 auto !important;
		min-width: 0 !important;
	}
}

.invoice-action-btn {
	height: 44px !important;
	min-width: 44px !important;
	border-radius: var(--pos-radius-md, 10px) !important;
	font-weight: 600 !important;
	text-transform: none !important;
	letter-spacing: normal !important;
}

.invoice-pay-btn {
	width: 100%;
	height: 48px !important;
	border-radius: var(--pos-radius-md, 12px) !important;
	font-weight: 700 !important;
	font-size: 1.05rem !important;
	text-transform: none !important;
	letter-spacing: 0.02em !important;
	box-shadow: var(--pos-shadow-sm, 0 2px 6px rgba(37, 99, 235, 0.25)) !important;
}

.pay-btn__label {
	font-weight: 750;
}

.pay-btn__amount {
	font-weight: 700;
	margin-inline-start: 4px;
}

.invoice-actions-menu {
	border-radius: var(--pos-radius-md, 10px) !important;
	min-width: 180px;
}

@media (max-width: 767px) {
	.invoice-action-bar {
		gap: 6px;
	}

	.invoice-action-bar__secondary {
		gap: 6px;
	}

	.invoice-action-btn {
		height: 42px !important;
		padding-inline: 10px !important;
		font-size: 0.85rem !important;
	}

	.invoice-pay-btn {
		height: 44px !important;
		font-size: 0.95rem !important;
	}
}
</style>
