<template>
	<div
		ref="toolbarRoot"
		class="invoice-items-toolbar"
		:class="{ 'invoice-items-toolbar--mobile': isMobileToolbar, 'invoice-items-toolbar--actions-only': !isSearchVisible }"
	>
		<v-text-field
			v-show="isSearchVisible"
			ref="itemSearchField"
			:model-value="itemSearch"
			@update:model-value="$emit('update:itemSearch', $event)"
			density="compact"
			variant="outlined"
			color="primary"
			class="item-search-field pos-themed-input"
			:placeholder="searchPlaceholder"
			:aria-label="__('Search items in cart or scan barcode')"
			prepend-inner-icon="mdi-magnify"
			hide-details
			clearable
			autocomplete="off"
		></v-text-field>
		<div class="invoice-items-toolbar__actions">
			<!-- Segmented List / Table Toggle -->
			<v-btn-toggle
				v-if="showDirectViewToggle"
				:model-value="currentView"
				@update:model-value="$emit('update:currentView', $event)"
				mandatory
				density="compact"
				color="primary"
				class="view-mode-toggle pos-themed-toggle"
			>
				<v-btn value="list" size="small" class="view-mode-toggle__btn">
					<v-icon size="18" class="mr-1">mdi-view-headline</v-icon>
					<span>{{ __("List") }}</span>
				</v-btn>
				<v-btn value="table" size="small" class="view-mode-toggle__btn">
					<v-icon size="18" class="mr-1">mdi-table</v-icon>
					<span>{{ __("Table") }}</span>
				</v-btn>
			</v-btn-toggle>

			<v-btn
				v-if="showDirectColumns"
				icon
				variant="text"
				color="primary"
				@click="toggleColumnSelection"
				class="invoice-command-btn invoice-command-btn--columns"
				:aria-label="__('Columns')"
			>
				<v-icon size="18">mdi-view-column-outline</v-icon>
				<v-tooltip activator="parent" location="bottom">{{ __("Columns") }}</v-tooltip>
			</v-btn>
			<v-menu v-if="showMoreButton" v-model="moreOpen" location="bottom end" :offset="[0, 8]">
				<template #activator="{ props }">
					<v-btn
						v-bind="props"
						icon
						variant="text"
						color="primary"
						class="invoice-command-btn"
						:aria-label="__('More invoice item actions')"
					>
						<v-icon size="20">mdi-dots-vertical</v-icon>
						<v-tooltip activator="parent" location="bottom">{{ __("More") }}</v-tooltip>
					</v-btn>
				</template>
				<v-card class="invoice-command-menu pos-themed-card" elevation="8">
					<v-list density="compact" nav class="invoice-command-menu__list">
						<v-list-item
							v-for="action in menuActions"
							:key="action"
							class="invoice-command-menu__item"
							@click="runMenuAction(action)"
						>
							<template #prepend>
								<v-icon size="18">{{ actionIcon(action) }}</v-icon>
							</template>
							<v-list-item-title>{{ actionLabel(action) }}</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-card>
			</v-menu>
		</div>
		<v-dialog v-model="showColumnSelector" max-width="500px" transition="dialog-bottom-transition">
			<v-card class="column-selector-dialog pos-themed-card">
				<v-card-title class="column-selector-dialog__header">
					<span class="column-selector-dialog__title">{{ __("Select Columns to Display") }}</span>
					<v-spacer></v-spacer>
					<v-btn
						icon="mdi-close"
						variant="text"
						density="compact"
						:aria-label="__('Close column selector')"
						@click="showColumnSelector = false"
					></v-btn>
				</v-card-title>
				<v-divider></v-divider>
				<v-card-text class="column-selector-dialog__body">
					<v-row dense>
						<v-col
							cols="12"
							v-for="column in availableColumns.filter((col) => !col.required)"
							:key="column.key"
						>
							<v-switch
								:model-value="isTempColumnSelected(column.key)"
								@update:model-value="(value) => setTempColumnSelection(column.key, !!value)"
								:label="column.title"
								hide-details
								density="compact"
								color="primary"
								class="column-switch mb-1"
								:disabled="column.required"
							></v-switch>
						</v-col>
					</v-row>
					<div class="text-caption mt-2">
						{{ __("Required columns cannot be hidden") }}
					</div>
				</v-card-text>
				<v-card-actions class="column-selector-dialog__actions">
					<v-btn color="error" variant="text" @click="cancelColumnSelection">{{
						__("Cancel")
					}}</v-btn>
					<v-spacer></v-spacer>
					<v-btn color="primary" variant="tonal" @click="updateSelectedColumns">{{
						__("Apply")
					}}</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

