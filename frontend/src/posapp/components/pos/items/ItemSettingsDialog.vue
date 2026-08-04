<template>
	<v-dialog v-model="dialogModel" max-width="460px" scrollable>
		<v-card class="item-settings-dialog-card pos-themed-card">
			<!-- Header -->
			<div class="dialog-header px-5 py-4 d-flex align-center justify-space-between">
				<div class="d-flex align-center gap-3">
					<div class="dialog-header-icon-wrap">
						<v-icon color="primary" size="22">mdi-tune-variant</v-icon>
					</div>
					<div>
						<h3 class="dialog-title text-subtitle-1 font-weight-bold mb-0">
							{{ __("Item Selector Settings") }}
						</h3>
						<p class="dialog-subtitle text-caption text-secondary mb-0">
							{{ __("Configure display & catalog behavior") }}
						</p>
					</div>
				</div>
				<v-btn
					icon="mdi-close"
					variant="text"
					density="compact"
					size="small"
					class="close-btn"
					@click="dialogModel = false"
					:aria-label="__('Close Settings')"
				/>
			</div>

			<v-divider class="border-opacity-10" />

			<!-- Body -->
			<v-card-text class="dialog-body px-5 py-3">
				<div class="settings-group">
					<!-- Add on New Line -->
					<div v-if="props.allowNewLineSetting" class="setting-row">
						<div class="setting-info">
							<v-icon size="20" class="setting-icon mr-3">mdi-format-line-spacing</v-icon>
							<div>
								<div class="setting-label">{{ __("Add on New Line") }}</div>
								<div class="setting-desc">{{ __("Insert items as separate rows") }}</div>
							</div>
						</div>
						<v-switch
							v-model="form.new_line"
							hide-details
							density="compact"
							color="primary"
						/>
					</div>

					<!-- Hide quantity decimals -->
					<div class="setting-row">
						<div class="setting-info">
							<v-icon size="20" class="setting-icon mr-3">mdi-numeric</v-icon>
							<div>
								<div class="setting-label">{{ __("Hide quantity decimals") }}</div>
								<div class="setting-desc">{{ __("Display whole integers for item quantities") }}</div>
							</div>
						</div>
						<v-switch
							v-model="form.hide_qty_decimals"
							hide-details
							density="compact"
							color="primary"
						/>
					</div>

					<!-- Hide zero rated items -->
					<div class="setting-row">
						<div class="setting-info">
							<v-icon size="20" class="setting-icon mr-3">mdi-eye-off-outline</v-icon>
							<div>
								<div class="setting-label">{{ __("Hide zero rated items") }}</div>
								<div class="setting-desc">{{ __("Hide items with zero price from grid") }}</div>
							</div>
						</div>
						<v-switch
							v-model="form.hide_zero_rate_items"
							hide-details
							density="compact"
							color="primary"
						/>
					</div>

					<!-- Show last invoice rate -->
					<div class="setting-row">
						<div class="setting-info">
							<v-icon size="20" class="setting-icon mr-3">mdi-history</v-icon>
							<div>
								<div class="setting-label">{{ __("Show last invoice rate") }}</div>
								<div class="setting-desc">{{ __("Display recent price paid by customer") }}</div>
							</div>
						</div>
						<v-switch
							v-model="form.show_last_invoice_rate"
							hide-details
							density="compact"
							color="primary"
						/>
					</div>

					<!-- Enable background sync -->
					<div class="setting-row flex-column align-stretch">
						<div class="d-flex align-center justify-space-between w-100">
							<div class="setting-info">
								<v-icon size="20" class="setting-icon mr-3">mdi-sync</v-icon>
								<div>
									<div class="setting-label">{{ __("Enable background sync") }}</div>
									<div class="setting-desc">{{ __("Periodically update item catalog") }}</div>
								</div>
							</div>
							<v-switch
								v-model="form.enable_background_sync"
								hide-details
								density="compact"
								color="primary"
							/>
						</div>
						<v-expand-transition>
							<div v-if="form.enable_background_sync" class="setting-subfield mt-2">
								<v-text-field
									v-model.number="form.background_sync_interval"
									:label="__('Sync Interval (seconds)')"
									type="number"
									density="compact"
									variant="outlined"
									color="primary"
									hide-details
									prepend-inner-icon="mdi-timer-outline"
									class="pos-themed-input"
									:min="10"
								/>
							</div>
						</v-expand-transition>
					</div>

					<!-- Custom items per page -->
					<div class="setting-row flex-column align-stretch">
						<div class="d-flex align-center justify-space-between w-100">
							<div class="setting-info">
								<v-icon size="20" class="setting-icon mr-3">mdi-grid</v-icon>
								<div>
									<div class="setting-label">{{ __("Custom items per page") }}</div>
									<div class="setting-desc">{{ __("Control items per grid page") }}</div>
								</div>
							</div>
							<v-switch
								v-model="form.enable_custom_items_per_page"
								hide-details
								density="compact"
								color="primary"
							/>
						</div>
						<v-expand-transition>
							<div v-if="form.enable_custom_items_per_page" class="setting-subfield mt-2">
								<v-text-field
									v-model.number="form.items_per_page"
									type="number"
									density="compact"
									variant="outlined"
									color="primary"
									hide-details
									prepend-inner-icon="mdi-format-list-numbered"
									:label="__('Items per page')"
									class="pos-themed-input"
								/>
							</div>
						</v-expand-transition>
					</div>

					<!-- Always fetch items from server -->
					<div class="setting-row">
						<div class="setting-info">
							<v-icon size="20" class="setting-icon mr-3">mdi-cloud-download-outline</v-icon>
							<div>
								<div class="setting-label">{{ __("Always fetch items from server") }}</div>
								<div class="setting-desc">{{ __("Bypass local cache when searching items") }}</div>
							</div>
						</div>
						<v-checkbox
							v-model="form.force_server_items"
							hide-details
							density="compact"
							color="primary"
						/>
					</div>
				</div>
			</v-card-text>

			<v-divider class="border-opacity-10" />

			<!-- Footer -->
			<div class="dialog-footer px-5 py-3 d-flex align-center justify-end gap-2">
				<v-btn
					variant="tonal"
					color="secondary"
					class="action-btn px-4"
					rounded="lg"
					@click="dialogModel = false"
				>
					{{ __("Cancel") }}
				</v-btn>
				<v-btn
					color="primary"
					variant="flat"
					class="action-btn px-5"
					rounded="lg"
					prepend-icon="mdi-check"
					@click="onSave"
				>
					{{ __("Save Settings") }}
				</v-btn>
			</div>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { computed, reactive, watch } from "vue";

