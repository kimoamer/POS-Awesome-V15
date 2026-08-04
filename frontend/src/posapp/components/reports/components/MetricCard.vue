<template>
	<v-card flat class="metric-card pos-themed-card" :class="styleClass">
		<div class="metric-card__header">
			<span class="metric-card__label">{{ label }}</span>
			<div class="metric-card__icon-box">
				<v-icon size="18">{{ icon }}</v-icon>
			</div>
		</div>
		<div class="metric-card__value">{{ value }}</div>
	</v-card>
</template>

<script setup lang="ts">
defineProps<{
	label: string;
	value: string;
	icon: string;
	styleClass?: string;
}>();
</script>

<style scoped>
.metric-card {
	padding: 14px 16px;
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	border-radius: var(--pos-radius-section, 14px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02) !important;
	transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease !important;
}

.metric-card:hover {
	transform: translateY(-2px);
	border-color: color-mix(in srgb, var(--pos-primary, #0284c7) 30%, var(--pos-border-light, #e2e8f0)) !important;
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05) !important;
}

.metric-card__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.metric-card__label {
	font-size: 11px;
	font-weight: 750;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--pos-text-muted, #64748b);
}

.metric-card__icon-box {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: color-mix(in srgb, var(--pos-primary, #0284c7) 10%, var(--pos-surface-raised, #ffffff));
	color: var(--pos-primary, #0284c7);
}

.metric-card__value {
	font-size: 20px;
	font-weight: 800;
	line-height: 1.15;
	color: var(--pos-text-primary, #0f172a);
	letter-spacing: -0.02em;
}
</style>
