<template>
	<div class="dashboard-tabs mb-4">
		<div class="dashboard-tabs--desktop">
			<div class="dashboard-segmented-strip">
				<v-btn
					v-for="tab in tabs"
					:key="`tab-${tab.value}`"
					variant="text"
					class="segmented-tab-btn"
					:class="{ 'segmented-tab-btn--active': activeTab === tab.value }"
					@click="emit('update:activeTab', tab.value)"
				>
					<v-icon size="16" class="tab-icon">{{ tab.icon }}</v-icon>
					<span class="tab-label">{{ tab.label }}</span>
				</v-btn>
			</div>
		</div>
		<div class="dashboard-tabs--mobile">
			<div class="mobile-tabs-grid">
				<v-btn
					v-for="tab in tabs"
					:key="`tab-card-${tab.value}`"
					:variant="activeTab === tab.value ? 'flat' : 'outlined'"
					:color="activeTab === tab.value ? 'primary' : 'default'"
					class="tab-card-btn"
					@click="emit('update:activeTab', tab.value)"
				>
					<v-icon size="16" start>{{ tab.icon }}</v-icon>
					<span class="tab-card-label">{{ tab.label }}</span>
				</v-btn>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
type DashboardTab =
	| "sales"
	| "staff"
	| "customers"
	| "finance"
	| "branches"
	| "products"
	| "inventory"
	| "procurement";

defineProps<{
	activeTab: DashboardTab;
	tabs: Array<{ value: DashboardTab; label: string; icon: string }>;
}>();

const emit = defineEmits<{
	(event: "update:activeTab", value: DashboardTab): void;
}>();
</script>

<style scoped>
.dashboard-tabs--desktop {
	display: flex;
	width: 100%;
	overflow-x: auto;
	scrollbar-width: none;
}

.dashboard-tabs--desktop::-webkit-scrollbar {
	display: none;
}

.dashboard-segmented-strip {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	border-radius: var(--pos-radius-section, 12px);
	background: var(--pos-surface-raised, #ffffff);
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
	max-width: 100%;
}

.segmented-tab-btn {
	height: 36px !important;
	min-height: 36px !important;
	padding-inline: 14px !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	font-size: 13px !important;
	font-weight: 680 !important;
	text-transform: none !important;
	letter-spacing: 0 !important;
	color: var(--pos-text-muted, #64748b) !important;
	gap: 6px;
	transition: all 0.16s ease !important;
}

.segmented-tab-btn:hover {
	background: color-mix(in srgb, var(--pos-primary, #0284c7) 8%, transparent) !important;
	color: var(--pos-text-primary, #0f172a) !important;
}

.segmented-tab-btn--active {
	background: color-mix(in srgb, var(--pos-primary, #0284c7) 12%, var(--pos-surface-raised, #ffffff)) !important;
	color: var(--pos-primary, #0284c7) !important;
	font-weight: 780 !important;
	box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pos-primary, #0284c7) 22%, transparent);
}

.dashboard-tabs--mobile {
	display: none;
}

@media (max-width: 768px) {
	.dashboard-tabs--desktop {
		display: none;
	}

	.dashboard-tabs--mobile {
		display: block;
	}

	.mobile-tabs-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px;
	}

	.tab-card-btn {
		height: 38px !important;
		border-radius: var(--pos-radius-control, 8px) !important;
		font-size: 12px !important;
		font-weight: 700 !important;
		text-transform: none !important;
		justify-content: flex-start !important;
		padding-inline: 10px !important;
	}
}
</style>