const props = defineProps({
	modelValue: { type: Boolean, default: false },
	initialSettings: { type: Object, required: true },
	allowNewLineSetting: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "save"]);

const dialogModel = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val),
});

const form = reactive({
	new_line: false,
	hide_qty_decimals: false,
	hide_zero_rate_items: false,
	show_last_invoice_rate: true,
	enable_background_sync: true,
	background_sync_interval: 30,
	enable_custom_items_per_page: false,
	items_per_page: 50,
	force_server_items: false,
});

watch(
	() => props.modelValue,
	(val) => {
		if (val) {
			Object.assign(form, props.initialSettings);
		}
	},
);

const onSave = () => {
	emit("save", { ...form });
	dialogModel.value = false;
};
</script>

<style scoped>
.item-settings-dialog-card {
	border-radius: var(--pos-radius-lg, 16px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	box-shadow: var(--pos-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.12)) !important;
	overflow: hidden;
}

.dialog-header-icon-wrap {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 10%, transparent);
	display: flex;
	align-items: center;
	justify-content: center;
}

.dialog-title {
	color: var(--pos-text-primary, #0f172a);
}

.dialog-subtitle {
	color: var(--pos-text-secondary, #64748b);
}

.settings-group {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.setting-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	border-radius: 12px;
	border: 1px solid var(--pos-border-light, #e2e8f0);
	background: var(--pos-surface-muted, #f8fafc);
	transition: background-color 0.2s ease, border-color 0.2s ease;
}

.setting-row:hover {
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 4%, var(--pos-surface-muted, #f8fafc));
	border-color: color-mix(in srgb, var(--pos-primary, #2563eb) 20%, var(--pos-border-light, #e2e8f0));
}

.setting-info {
	display: flex;
	align-items: center;
	min-width: 0;
	flex: 1;
}

.setting-icon {
	color: var(--pos-primary, #2563eb) !important;
	flex-shrink: 0;
}

.setting-label {
	font-size: 0.88rem;
	font-weight: 650;
	color: var(--pos-text-primary, #0f172a);
	line-height: 1.2;
}

.setting-desc {
	font-size: 0.74rem;
	color: var(--pos-text-secondary, #64748b);
	line-height: 1.25;
	margin-top: 2px;
}

.setting-subfield {
	padding-inline-start: 32px;
	width: 100%;
}

.action-btn {
	font-weight: 600 !important;
	text-transform: none !important;
	letter-spacing: normal !important;
}

.gap-2 {
	gap: 8px;
}

.gap-3 {
	gap: 12px;
}
</style>
