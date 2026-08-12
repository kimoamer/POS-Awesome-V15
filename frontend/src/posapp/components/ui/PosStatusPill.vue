<template>
	<span class="pos-status-pill" :class="`pos-status-pill--${tone}`" role="status">
		<span v-if="dot" class="pos-status-pill__dot" aria-hidden="true" />
		<v-icon v-if="icon" :icon="icon" :size="15" aria-hidden="true" />
		<span><slot /></span>
	</span>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		tone?: "neutral" | "success" | "warning" | "danger" | "info";
		icon?: string;
		dot?: boolean;
	}>(),
	{ tone: "neutral", dot: false },
);
</script>

<style scoped>
.pos-status-pill {
	min-block-size: 28px;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding-inline: 10px;
	border: 1px solid var(--pill-border, var(--pos-border));
	border-radius: 999px;
	background: var(--pill-bg, var(--pos-surface-muted));
	color: var(--pill-color, var(--pos-text-secondary));
	font-size: var(--pos-font-label, 12px);
	font-weight: 700;
}
.pos-status-pill--success { --pill-bg: var(--pos-success-container); --pill-color: var(--pos-success); --pill-border: color-mix(in srgb, var(--pos-success) 30%, transparent); }
.pos-status-pill--warning { --pill-bg: var(--pos-warning-container); --pill-color: #a15c00; --pill-border: color-mix(in srgb, var(--pos-warning) 35%, transparent); }
.pos-status-pill--danger { --pill-bg: var(--pos-error-container); --pill-color: var(--pos-error); --pill-border: color-mix(in srgb, var(--pos-error) 35%, transparent); }
.pos-status-pill--info { --pill-bg: var(--pos-info-container); --pill-color: var(--pos-info); --pill-border: color-mix(in srgb, var(--pos-info) 35%, transparent); }
.pos-status-pill__dot { inline-size: 7px; block-size: 7px; border-radius: 50%; background: currentColor; }
</style>
