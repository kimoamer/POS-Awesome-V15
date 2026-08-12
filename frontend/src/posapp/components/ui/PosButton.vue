<template>
	<button
		class="pos-button"
		:class="[`pos-button--${variant}`, `pos-button--${tone}`, { 'pos-button--block': block }]"
		:type="type"
		:disabled="disabled || loading"
		:aria-busy="loading || undefined"
	>
		<v-progress-circular v-if="loading" indeterminate :size="18" :width="2" />
		<v-icon v-else-if="icon" :icon="icon" :size="18" aria-hidden="true" />
		<span class="pos-button__label"><slot /></span>
		<v-icon v-if="trailingIcon" :icon="trailingIcon" :size="18" aria-hidden="true" />
	</button>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		variant?: "solid" | "outline" | "ghost";
		tone?: "primary" | "neutral" | "success" | "warning" | "danger";
		type?: "button" | "submit" | "reset";
		icon?: string;
		trailingIcon?: string;
		disabled?: boolean;
		loading?: boolean;
		block?: boolean;
	}>(),
	{
		variant: "solid",
		tone: "primary",
		type: "button",
	},
);
</script>

<style scoped>
.pos-button {
	min-block-size: var(--pos-control-min-height, 44px);
	min-inline-size: 44px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding-block: 8px;
	padding-inline: 16px;
	border: 1px solid transparent;
	border-radius: var(--pos-radius-control, 8px);
	font: inherit;
	font-weight: 700;
	cursor: pointer;
	transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}

.pos-button--block { inline-size: 100%; }
.pos-button--primary { --button-color: var(--pos-primary); --button-on-color: var(--pos-on-primary); }
.pos-button--neutral { --button-color: var(--pos-text-secondary); --button-on-color: var(--pos-surface); }
.pos-button--success { --button-color: var(--pos-success); --button-on-color: #fff; }
.pos-button--warning { --button-color: var(--pos-warning); --button-on-color: #111827; }
.pos-button--danger { --button-color: var(--pos-error); --button-on-color: #fff; }
.pos-button--solid { background: var(--button-color); color: var(--button-on-color); }
.pos-button--outline { background: transparent; border-color: var(--button-color); color: var(--button-color); }
.pos-button--ghost { background: transparent; color: var(--button-color); }
.pos-button--solid:hover:not(:disabled) { filter: brightness(0.96); }
.pos-button--solid:active:not(:disabled) { filter: brightness(0.9); transform: translateY(1px); }
.pos-button--outline:hover:not(:disabled),
.pos-button--ghost:hover:not(:disabled) {
	background: color-mix(in srgb, var(--button-color) 9%, var(--pos-surface-raised));
	color: var(--button-color);
}
.pos-button--outline:active:not(:disabled),
.pos-button--ghost:active:not(:disabled) {
	background: color-mix(in srgb, var(--button-color) 16%, var(--pos-surface-raised));
	color: var(--button-color);
	transform: translateY(1px);
}
.pos-button :deep(.v-icon),
.pos-button__label { color: inherit; opacity: 1; }
.pos-button:disabled { opacity: 0.5; cursor: not-allowed; }
.pos-button__label { min-inline-size: 0; }
</style>
