<template>
	<button
		type="button"
		class="pos-icon-button"
		:class="[`pos-icon-button--${tone}`]"
		:disabled="disabled"
		:aria-label="label"
		:title="label"
	>
		<v-icon :icon="icon" :size="size" aria-hidden="true" />
		<span v-if="badge" class="pos-icon-button__badge" aria-hidden="true">{{ badge }}</span>
	</button>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		icon: string;
		label: string;
		tone?: "primary" | "neutral" | "danger";
		disabled?: boolean;
		size?: number | string;
		badge?: string | number;
	}>(),
	{ tone: "neutral", size: 20 },
);
</script>

<style scoped>
.pos-icon-button {
	position: relative;
	inline-size: var(--pos-touch-target, 44px);
	block-size: var(--pos-touch-target, 44px);
	display: inline-grid;
	place-items: center;
	flex: 0 0 auto;
	border: 1px solid var(--pos-border);
	border-radius: var(--pos-radius-control, 8px);
	background: var(--pos-button-bg);
	color: var(--pos-text-primary);
	cursor: pointer;
}

.pos-icon-button:hover:not(:disabled) { background: var(--pos-action-hover-bg); color: var(--pos-action-active-fg); }
.pos-icon-button:active:not(:disabled) { background: var(--pos-action-pressed-bg); color: var(--pos-action-pressed-fg); }
.pos-icon-button :deep(.v-icon) { color: inherit; opacity: 1; }
.pos-icon-button--primary { color: var(--pos-primary); border-color: color-mix(in srgb, var(--pos-primary) 45%, var(--pos-border)); }
.pos-icon-button--danger { color: var(--pos-error); }
.pos-icon-button:disabled { opacity: 0.5; cursor: not-allowed; }
.pos-icon-button__badge {
	position: absolute;
	inset-block-start: -5px;
	inset-inline-end: -5px;
	min-inline-size: 18px;
	block-size: 18px;
	display: grid;
	place-items: center;
	padding-inline: 4px;
	border-radius: 999px;
	background: var(--pos-error);
	color: #fff;
	font-size: 10px;
	font-weight: 800;
}
</style>
