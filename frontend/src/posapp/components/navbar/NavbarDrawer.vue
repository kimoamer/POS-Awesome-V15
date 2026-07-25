<template>
	<v-navigation-drawer
		v-model="drawerOpen"
		width="320"
		:class="['drawer-custom', { 'drawer-visible': drawerOpen }, rtlClasses]"
		temporary
		:location="isRtl ? 'right' : 'left'"
		:scrim="scrimColor"
	>
		<div class="drawer-shell">
			<v-list density="compact" nav v-model:selected="activeItem" selected-class="active-item" class="drawer-nav-list">
				<v-list-item
					v-for="(item, index) in items"
					:key="item.text"
					:value="index"
					:to="item.to"
					@click="handleItemClick"
					class="drawer-item"
					active-class="active-item"
				>
					<template v-slot:prepend>
						<span class="drawer-icon-shell">
							<v-icon class="drawer-icon" size="18">{{ item.icon }}</v-icon>
						</span>
					</template>
					<v-list-item-title class="drawer-item-title">{{ item.text }}</v-list-item-title>
				</v-list-item>
			</v-list>

			<div v-if="mobileActions.length" class="drawer-quick-actions">
				<button
					v-for="action in mobileActions"
					:key="action.id"
					type="button"
					class="drawer-quick-action"
					:class="{
						'drawer-quick-action--danger': action.tone === 'danger',
						'drawer-quick-action--disabled': action.disabled,
					}"
					:disabled="action.disabled"
					@click="handleMobileActionClick(action)"
				>
					<span class="drawer-quick-action__icon">
						<v-icon size="18">{{ action.icon }}</v-icon>
					</span>
					<span class="drawer-quick-action__copy">
						<span class="drawer-quick-action__title">{{ action.text }}</span>
						<span v-if="action.subtitle" class="drawer-quick-action__subtitle">
							{{ action.subtitle }}
						</span>
					</span>
					<span v-if="action.badge" class="drawer-quick-action__badge">
						{{ action.badge }}
					</span>
				</button>
			</div>
		</div>
	</v-navigation-drawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRtl } from "../../composables/core/useRtl";

defineOptions({
	name: "NavbarDrawer",
});

const props = defineProps({
	drawer: Boolean,
	items: Array,
	item: Number,
	isDark: Boolean,
	mobileActions: {
		type: Array,
		default: () => [],
	},
});

const emit = defineEmits(["update:drawer", "update:item", "mobile-action"]);
const { isRtl, rtlClasses } = useRtl();

const drawerOpen = ref(props.drawer);
const activeItem = ref(props.item);

const scrimColor = computed(() => {
	// Use an opaque background in light mode so that
	// underlying content doesn't show through the drawer
	return props.isDark ? true : "rgba(255,255,255,1)";
});

watch(
	() => props.drawer,
	(val) => {
		drawerOpen.value = val;
	},
);

watch(drawerOpen, (val) => {
	document.body.style.overflow = val ? "hidden" : "";
	emit("update:drawer", val);
});

watch(
	() => props.item,
	(val) => {
		activeItem.value = val;
	},
);

watch(activeItem, (val) => {
	emit("update:item", val);
});

function handleItemClick() {
	// Close drawer after selection if mobile
	if (window.innerWidth < 1024) {
		closeDrawer();
	}
}

function handleMobileActionClick(action) {
	if (!action || action.disabled) {
		return;
	}
	emit("mobile-action", action.id, action);
	if (!action.keepOpen) {
		closeDrawer();
	}
}

function closeDrawer() {
	drawerOpen.value = false;
}
</script>

<style scoped>
.drawer-custom {
	width: min(320px, 86vw) !important;
	background: color-mix(in srgb, var(--pos-navbar-bg) 96%, transparent) !important;
	color: var(--pos-text-primary) !important;
	border-inline-end: 1px solid var(--pos-border-light) !important;
	box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14) !important;
	backdrop-filter: blur(16px);
	transition: transform 0.2s ease !important;
	z-index: 1005 !important;
}

.drawer-shell {
	height: 100%;
	min-height: 0;
	display: grid;
	align-content: start;
	gap: var(--pos-header-gap, 7px);
	padding: var(--pos-header-padding-y, 8px) var(--pos-header-padding-x, 12px);
	overflow-y: auto;
	overscroll-behavior: contain;
}

.drawer-custom :deep(a),
.drawer-custom :deep(.v-list-item),
.drawer-custom :deep(.v-list-item-title) {
	text-decoration: none !important;
}

.drawer-nav-list {
	display: grid;
	gap: 5px;
	padding: 0 !important;
	background: transparent !important;
}

