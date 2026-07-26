<template>
	<section class="payment-section-shell" :class="{ 'payment-section-shell--collapsible': collapsible }">
		<header
			class="payment-section-shell__header"
			:role="collapsible ? 'button' : undefined"
			:tabindex="collapsible ? 0 : undefined"
			:aria-expanded="collapsible ? internalExpanded : undefined"
			@click="toggleExpand"
			@keydown.enter.prevent="toggleExpand"
			@keydown.space.prevent="toggleExpand"
		>
			<div class="payment-section-shell__title-group">
				<v-icon v-if="icon" size="20" class="payment-section-shell__icon">
					{{ icon }}
				</v-icon>
				<h3 class="payment-section-shell__title">{{ title }}</h3>
				<v-chip v-if="badge" size="x-small" color="primary" variant="tonal" class="payment-section-shell__badge">
					{{ badge }}
				</v-chip>
			</div>

			<div class="payment-section-shell__actions" @click.stop>
				<slot name="actions"></slot>
				<v-btn
					v-if="collapsible"
					icon
					variant="text"
					size="x-small"
					class="payment-section-shell__toggle-btn"
					:aria-label="internalExpanded ? __('Collapse section') : __('Expand section')"
					@click.stop="toggleExpand()"
				>
					<v-icon size="18">
						{{ internalExpanded ? "mdi-chevron-up" : "mdi-chevron-down" }}
					</v-icon>
				</v-btn>
			</div>
		</header>

		<div v-show="!collapsible || internalExpanded" class="payment-section-shell__body">
			<slot></slot>
		</div>

		<footer v-if="$slots.footer && (!collapsible || internalExpanded)" class="payment-section-shell__footer">
			<slot name="footer"></slot>
		</footer>
	</section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface Props {
	title: string;
	icon?: string;
	badge?: string;
	collapsible?: boolean;
	expanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	collapsible: false,
	expanded: true,
});

const emit = defineEmits<{
	(e: "update:expanded", value: boolean): void;
}>();

const internalExpanded = ref(props.expanded);

watch(
	() => props.expanded,
	(val) => {
		internalExpanded.value = val;
	},
);

const toggleExpand = () => {
	if (!props.collapsible) return;
	internalExpanded.value = !internalExpanded.value;
	emit("update:expanded", internalExpanded.value);
};

const __ = (window as any).__ || ((s: string) => s);
</script>

<style scoped>
.payment-section-shell {
	background: var(--pos-card-bg, var(--pos-surface-raised, #ffffff));
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	border-radius: var(--pos-radius-md, 12px);
	box-shadow: 0 4px 14px var(--pos-shadow-light, rgba(0, 0, 0, 0.03));
	overflow: hidden;
	transition: all 0.15s ease;
}

.payment-section-shell__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 44px;
	padding: 10px 14px;
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
	border-bottom: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
}

.payment-section-shell--collapsible .payment-section-shell__header {
	cursor: pointer;
	user-select: none;
}

.payment-section-shell__header:focus-visible {
	outline: 2px solid var(--pos-primary, #2563eb);
	outline-offset: -2px;
}

.payment-section-shell__title-group {
	display: flex;
	align-items: center;
	gap: 8px;
}

.payment-section-shell__icon {
	color: var(--pos-primary, #2563eb);
}

.payment-section-shell__title {
	margin: 0;
	font-size: 0.9375rem;
	font-weight: 700;
	line-height: 1.3;
	color: var(--pos-text-primary, #0f172a);
}

.payment-section-shell__badge {
	margin-inline-start: 8px;
}

.payment-section-shell__actions {
	display: flex;
	align-items: center;
	gap: 6px;
}

.payment-section-shell__body {
	padding: 14px;
}

.payment-section-shell__footer {
	padding: 10px 14px;
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
}
</style>
