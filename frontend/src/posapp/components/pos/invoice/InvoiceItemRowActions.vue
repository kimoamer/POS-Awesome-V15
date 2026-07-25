<template>
	<div class="invoice-row-actions">
		<!-- Details Action Button -->
		<v-btn
			icon
			size="small"
			variant="tonal"
			color="primary"
			class="invoice-row-action invoice-row-action--details"
			@click.stop="$emit('open-details', item)"
			:aria-label="__('Item details')"
		>
			<v-icon size="small">mdi-tune-variant</v-icon>
			<v-tooltip activator="parent" location="bottom">
				{{ __("Item details") }}
			</v-tooltip>
		</v-btn>

		<!-- Delete Action Button -->
		<v-btn
			icon
			size="small"
			variant="tonal"
			color="error"
			:disabled="!canRemove"
			class="invoice-row-action invoice-row-action--remove"
			@click.stop="$emit('remove-item', item)"
			:aria-label="__('Remove item')"
		>
			<v-icon size="small">mdi-delete-outline</v-icon>
			<v-tooltip activator="parent" location="bottom">
				{{ __("Remove") }}
			</v-tooltip>
		</v-btn>
	</div>
</template>

<script setup lang="ts">
interface Props {
	item: any;
	canRemove?: boolean;
}

withDefaults(defineProps<Props>(), {
	canRemove: true,
});

defineEmits<{
	(e: "open-details", item: any): void;
	(e: "remove-item", item: any): void;
}>();

const __ = (window as any).__ || ((s: string) => s);
</script>

<style scoped>
.invoice-row-actions {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	width: 100%;
	min-width: 0;
	overflow: visible;
}

.invoice-row-action {
	width: 36px !important;
	height: 36px !important;
	min-width: 36px !important;
	padding: 0 !important;
	border-radius: var(--pos-radius-sm, 9px) !important;
	flex: 0 0 36px;
	transition: all 0.15s ease !important;
}

.invoice-row-action--details {
	color: var(--pos-primary, #2563eb) !important;
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 8%, transparent) !important;
}

.invoice-row-action--details:hover,
.invoice-row-action--details:focus-visible {
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 16%, transparent) !important;
	transform: scale(1.04);
}

.invoice-row-action--remove {
	color: var(--pos-error, #ef4444) !important;
	background: color-mix(in srgb, var(--pos-error, #ef4444) 7%, transparent) !important;
}

.invoice-row-action--remove:hover,
.invoice-row-action--remove:focus-visible {
	background: color-mix(in srgb, var(--pos-error, #ef4444) 15%, transparent) !important;
	transform: scale(1.04);
}

.invoice-row-action:disabled {
	opacity: 0.4 !important;
	transform: none !important;
}

@media (max-width: 767px) {
	.invoice-row-action {
		width: 44px !important;
		height: 44px !important;
		min-width: 44px !important;
		min-height: 44px !important;
		flex: 0 0 44px;
	}
}
</style>
