<template>
	<v-dialog
		:model-value="Boolean(dialog)"
		:max-width="480"
		:persistent="dialog?.persistent === true"
		@update:model-value="handleModelUpdate"
		@keydown.esc="handleEscape"
	>
		<v-card class="pos-confirm-dialog" role="alertdialog" aria-modal="true">
			<v-card-title class="pos-confirm-dialog__title">
				<v-icon
					:icon="dialogIcon"
					:color="dialog?.color || 'primary'"
					size="24"
				/>
				<span>{{ dialog?.title }}</span>
			</v-card-title>
			<v-card-text class="pos-confirm-dialog__message">
				{{ dialog?.message }}
			</v-card-text>
			<v-card-actions class="pos-confirm-dialog__actions">
				<v-btn variant="outlined" min-height="44" @click="dialogs.cancel()">
					{{ dialog?.cancelLabel || __("Cancel") }}
				</v-btn>
				<v-btn
					:color="dialog?.color || 'primary'"
					variant="flat"
					min-height="44"
					@click="dialogs.accept()"
				>
					{{ dialog?.confirmLabel || __("Continue") }}
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useDialogStore } from "../../stores/dialogStore";

const dialogs = useDialogStore();
const { active: dialog } = storeToRefs(dialogs);
const __ =
	(globalThis as any).__ ||
	((value: string) => value);

const dialogIcon = computed(() => {
	if (dialog.value?.color === "error") return "mdi-alert-octagon-outline";
	if (dialog.value?.color === "warning") return "mdi-alert-outline";
	return "mdi-help-circle-outline";
});

function handleModelUpdate(open: boolean) {
	if (!open && dialog.value?.persistent !== true) dialogs.cancel();
}

function handleEscape() {
	if (dialog.value?.persistent !== true) dialogs.cancel();
}
</script>

<style scoped>
.pos-confirm-dialog {
	border-radius: var(--pos-radius-lg, 18px);
	background: var(--pos-dialog-bg, #fff);
	color: var(--pos-text-primary, #111827);
}

.pos-confirm-dialog__title {
	display: flex;
	align-items: center;
	gap: var(--pos-space-3, 12px);
	white-space: normal;
}

.pos-confirm-dialog__message {
	white-space: pre-line;
	line-height: 1.55;
	color: var(--pos-text-secondary, #475467);
}

.pos-confirm-dialog__actions {
	justify-content: flex-end;
	gap: var(--pos-space-2, 8px);
	padding: var(--pos-space-4, 16px);
}
</style>
