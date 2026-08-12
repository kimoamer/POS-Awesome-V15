<template>
	<div class="info-gadgets-container">
		<v-menu v-model="menu" :close-on-content-click="false" location="bottom end" offset="10" eager>
			<template v-slot:activator="{ props }">
				<v-btn
					icon
					v-bind="props"
					class="pos-themed-button info-gadgets-btn"
					:aria-label="__('System Information')"
				>
					<v-icon class="pos-text-primary" size="18">mdi-information-outline</v-icon>
				</v-btn>
			</template>

			<v-card
				class="pos-themed-card info-gadgets-menu"
				:class="{ 'info-gadgets-menu--wide': showSystemMetrics }"
			>
				<header class="info-gadgets-menu__header">
					<div>
						<div class="info-gadgets-menu__title">{{ __("System Status") }}</div>
						<div class="info-gadgets-menu__subtitle">
							{{ __("Local storage and terminal health") }}
						</div>
					</div>
					<v-btn
						icon="mdi-close"
						variant="text"
						size="small"
						:aria-label="__('Close')"
						@click="menu = false"
					/>
				</header>
				<div class="gadgets-grid" :class="{ 'gadgets-grid--wide': showSystemMetrics }">
					<section class="gadget-panel">
						<slot name="cache-usage-meter"></slot>
					</section>
					<template v-if="showSystemMetrics">
						<section class="gadget-panel">
							<slot name="db-usage-gadget"></slot>
						</section>
						<section class="gadget-panel">
							<slot name="cpu-gadget"></slot>
						</section>
					</template>
				</div>
			</v-card>
		</v-menu>
	</div>
</template>

<script setup>
import { ref } from "vue";

defineOptions({
	name: "NavbarInfoGadgets",
});

const __ = window.__ || ((text) => text);
const menu = ref(false);

defineProps({
	showSystemMetrics: {
		type: Boolean,
		default: false,
	},
});
</script>

<style scoped>
.info-gadgets-container {
	display: flex;
	align-items: center;
	justify-content: center;
}

.info-gadgets-btn {
	width: var(--pos-header-control-size, 44px) !important;
	height: var(--pos-header-control-size, 44px) !important;
	min-width: var(--pos-header-control-size, 44px) !important;
	min-height: var(--pos-header-control-size, 44px) !important;
	background: var(--pos-surface-raised) !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: 11px !important;
	box-shadow: 0 6px 14px rgba(15, 23, 42, 0.055) !important;
	color: var(--pos-text-primary) !important;
	backdrop-filter: blur(8px);
	transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.info-gadgets-btn:hover {
	transform: translateY(-1px);
	background: var(--pos-hover-bg) !important;
	border-color: color-mix(in srgb, var(--pos-primary) 28%, var(--pos-border-light)) !important;
	box-shadow: 0 8px 18px rgba(15, 23, 42, 0.07) !important;
}

.info-gadgets-btn .pos-text-primary {
	color: var(--pos-primary) !important;
}

.info-gadgets-menu {
	width: min(400px, calc(100vw - 24px));
	border: 1px solid var(--pos-border-light) !important;
	border-radius: 16px !important;
	overflow: hidden;
}

.info-gadgets-menu--wide {
	width: min(980px, calc(100vw - 24px));
}

.info-gadgets-menu__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 14px 16px 12px;
	border-bottom: 1px solid var(--pos-border-light);
	background: var(--pos-surface-muted);
}

.info-gadgets-menu__title {
	font-size: 16px;
	font-weight: 750;
	color: var(--pos-text-primary);
}

.info-gadgets-menu__subtitle {
	margin-top: 2px;
	font-size: 12px;
	color: var(--pos-text-secondary);
}

.gadgets-grid {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 12px;
	padding: 14px;
}

.gadgets-grid--wide {
	grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gadget-panel {
	min-width: 0;
	padding: 14px;
	border: 1px solid var(--pos-border-light);
	border-radius: 12px;
	background: var(--pos-surface-raised);
}

.gadget-panel :deep(> *) {
	width: 100%;
}

@media (max-width: 1279px) {
	.info-gadgets-btn {
		width: var(--pos-header-control-size-compact, 40px) !important;
		height: var(--pos-header-control-size-compact, 40px) !important;
		min-width: var(--pos-header-control-size-compact, 40px) !important;
		min-height: var(--pos-header-control-size-compact, 40px) !important;
	}
}

@media (max-width: 840px) {
	.gadgets-grid--wide {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
