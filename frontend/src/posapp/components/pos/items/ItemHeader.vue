<template>
	<div class="sticky-header item-command-bar">
		<div
			class="item-command-bar__primary"
			:class="{
				'item-command-bar__primary--no-qty': !posProfile.posa_input_qty,
				'item-command-bar__primary--no-scan': !posProfile.posa_enable_camera_scanning,
			}"
		>
			<div class="search-field-shell">
				<v-text-field
					ref="debounce_search"
					density="compact"
					clearable
					autofocus
					variant="outlined"
					color="primary"
					class="pos-themed-input command-input command-input--search"
					:placeholder="searchPlaceholder"
					:aria-label="searchPlaceholder"
					aria-autocomplete="list"
					role="combobox"
					hide-details
					data-pos-keyboard-target="item-search"
					data-testid="pos-item-search"
					:model-value="searchInput"
					prepend-inner-icon="mdi-magnify"
					@update:model-value="
						(val) => {
							$emit('update:searchInput', val);
							$emit('search-input', val);
						}
					"
					@keydown.enter="$emit('enter')"
					@keydown="handleSearchKeydown"
					@click:clear="$emit('clear-search')"
					@click:prepend-inner="$emit('focus')"
					@paste="$emit('search-paste', $event)"
					@focus="$emit('focus')"
				/>
			</div>

			<div v-if="posProfile.posa_input_qty" class="qty-field-shell">
				<v-text-field
					density="compact"
					variant="outlined"
					color="primary"
					class="pos-themed-input command-input command-input--qty"
					:label="frappe._('QTY')"
					:aria-label="__('Quantity')"
					hide-details
					data-pos-keyboard-target="item-qty"
					:model-value="qtyInput"
					@update:model-value="$emit('update:qtyInput', $event)"
					type="text"
					inputmode="decimal"
					@keydown.enter="$emit('enter')"
					@keydown.esc="blurTarget"
					@focus="$emit('clear-qty')"
					@click="$emit('clear-qty')"
					@blur="$emit('blur-qty')"
				></v-text-field>
			</div>

			<v-btn
				v-if="posProfile.posa_enable_camera_scanning"
				icon
				class="command-icon-btn command-icon-btn--scan"
				variant="text"
				color="primary"
				:disabled="scannerLocked"
				:aria-label="cameraAriaLabel"
				:title="cameraTitle"
				@click="$emit('start-camera')"
			>
				<v-icon size="20">mdi-camera-outline</v-icon>
				<v-tooltip activator="parent" location="bottom">{{ cameraTitle }}</v-tooltip>
			</v-btn>

			<div class="command-actions">
				<div class="command-actions__desktop">
					<v-btn
						v-if="context === 'purchase'"
						icon
						class="command-icon-btn"
						variant="text"
						color="primary"
						:aria-label="__('New Item')"
						:title="__('New Item')"
						@click="$emit('open-new-item')"
					>
						<v-icon size="20">mdi-plus-box-outline</v-icon>
						<v-tooltip activator="parent" location="bottom">{{ __("New Item") }}</v-tooltip>
					</v-btn>
					<v-btn
						icon
						class="command-icon-btn"
						variant="text"
						color="primary"
						:aria-label="__('Settings')"
						:title="__('Settings')"
						@click="$emit('toggle-settings')"
					>
						<v-icon size="20">mdi-tune-variant</v-icon>
						<v-tooltip activator="parent" location="bottom">{{ __("Settings") }}</v-tooltip>
					</v-btn>
					<div
						v-if="statusVisible"
						class="command-status-inline d-inline-flex align-center gap-1 me-1 px-2 py-1 rounded-lg"
						data-test="item-search-sync-shell"
					>
						<v-icon size="16" :color="showSyncProgress ? 'primary' : 'success'">
							{{ showSyncProgress ? "mdi-sync" : "mdi-check-circle-outline" }}
						</v-icon>
						<span class="status-inline-label text-caption font-weight-medium text-secondary">
							{{ syncStatusLabel }}
						</span>
						<span v-if="lastSyncTimeLabel" class="status-inline-time text-caption text-secondary">
							· {{ lastSyncTimeLabel }}
						</span>
						<v-progress-linear
							v-if="showSyncProgress"
							:model-value="clampedSyncProgress"
							color="primary"
							height="3"
							class="command-status-inline__progress"
							data-test="item-search-sync-bar"
						/>
						<span
							v-if="showSyncProgress && normalizedSyncItemsCount"
							class="status-inline-count text-caption text-secondary"
						>
							{{ syncItemsCountLabel }}
						</span>
					</div>
					<v-btn
						icon
						class="command-icon-btn"
						variant="text"
						color="primary"
						:aria-label="__('Reload Items')"
						:title="__('Reload Items')"
						@click="$emit('reload-items')"
					>
						<v-icon size="20">mdi-refresh</v-icon>
						<v-tooltip activator="parent" location="bottom">{{ __("Reload Items") }}</v-tooltip>
					</v-btn>
				</div>

				<v-menu v-model="toolsOpen" location="bottom end" :offset="[0, 8]">
					<template #activator="{ props: menuProps }">
						<v-btn
							v-bind="menuProps"
							class="command-tools-trigger"
							variant="text"
							color="primary"
							:aria-label="toolsOpen ? __('Hide search tools') : __('Show search tools')"
							:title="__('Tools')"
						>
							<v-icon size="20">mdi-dots-vertical</v-icon>
							<span class="command-tools-trigger__label ms-1">{{ __("Tools") }}</span>
							<v-icon size="16" class="ms-1">mdi-chevron-down</v-icon>
							<v-tooltip activator="parent" location="bottom">{{ __("Tools") }}</v-tooltip>
						</v-btn>
					</template>
					<v-card class="tools-menu-card pos-themed-card" elevation="10">
						<v-list density="compact" nav class="tools-menu-list">
							<v-list-item
								v-for="action in toolsActions"
								:key="action.event"
								class="tools-menu-item"
								@click="emitToolAction(action.event)"
							>
								<template #prepend>
									<v-icon size="19">{{ action.icon }}</v-icon>
								</template>
								<v-list-item-title>{{ action.label }}</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-card>
				</v-menu>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
	searchInput: { type: String, default: "" },
	qtyInput: { type: [String, Number], default: 1 },
	posProfile: { type: Object, required: true },
	scannerLocked: { type: Boolean, default: false },
	enableBackgroundSync: { type: Boolean, default: false },
	lastSyncTime: { type: String, default: "" },
	syncStatus: { type: String, default: "" },
	showSyncProgress: { type: Boolean, default: false },
	syncProgress: { type: Number, default: 0 },
	syncItemsCount: { type: Number, default: 0 },
	context: { type: String, default: "pos" },
});