type ToolbarActionKey = "columns" | "view-list" | "view-table";

const props = defineProps({
	itemSearch: {
		type: String,
		default: "",
	},
	availableColumns: {
		type: Array as () => any[],
		default: () => [],
	},
	selectedColumns: {
		type: Array as () => string[],
		default: () => [],
	},
	currentView: {
		type: String,
		default: "list",
	},
	showViewToggle: {
		type: Boolean,
		default: true,
	},
	searchVisible: {
		type: Boolean,
		default: true,
	},
});

const emit = defineEmits(["update:itemSearch", "update:selectedColumns", "update:currentView"]);

const __ = (window as any).__ || ((s: string) => s);
const showColumnSelector = ref(false);
const moreOpen = ref(false);
const tempSelectedColumns = ref<string[]>([]);
const itemSearchField = ref<any>(null);
const toolbarRoot = ref<HTMLElement | null>(null);
const isMobileToolbar = ref(false);
let resizeObserver: ResizeObserver | null = null;

const canManageColumns = computed(() => props.currentView === "table");
const showDirectViewToggle = computed(() => props.showViewToggle && !isMobileToolbar.value);
const showDirectColumns = computed(() => canManageColumns.value && !isMobileToolbar.value);
const searchPlaceholder = computed(() =>
	isMobileToolbar.value ? __("Search or scan barcode...") : __("Search items in cart or scan barcode..."),
);
const isSearchVisible = computed(() => !isMobileToolbar.value || props.searchVisible);

const menuActions = computed<ToolbarActionKey[]>(() => {
	const actions: ToolbarActionKey[] = [];
	if (props.showViewToggle && isMobileToolbar.value) {
		actions.push("view-list", "view-table");
	}
	if (canManageColumns.value && isMobileToolbar.value) {
		actions.push("columns");
	}
	return actions;
});

const showMoreButton = computed(() => menuActions.value.length > 0);

const runMenuAction = (action: ToolbarActionKey) => {
	moreOpen.value = false;
	if (action === "columns") {
		toggleColumnSelection();
		return;
	}

	emit("update:currentView", action === "view-table" ? "table" : "list");
};

const actionIcon = (action: ToolbarActionKey): string => {
	if (action === "view-list") return "mdi-view-headline";
	if (action === "view-table") return "mdi-table";
	return "mdi-view-column-outline";
};

const actionLabel = (action: ToolbarActionKey): string => {
	if (action === "view-list") return __("List");
	if (action === "view-table") return __("Table");
	return __("Columns");
};

const toggleColumnSelection = () => {
	tempSelectedColumns.value = normalizeColumns(props.selectedColumns);
	showColumnSelector.value = true;
};

const cancelColumnSelection = () => {
	showColumnSelector.value = false;
};

const updateSelectedColumns = () => {
	emit("update:selectedColumns", normalizeColumns(tempSelectedColumns.value));
	showColumnSelector.value = false;
};

const focusSearch = () => {
	itemSearchField.value?.focus?.();
};

const updateToolbarMode = () => {
	const width =
		toolbarRoot.value?.getBoundingClientRect?.().width ||
		(typeof window !== "undefined" ? window.innerWidth : 0);
	isMobileToolbar.value = width > 0 && width < 680;
};

const normalizeColumns = (columns: any): string[] =>
	Array.isArray(columns) ? [...new Set(columns.filter((column) => typeof column === "string"))] : [];

const isTempColumnSelected = (key: string): boolean => tempSelectedColumns.value.includes(key);

const setTempColumnSelection = (key: string, selected: boolean | null) => {
	const next = new Set(tempSelectedColumns.value);
	if (selected) {
		next.add(key);
	} else {
		next.delete(key);
	}
	tempSelectedColumns.value = [...next];
};

onMounted(() => {
	updateToolbarMode();
	if (typeof ResizeObserver !== "undefined" && toolbarRoot.value) {
		resizeObserver = new ResizeObserver(updateToolbarMode);
		resizeObserver.observe(toolbarRoot.value);
		return;
	}

	window.addEventListener("resize", updateToolbarMode, { passive: true });
});

onBeforeUnmount(() => {
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
		return;
	}

	window.removeEventListener("resize", updateToolbarMode);
});

defineExpose({
	focusSearch,
});
</script>

<style scoped>
.invoice-items-toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--pos-control-gap, 6px);
	min-width: 0;
	width: 100%;
	padding: 0;
	background: transparent;
}

.invoice-items-toolbar--actions-only {
	justify-content: flex-end;
}

.invoice-items-toolbar--mobile {
	gap: 8px;
}

.invoice-items-toolbar__actions {
	display: inline-flex;
	align-items: center;
	gap: var(--pos-control-gap, 6px);
	margin-inline-start: auto;
	min-width: 0;
}

