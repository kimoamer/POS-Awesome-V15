<template>
	<div class="invoice-action-bar">
		<!-- Secondary Direct Actions -->
		<div class="invoice-action-bar__secondary">
			<v-btn
				v-for="action in directActions"
				:key="action.key"
				variant="tonal"
				color="secondary"
				class="invoice-action-btn invoice-action-btn--secondary"
				:loading="action.loading"
				data-pos-keyboard-target="invoice-action"
				@click="handleAction(action.key)"
			>
				<v-icon start size="small">{{ action.icon }}</v-icon>
				<span>{{ action.label }}</span>
			</v-btn>

			<!-- More Actions Menu -->
			<v-menu v-if="menuActions.length > 0" location="top end" offset="6">
				<template #activator="{ props: menuProps }">
					<v-btn
						v-bind="menuProps"
						variant="tonal"
						color="secondary"
						class="invoice-action-btn invoice-action-btn--more"
						data-pos-keyboard-target="invoice-action"
					>
						<v-icon start size="small">mdi-dots-horizontal</v-icon>
						<span>{{ __("More") }}</span>
						<v-icon end size="x-small">mdi-chevron-down</v-icon>
					</v-btn>
				</template>

				<v-list density="compact" class="invoice-actions-menu py-1">
					<v-list-item
						v-for="action in normalMenuActions"
						:key="action.key"
						:value="action.key"
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
		</div>

		<!-- Primary Pay Button -->
		<div class="invoice-action-bar__primary">
			<v-btn
				color="primary"
				size="large"
				variant="flat"
				class="invoice-pay-btn"
				:loading="paymentLoading"
				data-pos-keyboard-target="pay"
				@click="$emit('show-payment')"
			>
				<v-icon start size="medium">mdi-credit-card-outline</v-icon>
				<span class="pay-btn__label">{{ __("Pay") }}</span>
				<bdi class="pay-btn__amount" v-if="payableTotalFormatted">
					· {{ payableTotalFormatted }}
				</bdi>
			</v-btn>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useInvoiceFooterActions } from "../../../composables/pos/invoice/useInvoiceFooterActions";
import { formatMoney } from "../../../composables/pos/shared/useMoneyFormatter";

interface Props {
	pos_profile?: any;
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

const { directActions, menuActions } = useInvoiceFooterActions({
	posProfile: computed(() => props.pos_profile).value,
	saveLoading: props.saveLoading,
	loadDraftsLoading: props.loadDraftsLoading,
	selectOrderLoading: props.selectOrderLoading,
	cancelLoading: props.cancelLoading,
	invoiceManagementLoading: props.invoiceManagementLoading,
	returnsLoading: props.returnsLoading,
	printLoading: props.printLoading,
	customerDisplayLoading: props.customerDisplayLoading,
});

const normalMenuActions = computed(() => menuActions.value.filter((a) => !a.danger));
const dangerMenuActions = computed(() => menuActions.value.filter((a) => a.danger));

const payableTotalFormatted = computed(() => {
	const amount = Number(props.subtotal || 0);
	if (!props.formatCurrency || !props.currencySymbol) return String(amount);
	return formatMoney(amount, props.formatCurrency, props.currencySymbol, props.displayCurrency);
});

function handleAction(key) {
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
</script>

<style scoped>
.invoice-action-bar {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
}

.invoice-action-bar__secondary {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: nowrap;
}

.invoice-action-bar__primary {
	flex: 1 1 auto;
	min-width: 0;
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