const emit = defineEmits([
	"update:searchInput",
	"update:qtyInput",
	"esc",
	"enter",
	"search-keydown",
	"clear-search",
	"search-input",
	"search-paste",
	"focus",
	"clear-qty",
	"blur-qty",
	"start-camera",
	"open-new-item",
	"toggle-settings",
	"reload-items",
]);

const debounce_search = ref(null);
const toolsOpen = ref(false);
const searchPlaceholder = computed(() =>
	props.posProfile?.posa_enable_camera_scanning
		? translate("Search item name, code or barcode...")
		: translate("Search item name or code..."),
);
const cameraAriaLabel = computed(() =>
	props.scannerLocked
		? translate("Camera scanner is locked until the current error is acknowledged")
		: translate("Scan with camera"),
);
const cameraTitle = computed(() =>
	props.scannerLocked
		? translate("Acknowledge the error to resume scanning")
		: translate("Scan with Camera"),
);
const clampedSyncProgress = computed(() => {
	const normalized = Number(props.syncProgress);
	if (!Number.isFinite(normalized) || normalized <= 0) {
		return 0;
	}
	return Math.min(100, Math.round(normalized));
});
const normalizedSyncItemsCount = computed(() => {
	const normalized = Number(props.syncItemsCount);
	if (!Number.isFinite(normalized) || normalized <= 0) {
		return 0;
	}
	return Math.round(normalized);
});
const translate = (value) => (typeof globalThis.__ === "function" ? globalThis.__(value) : value);
const syncItemsCountLabel = computed(() => {
	const count = normalizedSyncItemsCount.value;
	const itemLabel = count === 1 ? translate("item synced") : translate("items synced");
	return `${count.toLocaleString()} ${itemLabel}`;
});
const lastSyncTimeLabel = computed(() => {
	if (!props.enableBackgroundSync || !props.lastSyncTime) {
		return "";
	}
	return `${translate("Last sync:")} ${props.lastSyncTime}`;
});
const syncStatusLabel = computed(() => {
	if (props.syncStatus) {
		return props.syncStatus;
	}
	if (props.showSyncProgress) {
		return translate("Syncing items");
	}
	return translate("Items ready");
});
const statusVisible = computed(
	() => props.showSyncProgress || Boolean(props.syncStatus) || Boolean(lastSyncTimeLabel.value),
);
const toolsActions = computed(() => {
	const actions = [];
	if (props.context === "purchase") {
		actions.push({
			event: "open-new-item",
			icon: "mdi-plus-box-outline",
			label: translate("New Item"),
		});
	}
	actions.push(
		{
			event: "toggle-settings",
			icon: "mdi-tune-variant",
			label: translate("Settings"),
		},
		{
			event: "reload-items",
			icon: "mdi-refresh",
			label: translate("Reload Items"),
		},
	);
	return actions;
});

