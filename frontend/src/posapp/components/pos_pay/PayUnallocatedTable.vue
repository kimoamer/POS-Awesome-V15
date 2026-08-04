<!-- eslint-disable vue/multi-word-component-names -->
<template>
	<div v-if="posProfile?.posa_allow_reconcile_payments" class="pay-unallocated-section mb-3">
		<div class="d-flex flex-wrap align-center justify-space-between mb-2">
			<div class="d-flex align-center gap-1">
				<h3 class="text-body-2 font-weight-bold mb-0 text-primary d-flex align-center gap-1">
					<v-icon size="15" color="primary">mdi-cash-multiple</v-icon>
					{{ resolvedSectionTitle }}
				</h3>
				<v-chip v-if="totalUnallocated" color="info" variant="tonal" size="x-small" class="font-weight-bold">
					{{ __("Total Unallocated") }}: {{ currencySymbol(posProfile.currency) }}{{ formatCurrency(totalUnallocated) }}
				</v-chip>
			</div>
			<div v-if="totalSelected">
				<v-chip color="success" variant="flat" size="x-small" class="font-weight-bold">
					{{ __("Selected Payments") }}: {{ currencySymbol(posProfile.currency) }}{{ formatCurrency(totalSelected) }}
				</v-chip>
			</div>
		</div>

		<div class="pos-table-card">
			<v-data-table
				:headers="headers"
				:items="payments"
				item-key="name"
				density="compact"
				class="pos-unallocated-data-table"
				:loading="loading"
				:row-props="paymentRowProps"
			>
				<template v-slot:item.select="{ item }">
					<v-checkbox
						v-model="internalSelectedPayments"
						:value="item"
						color="primary"
						hide-details
						density="compact"
						@click.stop
					></v-checkbox>
				</template>
				<template v-slot:item.name="{ item }">
					<span class="text-primary font-weight-bold">
						{{ item.name }}
					</span>
				</template>
				<template v-slot:item.mode_of_payment="{ item }">
					<span
						class="mode-badge"
						:class="
							item?.is_credit_note || item?.mode_of_payment === 'Cash'
								? 'mode-badge--cash'
								: item?.mode_of_payment === 'Bank Transfer'
									? 'mode-badge--bank'
									: 'mode-badge--cheque'
						"
					>
						{{ item?.is_credit_note ? __("Credit Note") : __(item?.mode_of_payment) }}
					</span>
				</template>
				<template v-slot:item.reference_invoice="{ item }">
					<span v-if="item?.is_credit_note && item?.reference_invoice" class="font-weight-medium">
						{{ item.reference_invoice }}
					</span>
					<span v-else class="text-muted">-</span>
				</template>
				<template v-slot:item.paid_amount="{ item }">
					<span class="font-weight-medium">
						{{ currencySymbol(item.currency) }}
						{{ formatCurrency(item.paid_amount) }}
					</span>
				</template>
				<template v-slot:item.unallocated_amount="{ item }">
					<span class="text-primary font-weight-bold">
						{{ currencySymbol(item.currency) }} {{ formatCurrency(item.unallocated_amount) }}
					</span>
				</template>
				<template v-slot:item.actions>
					<v-btn icon variant="text" size="x-small" color="medium-emphasis">
						<v-icon size="16">mdi-eye-outline</v-icon>
					</v-btn>
				</template>
			</v-data-table>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";

const __ = (text) => (window.__ ? window.__(text) : text);

const props = defineProps({
	payments: Array,
	selectedPayments: Array,
	posProfile: Object,
	totalUnallocated: Number,
	totalSelected: Number,
	loading: Boolean,
	headers: Array,
	sectionTitle: String,
	currencySymbol: Function,
	formatCurrency: Function,
	paymentRowClass: Function,
});

const emit = defineEmits(["update:selectedPayments"]);

const internalSelectedPayments = computed({
	get: () => props.selectedPayments,
	set: (val) => emit("update:selectedPayments", val),
});

const resolvedSectionTitle = computed(() => props.sectionTitle || __("Recent Payments"));

const paymentRowProps = ({ item }) => {
	if (!props.paymentRowClass) {
		return {};
	}
	const rowClass = props.paymentRowClass(item);
	return rowClass ? { class: rowClass } : {};
};
</script>

<style scoped>
.mode-badge {
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 11.5px;
	font-weight: 750;
}

.mode-badge--cash {
	background: #dcfce7 !important;
	color: #15803d !important;
}

.mode-badge--bank {
	background: #e0f2fe !important;
	color: #0369a1 !important;
}

.mode-badge--cheque {
	background: #f3e8ff !important;
	color: #7e22ce !important;
}

.pos-table-card {
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	border-radius: var(--pos-radius-section, 12px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	overflow: hidden;
}

:deep(.v-data-table) {
	background: transparent !important;
}

:deep(.v-data-table-header th) {
	background: var(--pos-surface-muted, #f8fafc) !important;
	font-size: 11px !important;
	font-weight: 800 !important;
	text-transform: uppercase !important;
	letter-spacing: 0.04em !important;
	color: var(--pos-text-muted, #64748b) !important;
	border-bottom: 1px solid var(--pos-border-light, #e2e8f0) !important;
}

:deep(.v-data-table__tr) {
	transition: background-color 0.16s ease !important;
	cursor: pointer;
}

:deep(.v-data-table__tr td) {
	font-size: 12px !important;
	padding-top: 4px !important;
	padding-bottom: 4px !important;
	height: 36px !important;
}

:deep(.v-data-table__tr:hover) {
	background: color-mix(in srgb, var(--pos-primary, #0284c7) 6%, var(--pos-surface-raised, #ffffff)) !important;
}

/* Preserve selected background on hover */
:deep(.v-data-table__tr.selected-row:hover),
:deep(.v-data-table__tr.selected-row:hover td) {
	background: rgba(var(--v-theme-primary), 0.18) !important;
}

@media (max-width: 768px) {
	:deep(.v-data-table th),
	:deep(.v-data-table td) {
		padding-inline: 6px !important;
		font-size: 11.5px !important;
		white-space: nowrap;
	}
}

@media (max-width: 600px) {
	/* Hide Customer (3), Date (4), Reference (6) on mobile (<600px) */
	:deep(.v-data-table th:nth-child(3)),
	:deep(.v-data-table td:nth-child(3)),
	:deep(.v-data-table th:nth-child(4)),
	:deep(.v-data-table td:nth-child(4)),
	:deep(.v-data-table th:nth-child(6)),
	:deep(.v-data-table td:nth-child(6)) {
		display: none !important;
	}
}
</style>
