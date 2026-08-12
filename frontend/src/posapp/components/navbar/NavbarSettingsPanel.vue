<template>
	<div
		v-if="modelValue"
		class="navbar-settings-panel-backdrop"
		data-test="navbar-settings-panel"
		@click.self="emit('update:modelValue', false)"
	>
		<section class="navbar-settings-panel pos-themed-card">
			<div class="navbar-settings-panel__header">
				<div class="navbar-settings-panel__copy">
					<div class="navbar-settings-panel__eyebrow">{{ __("Settings") }}</div>
					<div class="navbar-settings-panel__title">
						{{ __("POS controls and maintenance") }}
					</div>
					<div class="navbar-settings-panel__subtitle">
						{{
							__("Manage offline tools, terminal controls, and maintenance from one workspace.")
						}}
					</div>
				</div>
				<button
					type="button"
					class="navbar-settings-panel__close"
					data-test="navbar-settings-panel-close"
					@click="emit('update:modelValue', false)"
				>
					<span class="mdi mdi-close" aria-hidden="true"></span>
				</button>
			</div>

			<div class="navbar-settings-panel__workspace">
				<aside class="navbar-settings-panel__rail">
					<div class="navbar-settings-panel__rail-label">
						{{ __("Categories") }}
					</div>
					<div class="navbar-settings-panel__categories">
						<button
							v-for="section in sections"
							:key="section.id"
							type="button"
							class="navbar-settings-panel__category"
							:class="{
								'navbar-settings-panel__category--active': section.id === activeSectionId,
							}"
							:data-test="`settings-panel-category-${section.id}`"
							@click="setActiveSection(section.id)"
						>
							<span
								class="navbar-settings-panel__category-icon"
								:class="`navbar-settings-panel__category-icon--${getSectionTone(section.id)}`"
							>
								<span :class="['mdi', getSectionIcon(section.id)]" aria-hidden="true"></span>
							</span>
							<span class="navbar-settings-panel__category-copy">
								<span class="navbar-settings-panel__category-title">{{ section.title }}</span>
								<span class="navbar-settings-panel__category-meta">
									{{ formatMessage("{0} actions", [section.actions.length]) }}
								</span>
							</span>
						</button>
					</div>
				</aside>

				<div v-if="activeSection" class="navbar-settings-panel__detail">
					<div class="navbar-settings-panel__detail-hero">
						<div class="navbar-settings-panel__detail-icon-surface">
							<span
								class="navbar-settings-panel__detail-icon"
								:class="`navbar-settings-panel__detail-icon--${getDetailTone()}`"
							>
								<span :class="['mdi', getDetailIcon()]" aria-hidden="true"></span>
							</span>
						</div>
						<div class="navbar-settings-panel__detail-copy">
							<div
								class="navbar-settings-panel__section-title"
								data-test="settings-panel-detail-title"
							>
								{{ activeAction ? activeAction.label : activeSection.title }}
							</div>
							<div class="navbar-settings-panel__section-description">
								{{ activeAction ? activeAction.subtitle : activeSection.description }}
							</div>
						</div>
						<div class="navbar-settings-panel__detail-chip">
							{{
								activeAction
									? activeSection.title
									: formatMessage("{0} actions", [activeSection.actions.length])
							}}
						</div>
					</div>

					<div
						class="navbar-settings-panel__section"
						:data-test="`settings-panel-section-${activeSection.id}`"
					>
						<div
							v-if="activeAction"
							class="navbar-settings-panel__section-block navbar-settings-panel__detail-view"
							data-test="settings-panel-detail-view"
						>
							<button
								type="button"
								class="navbar-settings-panel__detail-back"
								data-test="settings-panel-detail-back"
								@click="clearActiveAction"
							>
								<span class="mdi mdi-arrow-left" aria-hidden="true"></span>
								{{ formatMessage("Back to {0}", [activeSection.title]) }}
							</button>
							<NavbarCashierPinForm
								v-if="activeAction.id === 'manage-cashier-pin'"
								:pos-profile="posProfile"
								:current-cashier="currentCashier"
								:current-cashier-display="currentCashierDisplay"
								:show-back="false"
								@saved="handleEmbeddedActionSaved"
							/>
							<div v-else class="navbar-settings-panel__embedded-placeholder">
								<div class="navbar-settings-panel__embedded-title">
									{{ activeAction.label }}
								</div>
								<div class="navbar-settings-panel__embedded-copy">
									{{ __("This action now opens inside the settings workspace.") }}
								</div>
							</div>
						</div>

						<div v-else class="navbar-settings-panel__section-block">
							<div class="navbar-settings-panel__section-block-title">
								{{ __("Available Actions") }}
							</div>
							<div class="navbar-settings-panel__actions">
								<button
									v-for="action in activeSection.actions"
									:key="action.id"
									type="button"
									class="navbar-settings-panel__action"
									:class="`navbar-settings-panel__action--${action.tone || 'neutral'}`"
									:disabled="action.disabled"
									:data-test="`settings-panel-action-${action.id}`"
									@click="handleActionSelection(action)"
								>
									<span class="navbar-settings-panel__action-icon">
										<span :class="['mdi', action.icon]" aria-hidden="true"></span>
									</span>
									<span class="navbar-settings-panel__action-copy">
										<span class="navbar-settings-panel__action-title">{{
											action.label
										}}</span>
										<span class="navbar-settings-panel__action-subtitle">{{
											action.subtitle
										}}</span>
									</span>
								</button>
							</div>
						</div>

						<div v-if="!activeAction" class="navbar-settings-panel__tip-card">
							<div class="navbar-settings-panel__tip-title">
								{{ __("How this section works") }}
							</div>
							<div class="navbar-settings-panel__tip-copy">
								{{ getSectionTip(activeSection.id) }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import NavbarCashierPinForm from "./NavbarCashierPinForm.vue";

defineOptions({
	name: "NavbarSettingsPanel",
});

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
	},
	sections: {
		type: Array,
		default: () => [],
	},
	posProfile: {
		type: Object,
		default: null,
	},
	currentCashier: {
		type: Object,
		default: null,
	},
	currentCashierDisplay: {
		type: String,
		default: "",
	},
});