const emitToolAction = (eventName) => {
	toolsOpen.value = false;
	emit(eventName);
};

const blurTarget = (event) => {
	event?.target?.blur?.();
};

const handleSearchEscape = (event) => {
	if (props.searchInput) {
		emit("esc");
		return;
	}
	blurTarget(event);
};

const handleSearchKeydown = (event) => {
	if (event?.key === "Escape") {
		handleSearchEscape(event);
		return;
	}
	emit("search-keydown", event);
};

defineExpose({
	debounce_search,
});
</script>

<style scoped>
.sticky-header {
	position: relative;
	z-index: 5;
	background: transparent;
	border: 0;
	margin: 0;
}

.item-command-bar {
	--item-command-height: var(--pos-control-height, 44px);
	--item-command-icon-size: 44px;
	--item-command-radius: var(--pos-radius-control, 8px);
	--item-command-gap: var(--pos-control-gap, 6px);
	display: grid;
	gap: var(--pos-section-gap, 8px);
	min-width: 0;
	padding: 0;
	color: var(--pos-text-primary);
}

.item-command-bar__primary {
	display: grid;
	grid-template-columns: minmax(260px, 1fr) minmax(88px, 100px) auto auto;
	align-items: center;
	gap: var(--item-command-gap);
	min-width: 0;
}

.item-command-bar__primary--no-qty {
	grid-template-columns: minmax(260px, 1fr) auto auto;
}

.item-command-bar__primary--no-scan {
	grid-template-columns: minmax(260px, 1fr) minmax(88px, 100px) auto;
}

.item-command-bar__primary--no-qty.item-command-bar__primary--no-scan {
	grid-template-columns: minmax(260px, 1fr) auto;
}

.search-field-shell,
.qty-field-shell {
	min-width: 0;
}

.command-actions,
.command-actions__desktop {
	display: inline-flex;
	align-items: center;
	gap: var(--item-command-gap);
	min-width: 0;
}

.command-actions {
	justify-content: flex-end;
}

.command-tools-trigger {
	display: none !important;
}