.invoice-items-toolbar__actions:empty {
	display: none;
}

.item-search-field {
	min-width: 0;
	width: 100%;
}

.item-search-field :deep(.v-field) {
	min-height: var(--pos-control-height, 44px) !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	box-shadow: none !important;
}

.item-search-field :deep(.v-field--focused) {
	border-color: color-mix(in srgb, var(--pos-primary) 40%, var(--pos-border-light)) !important;
	box-shadow: none !important;
	outline: 2px solid color-mix(in srgb, var(--pos-primary) 12%, transparent);
	outline-offset: 0;
}

.item-search-field :deep(.v-field__overlay) {
	display: none !important;
}

.item-search-field :deep(.v-field__outline) {
	--v-field-border-opacity: 0 !important;
	color: transparent !important;
}

.item-search-field :deep(.v-field__input),
.item-search-field :deep(.v-field__prepend-inner),
.item-search-field :deep(.v-field__clearable) {
	min-height: var(--pos-control-height, 44px) !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
}

.item-search-field :deep(input) {
	font-size: var(--pos-font-control, 13px);
	font-weight: 600;
	line-height: 1.2;
	text-overflow: ellipsis;
}

.item-search-field :deep(.v-label) {
	font-size: var(--pos-font-meta, 11px);
	font-weight: 700;
	color: var(--pos-text-muted) !important;
	opacity: 0.9;
}

.view-mode-toggle {
	height: 44px !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	padding: 3px !important;
	gap: 2px !important;
	box-shadow: none !important;
}

.view-mode-toggle__btn {
	height: 36px !important;
	min-height: 36px !important;
	border-radius: 6px !important;
	font-size: 12px !important;
	font-weight: 700 !important;
	text-transform: none !important;
	letter-spacing: 0 !important;
	padding-inline: 10px !important;
	color: var(--pos-text-secondary) !important;
}

.view-mode-toggle__btn--active,
.view-mode-toggle :deep(.v-btn--active) {
	background: color-mix(in srgb, var(--pos-primary) 12%, var(--pos-surface-raised)) !important;
	color: var(--pos-primary) !important;
	font-weight: 760 !important;
}

.invoice-command-btn {
	width: 32px !important;
	height: 32px !important;
	min-width: 32px !important;
	min-height: 32px !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	color: var(--pos-text-primary) !important;
	box-shadow: none !important;
}

.invoice-command-btn:hover,
.invoice-command-btn:focus-visible {
	border-color: color-mix(in srgb, var(--pos-primary) 36%, var(--pos-border-light)) !important;
	background: color-mix(in srgb, var(--pos-primary-container) 62%, var(--pos-surface-raised)) !important;
	color: var(--pos-primary) !important;
}

.invoice-command-menu {
	min-width: 190px;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-section, 10px) !important;
	background: var(--pos-menu-bg) !important;
	box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12) !important;
	overflow: hidden;
}

.invoice-command-menu__list {
	padding: 6px !important;
}

.invoice-command-menu__item {
	min-height: 40px !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	color: var(--pos-text-primary) !important;
	font-size: 13px;
	font-weight: 650;
}

.column-selector-dialog {
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-md, 14px) !important;
	overflow: hidden;
}

.column-selector-dialog__header {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 12px 14px !important;
}

.column-selector-dialog__title {
	font-size: 15px;
	font-weight: 750;
	color: var(--pos-text-primary);
}

.column-selector-dialog__body {
	padding: 12px 14px !important;
}

.column-selector-dialog__actions {
	padding: 10px 14px 14px !important;
	gap: 8px;
}

@media (max-width: 520px) {
	.invoice-items-toolbar--mobile {
		grid-template-columns: 1fr;
		padding: 0;
	}

	.invoice-items-toolbar--mobile .invoice-items-toolbar__actions {
		justify-content: flex-end;
		width: 100%;
	}

	.invoice-items-toolbar--mobile .item-search-field :deep(.v-field),
	.invoice-items-toolbar--mobile .item-search-field :deep(.v-field__input),
	.invoice-items-toolbar--mobile .item-search-field :deep(.v-field__prepend-inner),
	.invoice-items-toolbar--mobile .item-search-field :deep(.v-field__clearable) {
		min-height: 48px !important;
	}

	.invoice-items-toolbar--mobile .item-search-field :deep(input) {
		font-size: 14px;
	}

	.invoice-command-btn--columns {
		display: none !important;
	}
}

@media (max-width: 380px) {
	.invoice-items-toolbar--mobile .item-search-field :deep(input) {
		font-size: 13px;
	}
}
</style>