const emit = defineEmits(["update:modelValue", "select-action"]);

const formatMessage = (text, args = []) => {
	const nextArgs = Array.isArray(args) ? args : [args];
	const translated = window.__ ? window.__(text) : text;
	return String(translated).replace(/\{(\d+)\}/g, (_, index) => `${nextArgs[index] ?? ""}`);
};

const __ = (text) => (window.__ ? window.__(text) : text);

const activeSectionId = ref("");
const activeActionId = ref("");

const SECTION_META = {
	"offline-sync": {
		icon: "mdi-cloud-sync-outline",
		tone: "warning",
		tip: __(
			"Use this section when cached prerequisite data needs a refresh, rebuild, or diagnostics review.",
		),
	},
	"terminal-devices": {
		icon: "mdi-monitor-dashboard",
		tone: "primary",
		tip: __(
			"Terminal tools affect this checkout station, customer-facing displays, and future printer/device controls.",
		),
	},
	personal: {
		icon: "mdi-account-circle-outline",
		tone: "secondary",
		tip: __(
			"Personal preferences adjust the current cashier experience without changing the active POS route.",
		),
	},
	"system-diagnostics": {
		icon: "mdi-cog-outline",
		tone: "neutral",
		tip: __(
			"System actions are low-frequency maintenance controls such as app info, support diagnostics, and session controls.",
		),
	},
};

const activeSection = computed(
	() => props.sections.find((section) => section.id === activeSectionId.value) || props.sections[0] || null,
);

const activeAction = computed(
	() => activeSection.value?.actions?.find((action) => action.id === activeActionId.value) || null,
);

watch(
	() => props.sections,
	(sections) => {
		if (!Array.isArray(sections) || sections.length === 0) {
			activeSectionId.value = "";
			return;
		}
		const stillValid = sections.some((section) => section.id === activeSectionId.value);
		if (!stillValid) {
			activeSectionId.value = sections[0].id;
			activeActionId.value = "";
		}
	},
	{ immediate: true, deep: true },
);

function setActiveSection(sectionId) {
	activeSectionId.value = sectionId;
	activeActionId.value = "";
}

function clearActiveAction() {
	activeActionId.value = "";
}

function handleActionSelection(action) {
	if (!action || action.disabled) {
		return;
	}
	if (action.id === "manage-cashier-pin") {
		activeActionId.value = action.id;
		return;
	}
	emit("select-action", action.id);
}

function getSectionIcon(sectionId) {
	return SECTION_META[sectionId]?.icon || "mdi-tune";
}

function getSectionTone(sectionId) {
	return SECTION_META[sectionId]?.tone || "neutral";
}

function getSectionTip(sectionId) {
	return (
		SECTION_META[sectionId]?.tip ||
		__("Settings in this section update the POS workspace without changing the current route.")
	);
}

function getDetailIcon() {
	return activeAction.value?.icon || getSectionIcon(activeSection.value?.id);
}

function getDetailTone() {
	return activeAction.value?.tone || getSectionTone(activeSection.value?.id);
}