.drawer-item {
	min-height: var(--pos-header-control-size, 38px) !important;
	padding: 0 8px !important;
	border: 1px solid transparent !important;
	border-radius: 12px !important;
	color: var(--pos-text-muted) !important;
	font-size: var(--pos-header-nav-font-size, 12px) !important;
	font-weight: 750 !important;
	letter-spacing: 0 !important;
	text-decoration: none !important;
	transition:
		background-color 0.18s ease,
		border-color 0.18s ease,
		color 0.18s ease,
		transform 0.18s ease;
}

.drawer-item:deep(a),
.drawer-item :deep(a),
.drawer-item :deep(.v-list-item__content),
.drawer-item :deep(.v-list-item-title) {
	text-decoration: none !important;
}

.drawer-item :deep(.v-list-item__prepend) {
	margin-inline-end: 8px !important;
	width: 30px;
	min-width: 30px;
}

.drawer-icon-shell {
	width: 28px;
	height: 28px;
	border-radius: 9px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: currentColor;
	background: transparent;
	flex: 0 0 28px;
}

.drawer-icon {
	color: currentColor;
}

.drawer-item-title {
	margin: 0;
	font-size: var(--pos-header-nav-font-size, 12px);
	font-weight: 750;
	line-height: 1.2;
	letter-spacing: 0;
	color: currentColor !important;
	white-space: normal;
	overflow-wrap: anywhere;
}

.drawer-item:hover,
.active-item {
	background: color-mix(in srgb, var(--pos-primary) 10%, var(--pos-surface)) !important;
	border-color: color-mix(in srgb, var(--pos-primary) 18%, var(--pos-border-light)) !important;
	color: var(--pos-primary);
	transform: translateY(-1px);
}

.active-item .drawer-icon-shell {
	background: color-mix(in srgb, var(--pos-primary) 14%, var(--pos-surface));
}

.drawer-quick-actions {
	display: grid;
	gap: 6px;
	padding-top: 7px;
	margin-top: 3px;
	border-top: 1px solid var(--pos-border-light);
}

.drawer-quick-action {
	width: 100%;
	border: 1px solid var(--pos-border-light);
	border-radius: 12px;
	background: var(--pos-surface-raised);
	color: var(--pos-text-primary);
	display: flex;
	align-items: center;
	gap: 8px;
	min-height: var(--pos-header-control-size, 38px);
	padding: 6px 8px;
	text-align: start;
	text-decoration: none;
	transition:
		transform 0.18s ease,
		border-color 0.18s ease,
		box-shadow 0.18s ease,
		background-color 0.18s ease;
}

.drawer-quick-action:hover {
	transform: translateY(-1px);
	border-color: color-mix(in srgb, var(--pos-primary) 24%, var(--pos-border-light));
	background: var(--pos-hover-bg);
	box-shadow: 0 6px 14px rgba(15, 23, 42, 0.055);
}

.drawer-quick-action--danger:hover {
	border-color: color-mix(in srgb, var(--pos-error) 26%, var(--pos-border-light));
}

.drawer-quick-action--disabled {
	opacity: 0.55;
	cursor: not-allowed;
}

.drawer-quick-action__icon {
	width: 28px;
	height: 28px;
	border-radius: 9px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: var(--pos-primary);
	background: color-mix(in srgb, var(--pos-primary) 10%, var(--pos-surface));
	flex: 0 0 28px;
}

.drawer-quick-action--danger .drawer-quick-action__icon {
	color: var(--pos-error);
	background: color-mix(in srgb, var(--pos-error) 10%, var(--pos-surface));
}

.drawer-quick-action__copy {
	min-width: 0;
	display: grid;
	gap: 1px;
}

.drawer-quick-action__title {
	font-size: var(--pos-header-nav-font-size, 12px);
	font-weight: 750;
	line-height: 1.15;
	color: var(--pos-text-primary);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.drawer-quick-action__subtitle {
	font-size: 10.5px;
	font-weight: 500;
	line-height: 1.2;
	color: var(--pos-text-muted);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.drawer-quick-action__badge {
	min-width: 20px;
	height: 20px;
	padding: 0 6px;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 10.5px;
	font-weight: 800;
	color: var(--pos-on-primary);
	background: var(--pos-primary);
	flex: 0 0 auto;
}

.drawer-custom {
	display: none !important;
}

.drawer-custom.drawer-visible {
	display: block !important;
}

@media (max-width: 900px) and (orientation: landscape) {
	.drawer-custom.drawer-visible {
		width: min(280px, 82vw) !important;
	}
}

@media (prefers-reduced-motion: reduce) {
	.drawer-custom,
	.drawer-item,
	.drawer-quick-action {
		transition: none !important;
	}
}
</style>