.command-status-inline {
	background: var(--pos-surface-muted, #f8fafc);
	border: 1px solid var(--pos-border-light, #e2e8f0);
	border-radius: var(--item-command-radius, 8px) !important;
	height: var(--item-command-icon-size, 44px);
	padding: 0 10px !important;
	white-space: nowrap;
}

.status-inline-label {
	color: var(--pos-text-primary, #0f172a);
	font-weight: 600;
}

.status-inline-time {
	color: var(--pos-text-secondary, #64748b);
}

.sync-status-chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	font-size: var(--pos-font-label, 12px);
	font-weight: 650;
	line-height: 1.15;
	color: color-mix(in srgb, var(--pos-primary, #0097a7) 70%, var(--pos-text-primary));
	white-space: nowrap;
}

.sync-status-chip__label {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.search-sync-progress__bar {
	width: 100%;
	min-width: 96px;
	border-radius: 999px;
	overflow: hidden;
}

.search-sync-progress__meta {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: var(--pos-control-gap, 6px);
	min-width: 0;
	font-size: var(--pos-font-label, 12px);
	line-height: 1.2;
	white-space: nowrap;
}

.search-sync-progress__count,
.search-sync-progress__value,
.last-sync-label {
	font-variant-numeric: tabular-nums;
	color: var(--pos-text-muted);
}

.search-sync-progress__value {
	font-weight: 750;
	color: color-mix(in srgb, var(--pos-primary, #0097a7) 78%, var(--pos-text-primary));
}

.search-sync-progress__count,
.last-sync-label {
	overflow: hidden;
	text-overflow: ellipsis;
}

.search-sync-progress__count::before,
.last-sync-label::before {
	content: "";
	display: inline-block;
	width: 3px;
	height: 3px;
	margin-inline-end: 8px;
	border-radius: 999px;
	background: currentColor;
	vertical-align: middle;
	opacity: 0.35;
}

.command-icon-btn {
	width: var(--item-command-icon-size) !important;
	height: var(--item-command-icon-size) !important;
	min-width: var(--item-command-icon-size) !important;
	min-height: var(--item-command-icon-size) !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--item-command-radius) !important;
	background: var(--pos-surface-raised) !important;
	color: var(--pos-text-primary) !important;
	box-shadow: none !important;
	transition:
		border-color 0.16s ease,
		background-color 0.16s ease,
		color 0.16s ease;
}

.command-icon-btn:hover,
.command-icon-btn:focus-visible {
	border-color: color-mix(in srgb, var(--pos-primary) 32%, var(--pos-border-light)) !important;
	background: color-mix(in srgb, var(--pos-primary-container) 68%, var(--pos-surface-raised)) !important;
	color: var(--pos-primary) !important;
}

.command-icon-btn:disabled {
	opacity: 0.48;
	cursor: not-allowed;
}

.command-icon-btn--scan {
	color: var(--pos-primary) !important;
}

.command-tools-trigger {
	height: var(--item-command-icon-size) !important;
	min-height: var(--item-command-icon-size) !important;
	min-width: 112px !important;
	padding: 0 12px !important;
	gap: 6px;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--item-command-radius) !important;
	background: var(--pos-surface-raised) !important;
	color: var(--pos-text-primary) !important;
	box-shadow: none !important;
	text-transform: none !important;
	letter-spacing: 0 !important;
	font-size: 0.82rem !important;
	font-weight: 750 !important;
}

.command-tools-trigger:hover,
.command-tools-trigger:focus-visible {
	border-color: color-mix(in srgb, var(--pos-primary) 32%, var(--pos-border-light)) !important;
	background: color-mix(in srgb, var(--pos-primary-container) 68%, var(--pos-surface-raised)) !important;
	color: var(--pos-primary) !important;
}

.command-tools-trigger__label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.tools-menu-card {
	min-width: 210px;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-md, 14px) !important;
	background: var(--pos-menu-bg) !important;
	box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14) !important;
	overflow: hidden;
}

.tools-menu-list {
	padding: 6px !important;
}

.tools-menu-item {
	min-height: 40px !important;
	border-radius: var(--pos-radius-sm, 10px) !important;
	color: var(--pos-text-primary) !important;
}

.tools-menu-item :deep(.v-list-item-title) {
	font-size: 0.84rem;
	font-weight: 650;
	line-height: 1.2;
}

:deep(.command-input .v-field) {
	min-height: var(--item-command-height) !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--item-command-radius) !important;
	background: var(--pos-surface-raised) !important;
	box-shadow: none !important;
	--v-field-padding-top: 0;
	--v-field-padding-bottom: 0;
}

:deep(.command-input .v-field__overlay) {
	display: none !important;
	opacity: 0 !important;
}

:deep(.command-input .v-field__outline) {
	--v-field-border-opacity: 0 !important;
	color: transparent !important;
}

:deep(.command-input .v-field--focused) {
	border-color: color-mix(in srgb, var(--pos-primary) 44%, var(--pos-border-light)) !important;
	box-shadow: none !important;
	outline: 2px solid color-mix(in srgb, var(--pos-primary) 12%, transparent);
	outline-offset: 0;
}

:deep(.command-input .v-field__input) {
	min-height: var(--item-command-height) !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
	font-size: var(--pos-font-control, 13px);
	font-weight: 560;
	line-height: 1.2;
	color: var(--pos-text-primary);
}

:deep(.command-input .v-field__prepend-inner),
:deep(.command-input .v-field__clearable),
:deep(.command-input .v-field__append-inner) {
	min-height: var(--item-command-height) !important;
	align-items: center;
	color: var(--pos-text-muted);
}

:deep(.command-input--qty .v-field__input) {
	text-align: center;
	font-weight: 760;
	font-variant-numeric: tabular-nums;
}

:deep(.command-input .v-label) {
	font-size: var(--pos-font-meta, 11px);
	font-weight: 650;
	color: var(--pos-text-muted);
	opacity: 0.88;
}

:deep(.command-input input::placeholder) {
	color: var(--pos-text-muted);
	opacity: 0.72;
	font-weight: 520;
}

:deep(.v-theme--dark) .tools-menu-card,
:deep([data-theme="dark"]) .tools-menu-card,
:deep([data-theme-mode="dark"]) .tools-menu-card {
	box-shadow: 0 18px 42px rgba(0, 0, 0, 0.42) !important;
}

@media (max-width: 1279px) {
	.item-command-bar {
		--item-command-height: var(--pos-control-height, 44px);
		--item-command-icon-size: 44px;
	}

	.command-actions__desktop {
		display: none;
	}

	.command-tools-trigger {
		display: inline-flex !important;
		min-width: 44px !important;
		width: 44px !important;
		padding: 0 !important;
		justify-content: center;
	}

	.command-tools-trigger__label,
	.command-tools-trigger .v-icon:last-child {
		display: none !important;
	}
}

@media (max-width: 768px) {
	.item-command-bar {
		--item-command-height: var(--pos-control-height, 44px);
		--item-command-icon-size: 44px;
		gap: var(--pos-section-gap, 6px);
	}

	.item-command-bar__primary {
		display: flex;
		align-items: center;
		gap: var(--pos-control-gap, 6px);
	}

	.search-field-shell {
		flex: 1;
		min-width: 0;
	}

	.qty-field-shell {
		width: min(84px, 22vw);
		flex-shrink: 0;
	}

	.command-actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.command-icon-btn--scan {
		flex-shrink: 0;
	}
}

@media (max-width: 430px) {
	.item-command-bar__primary {
		grid-template-columns: minmax(0, 1fr) 44px;
	}

	.qty-field-shell {
		width: min(132px, 42vw);
	}

	:deep(.command-input .v-field__input) {
		font-size: 13px;
	}

	.command-actions {
		gap: var(--pos-control-gap, 6px);
	}

	.command-tools-trigger {
		min-width: 96px !important;
		width: 96px !important;
	}
}

@keyframes sync-progress-fade-in {
	from {
		opacity: 0;
		transform: translateY(-2px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