function handleEmbeddedActionSaved() {
	// Success state stays inside the embedded form; no additional shell action required yet.
}
</script>

<style scoped>
.navbar-settings-panel-backdrop {
	position: fixed;
	inset: 0;
	z-index: 1100;
	background: rgba(15, 23, 42, 0.45);
	backdrop-filter: blur(8px);
	display: grid;
	place-items: center;
	padding: 16px;
}

.navbar-settings-panel {
	width: min(960px, calc(100vw - 32px));
	max-height: min(80vh, 700px);
	border-radius: var(--pos-radius-lg, 20px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	box-shadow: var(--pos-shadow-lg, 0 24px 60px rgba(15, 23, 42, 0.2)) !important;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.navbar-settings-panel__header {
	padding: 16px 20px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	border-bottom: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-muted, #f8fafc);
}

.navbar-settings-panel__header-info {
	display: flex;
	align-items: center;
	gap: 14px;
}

.navbar-settings-panel__header-icon-wrap {
	width: 42px;
	height: 42px;
	border-radius: 12px;
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 12%, transparent);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.navbar-settings-panel__close {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-raised, #ffffff);
	color: var(--pos-text-secondary, #64748b);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	cursor: pointer;
	transition: all 0.18s ease;
}

.navbar-settings-panel__close:hover {
	background: var(--pos-surface-muted, #f1f5f9);
	color: var(--pos-text-primary, #0f172a);
	border-color: var(--pos-border);
}

.navbar-settings-panel__copy,
.navbar-settings-panel__section,
.navbar-settings-panel__section-head,
.navbar-settings-panel__actions,
.navbar-settings-panel__action-copy,
.navbar-settings-panel__detail,
.navbar-settings-panel__detail-copy,
.navbar-settings-panel__categories,
.navbar-settings-panel__category-copy,
.navbar-settings-panel__section-block {
	display: grid;
	gap: 4px;
}

.navbar-settings-panel__eyebrow {
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: var(--pos-primary, #2563eb);
}

.navbar-settings-panel__title {
	font-size: 18px;
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
	line-height: 1.25;
}

.navbar-settings-panel__subtitle,
.navbar-settings-panel__section-description,
.navbar-settings-panel__action-subtitle {
	font-size: 12px;
	line-height: 1.45;
	color: var(--pos-text-secondary, #64748b);
}

.navbar-settings-panel__workspace {
	display: grid;
	grid-template-columns: 248px minmax(0, 1fr);
	flex: 1;
	min-height: 0;
	overflow: hidden;
}

.navbar-settings-panel__rail {
	padding: 16px 14px;
	border-right: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-muted, #f8fafc);
	display: grid;
	align-content: start;
	gap: 12px;
	overflow-y: auto;
}

.navbar-settings-panel__rail-label {
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--pos-text-secondary, #64748b);
	padding-left: 4px;
}

.navbar-settings-panel__categories {
	gap: 8px;
}

.navbar-settings-panel__category {
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-raised, #ffffff);
	border-radius: 14px;
	padding: 10px 12px;
	display: flex;
	align-items: center;
	gap: 12px;
	text-align: left;
	width: 100%;
	cursor: pointer;
	transition: all 0.18s ease;
}

.navbar-settings-panel__category:hover {
	transform: translateY(-1px);
	border-color: var(--pos-primary, #2563eb);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.navbar-settings-panel__category--active {
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 10%, transparent) !important;
	border-color: var(--pos-primary, #2563eb) !important;
	box-shadow: 0 2px 8px color-mix(in srgb, var(--pos-primary, #2563eb) 15%, transparent);
}

.navbar-settings-panel__category-icon,
.navbar-settings-panel__detail-icon {
	width: 38px;
	height: 38px;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: white;
	flex-shrink: 0;
	font-size: 18px;
}

.navbar-settings-panel__category-title,
.navbar-settings-panel__detail-chip,
.navbar-settings-panel__section-block-title,
.navbar-settings-panel__tip-title,
.navbar-settings-panel__action-title,
.navbar-settings-panel__section-title {
	font-size: 14px;
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
}

.navbar-settings-panel__category-meta {
	font-size: 11px;
	color: var(--pos-text-secondary, #64748b);
}

.navbar-settings-panel__detail {
	padding: 18px 20px;
	overflow-y: auto;
	display: grid;
	align-content: start;
	gap: 18px;
}

.navbar-settings-panel__detail-hero {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 14px 16px;
	border-radius: 16px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 4%, var(--pos-surface-muted, #f8fafc));
}

.navbar-settings-panel__detail-copy {
	flex: 1;
	min-width: 0;
}

.navbar-settings-panel__detail-chip {
	padding: 6px 12px;
	border-radius: 8px;
	font-size: 12px;
	font-weight: 600;
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 12%, transparent);
	color: var(--pos-primary, #2563eb);
	white-space: nowrap;
}

.navbar-settings-panel__section {
	gap: 16px;
}

.navbar-settings-panel__section-block,
.navbar-settings-panel__tip-card {
	padding: 16px;
	border-radius: 16px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-raised, #ffffff);
}

.navbar-settings-panel__tip-card {
	display: grid;
	gap: 6px;
	border-color: color-mix(in srgb, var(--pos-warning, #f59e0b) 30%, transparent);
	background: color-mix(in srgb, var(--pos-warning, #f59e0b) 6%, transparent);
}

.navbar-settings-panel__tip-title {
	color: color-mix(in srgb, var(--pos-warning, #f59e0b) 90%, #000);
}

.navbar-settings-panel__tip-copy {
	font-size: 12px;
	line-height: 1.5;
	color: var(--pos-text-secondary, #64748b);
}

.navbar-settings-panel__detail-view {
	gap: 14px;
}

.navbar-settings-panel__detail-back {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	width: fit-content;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-muted, #f8fafc);
	color: var(--pos-text-primary, #0f172a);
	border-radius: 8px;
	padding: 6px 12px;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
}

.navbar-settings-panel__embedded-placeholder {
	border: 1px dashed var(--pos-border-light, #cbd5e1);
	border-radius: 14px;
	padding: 18px;
	display: grid;
	gap: 8px;
	background: var(--pos-surface-muted, #f8fafc);
}

.navbar-settings-panel__embedded-title {
	font-size: 14px;
	font-weight: 700;
	color: var(--pos-text-primary, #0f172a);
}

.navbar-settings-panel__embedded-copy {
	font-size: 12px;
	line-height: 1.5;
	color: var(--pos-text-secondary, #64748b);
}

.navbar-settings-panel__actions {
	gap: 10px;
}

.navbar-settings-panel__action {
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-raised, #ffffff);
	border-radius: 14px;
	padding: 12px 14px;
	display: flex;
	align-items: center;
	gap: 14px;
	width: 100%;
	text-align: left;
	cursor: pointer;
	transition: all 0.2s ease;
}

.navbar-settings-panel__action:hover {
	transform: translateY(-2px);
	border-color: var(--pos-primary, #2563eb);
	box-shadow: var(--pos-shadow-md, 0 6px 20px rgba(15, 23, 42, 0.08));
}

.navbar-settings-panel__action:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

.navbar-settings-panel__action-icon {
	width: 40px;
	height: 40px;
	border-radius: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: white;
	flex-shrink: 0;
	font-size: 20px;
}

/* Color Tones */
.navbar-settings-panel__action--primary .navbar-settings-panel__action-icon,
.navbar-settings-panel__category-icon--primary,
.navbar-settings-panel__detail-icon--primary {
	background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
}

.navbar-settings-panel__action--secondary .navbar-settings-panel__action-icon,
.navbar-settings-panel__category-icon--secondary,
.navbar-settings-panel__detail-icon--secondary {
	background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
}

.navbar-settings-panel__action--warning .navbar-settings-panel__action-icon,
.navbar-settings-panel__category-icon--warning,
.navbar-settings-panel__detail-icon--warning {
	background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.navbar-settings-panel__action--info .navbar-settings-panel__action-icon,
.navbar-settings-panel__category-icon--info,
.navbar-settings-panel__detail-icon--info {
	background: linear-gradient(135deg, #0288d1 0%, #38bdf8 100%);
}

.navbar-settings-panel__action--danger .navbar-settings-panel__action-icon,
.navbar-settings-panel__category-icon--danger,
.navbar-settings-panel__detail-icon--danger {
	background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

.navbar-settings-panel__action--neutral .navbar-settings-panel__action-icon,
.navbar-settings-panel__category-icon--neutral,
.navbar-settings-panel__detail-icon--neutral {
	background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
}

@media (max-width: 900px) {
	.navbar-settings-panel {
		width: min(100vw - 16px, 780px);
	}

	.navbar-settings-panel__workspace {
		grid-template-columns: minmax(0, 1fr);
	}

	.navbar-settings-panel__rail {
		border-right: 0;
		border-bottom: 1px solid var(--pos-border-light, #e2e8f0);
		padding-bottom: 14px;
	}

	.navbar-settings-panel__categories {
		display: flex;
		overflow-x: auto;
		padding-bottom: 2px;
	}

	.navbar-settings-panel__category {
		min-width: 220px;
	}

	.navbar-settings-panel__detail-hero {
		flex-wrap: wrap;
	}
}
</style>
