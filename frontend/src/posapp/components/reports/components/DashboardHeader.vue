<template>
	<div class="dashboard-toolbar mb-4">
		<div class="dashboard-branding">
			<h1 class="dashboard-title mb-1">{{ __("Dashboard") }}</h1>
			<p class="dashboard-sub mb-0">
				{{ __("Real-time POS insights for retail operations.") }}
			</p>
			<div class="dashboard-meta mt-2">
				<v-chip size="x-small" color="secondary" variant="tonal" class="mr-1 mb-1 font-weight-bold">
					{{ scopeDisplayLabel }}
				</v-chip>
				<v-chip size="x-small" color="info" variant="tonal" class="mr-1 mb-1 font-weight-bold">
					{{ __("Profiles") }}: {{ selectedProfilesCount }}
				</v-chip>
				<v-chip size="x-small" :color="profitMethodColor" variant="tonal" class="mr-1 mb-1 font-weight-bold">
					{{ profitMethodLabel }}
				</v-chip>
			</div>
		</div>
		<div class="dashboard-actions">
			<v-select
				:model-value="dashboardScope"
				:items="dashboardScopeItems"
				item-title="label"
				item-value="value"
				density="compact"
				variant="outlined"
				hide-details
				:disabled="!isPosSupervisor"
				class="dashboard-filter pos-themed-input"
				:label="__('Scope')"
				@update:modelValue="emit('update:dashboardScope', $event)"
			/>
			<v-select
				v-if="dashboardScope === 'specific'"
				:model-value="selectedProfileFilter"
				:items="profileFilterItems"
				item-title="label"
				item-value="value"
				density="compact"
				variant="outlined"
				hide-details
				:disabled="!isPosSupervisor"
				class="dashboard-filter pos-themed-input"
				:label="__('Profile')"
				@update:modelValue="emit('update:selectedProfileFilter', String($event || ''))"
			/>
			<v-text-field
				:model-value="selectedReportMonth"
				type="month"
				:max="currentMonthToken"
				density="compact"
				variant="outlined"
				hide-details
				:disabled="!isPosSupervisor"
				class="dashboard-filter pos-themed-input"
				:label="__('Month')"
				@update:modelValue="emit('update:selectedReportMonth', String($event || ''))"
			/>
			<v-chip
				v-if="lastUpdatedLabel"
				size="small"
				variant="tonal"
				color="primary"
				class="last-updated-chip font-weight-bold"
			>
				{{ lastUpdatedLabel }}
			</v-chip>
			<v-btn
				color="primary"
				variant="flat"
				class="refresh-btn"
				:loading="loading"
				:disabled="!isPosSupervisor"
				@click="emit('refresh')"
			>
				<v-icon start size="18">mdi-refresh</v-icon>
				{{ __("Refresh") }}
			</v-btn>
		</div>
	</div>
</template>

<script setup lang="ts">
type DashboardScope = "all" | "current" | "specific";
type SelectItem<T extends string = string> = {
	label: string;
	value: T;
};

defineProps<{
	scopeDisplayLabel: string;
	selectedProfilesCount: number;
	profitMethodLabel: string;
	profitMethodColor: string;
	dashboardScope: DashboardScope;
	dashboardScopeItems: SelectItem<DashboardScope>[];
	selectedProfileFilter: string;
	profileFilterItems: SelectItem[];
	selectedReportMonth: string;
	currentMonthToken: string;
	lastUpdatedLabel: string;
	isPosSupervisor: boolean;
	loading: boolean;
}>();

const emit = defineEmits<{
	(event: "update:dashboardScope", value: DashboardScope): void;
	(event: "update:selectedProfileFilter", value: string): void;
	(event: "update:selectedReportMonth", value: string): void;
	(event: "refresh"): void;
}>();

const __ = (value: string) => (window.__ ? window.__(value) : value);
</script>

<style scoped>
.dashboard-toolbar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 20px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	border-radius: var(--pos-radius-section, 14px);
	background: var(--pos-surface-raised, #ffffff);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.dashboard-title {
	font-size: var(--pos-font-section-title, 20px) !important;
	font-weight: 800 !important;
	letter-spacing: -0.015em;
	color: var(--pos-text-primary, #0f172a);
}

.dashboard-sub {
	font-size: 13px;
	color: var(--pos-text-muted, #64748b);
}

.dashboard-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.dashboard-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.dashboard-filter {
	min-width: 140px;
	max-width: 180px;
}

.dashboard-filter :deep(.v-field) {
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	min-height: 38px !important;
	height: 38px !important;
}

.dashboard-filter :deep(.v-field__input) {
	min-height: 38px !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
	font-size: 12.5px !important;
	font-weight: 650 !important;
}

.refresh-btn {
	height: 38px !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	font-weight: 750 !important;
	text-transform: none !important;
	letter-spacing: 0 !important;
	padding-inline: 16px !important;
}

@media (max-width: 768px) {
	.dashboard-toolbar {
		padding: 12px 14px;
		gap: 12px;
	}

	.dashboard-actions {
		width: 100%;
		justify-content: flex-start;
	}

	.dashboard-filter {
		min-width: 100%;
		max-width: 100%;
	}
}
</style>
