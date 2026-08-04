<template>
	<div class="notification-bell-btn">
		<v-menu v-model="open" :close-on-content-click="false" offset="[0, 8]" location="bottom end">
			<template #activator="{ props }">
				<v-btn
					v-bind="props"
					icon
					variant="elevated"
					size="small"
					class="pos-themed-button notification-bell-trigger"
					:aria-label="__('View notifications') + (unreadCount ? ` (${unreadCount})` : '')"
				>
					<v-badge
						:model-value="unreadCount > 0"
						:content="unreadCount"
						color="error"
						floating
						v-if="notifications.length"
					>
						<v-icon class="pos-text-primary" size="18">mdi-bell-outline</v-icon>
					</v-badge>
					<v-icon v-else class="pos-text-primary" size="18">mdi-bell-outline</v-icon>
				</v-btn>
			</template>

			<v-card class="pos-themed-card notification-card" elevation="12">
				<div class="notification-card__header px-4 py-3 d-flex align-center justify-space-between">
					<div class="header-text">
						<div class="notification-heading text-subtitle-1 font-weight-bold mb-0">{{ __("Notifications") }}</div>
						<div class="subtitle text-caption text-secondary">
							{{
								notifications.length
									? __("Recent updates about your invoices")
									: __("You have no notifications right now")
							}}
						</div>
					</div>
					<v-btn
						v-if="notifications.length"
						variant="tonal"
						color="secondary"
						size="small"
						rounded="lg"
						class="clear-btn text-none px-3"
						@click="clearAll"
					>
						<v-icon start size="14">mdi-broom</v-icon>
						{{ __("Clear All") }}
					</v-btn>
				</div>

				<v-divider class="border-opacity-10" />

				<div class="notification-list">
					<div v-if="!notifications.length" class="empty-state py-6 px-4 text-center">
						<v-icon size="36" class="empty-icon text-secondary mb-2">mdi-bell-off-outline</v-icon>
						<div class="empty-title text-subtitle-2 font-weight-bold">{{ __("No notifications yet") }}</div>
						<div class="empty-subtitle text-caption text-secondary">
							{{ __("We'll let you know if an invoice fails to submit") }}
						</div>
					</div>
					<div v-else class="notification-items">
						<div
							v-for="item in notifications"
							:key="item.id"
							class="notification-item px-4 py-3 d-flex align-start gap-3"
						>
							<div class="notification-icon flex-shrink-0" :class="item.color || 'error'">
								<v-icon size="18">
									{{ item.color === 'success' ? 'mdi-check-circle-outline' : (item.color === 'info' ? 'mdi-information-outline' : 'mdi-bell-alert-outline') }}
								</v-icon>
							</div>
							<div class="notification-content min-w-0 flex-grow-1">
								<div class="notification-title text-subtitle-2 font-weight-bold mb-0">{{ item.title }}</div>
								<div v-if="item.detail" class="notification-detail text-body-2 text-secondary my-1">
									{{ item.detail }}
								</div>
								<div class="notification-time text-caption text-secondary">{{ formatTimestamp(item.timestamp) }}</div>
							</div>
						</div>
					</div>
				</div>
			</v-card>
		</v-menu>
	</div>
</template>

<script setup lang="ts">
import { ref, toRefs, watch } from "vue";

defineOptions({
	name: "NotificationBell",
});

interface NotificationItem {
	id: string | number;
	title: string;
	detail?: string;
	timestamp: string | number | Date;
	color?: string;
}

interface Props {
	notifications?: NotificationItem[];
	unreadCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
	notifications: () => [],
	unreadCount: 0,
});
const { notifications, unreadCount } = toRefs(props);

const emit = defineEmits<{
	(_event: "mark-read"): void;
	(_event: "clear"): void;
}>();

// @ts-ignore
const __ = (window as any).__ || ((text: string) => text);
const open = ref(false);

watch(open, (value) => {
	if (value) {
		emit("mark-read");
	}
});

function clearAll() {
	emit("clear");
}

function formatTimestamp(ts: string | number | Date) {
	if (!ts) {
		return "";
	}
	try {
		const date = new Date(ts);
		return date.toLocaleString();
	} catch {
		return String(ts);
	}
}
</script>

<style scoped>
.notification-bell-btn {
	display: flex;
	align-items: center;
	justify-content: center;
}

.notification-bell-trigger {
	width: var(--pos-header-control-size, 44px) !important;
	height: var(--pos-header-control-size, 44px) !important;
	min-width: var(--pos-header-control-size, 44px) !important;
	min-height: var(--pos-header-control-size, 44px) !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: 11px !important;
	background: var(--pos-surface-raised) !important;
	box-shadow: 0 6px 14px rgba(15, 23, 42, 0.055) !important;
	color: var(--pos-text-primary) !important;
}

.notification-bell-trigger:hover {
	border-color: color-mix(in srgb, var(--pos-primary) 28%, var(--pos-border-light)) !important;
	color: var(--pos-primary) !important;
}

.notification-card {
	width: min(380px, 92vw);
	border-radius: var(--pos-radius-lg, 16px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	border: 1px solid var(--pos-border-light, #e2e8f0) !important;
	box-shadow: var(--pos-shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.15)) !important;
	overflow: hidden;
}

.notification-card__header {
	background: var(--pos-surface-muted, #f8fafc);
}

.notification-list {
	max-height: min(380px, 60vh);
	overflow-y: auto;
}

.notification-items {
	display: flex;
	flex-direction: column;
}

.notification-item {
	border-bottom: 1px solid var(--pos-border-light, #f1f5f9);
	transition: background-color 0.2s ease;
}

.notification-item:hover {
	background-color: color-mix(in srgb, var(--pos-primary, #2563eb) 4%, transparent);
}

.notification-item:last-child {
	border-bottom: none;
}

.notification-icon {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	margin-top: 2px;
}

.notification-icon.error {
	background: linear-gradient(135deg, #ef4444, #f87171);
}

.notification-icon.success {
	background: linear-gradient(135deg, #10b981, #34d399);
}

.notification-icon.info {
	background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.notification-content {
	display: flex;
	flex-direction: column;
}

.notification-title {
	color: var(--pos-text-primary, #0f172a);
	line-height: 1.25;
}

.notification-detail {
	line-height: 1.35;
	word-break: break-word;
}

.notification-time {
	font-size: 0.72rem !important;
	color: var(--pos-text-secondary, #64748b);
}

.gap-3 {
	gap: 12px;
}

.min-w-0 {
	min-width: 0;
}

@media (max-width: 1279px) {
	.notification-bell-trigger {
		width: var(--pos-header-control-size-compact, 40px) !important;
		height: var(--pos-header-control-size-compact, 40px) !important;
		min-width: var(--pos-header-control-size-compact, 40px) !important;
		min-height: var(--pos-header-control-size-compact, 40px) !important;
	}
}
</style>
