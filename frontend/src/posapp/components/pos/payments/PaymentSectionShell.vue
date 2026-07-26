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
				<span v-if="icon" class="payment-section-shell__icon-box">
					<v-icon size="16">{{ icon }}</v-icon>
				</span>
				<div class="payment-section-shell__copy">
					<h3 class="payment-section-shell__title">{{ title }}</h3>
					<small v-if="description" class="payment-section-shell__description">{{ description }}</small>
				</div>
				<v-chip v-if="badge" size="x-small" color="primary" variant="tonal" class="payment-section-shell__badge">
					{{ badge }}
				</v-chip>
			</div>

			<div class="payment-section-shell__actions" @click.stop>
				<slot name="header-meta"></slot>
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
	description?: string;
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
	width: 100%;
	min-width: 0;
	align-self: stretch;
	background: var(--pos-card-bg, var(--pos-surface-raised, #ffffff));
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	border-radius: var(--payment-radius-md, 10px);
	box-shadow: none;
	overflow: hidden;
	transition: border-color 0.15s ease;
}

.payment-section-shell__header {
	width: 100%;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 40px;
	padding: 4px 8px;
	background: transparent;
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
	flex: 1 1 auto;
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 8px;
}

.payment-section-shell__icon-box {
	width: 28px;
	height: 28px;
	flex: 0 0 28px;
	display: grid;
	place-items: center;
	border-radius: var(--payment-radius-sm, 8px);
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 9%, transparent);
	color: var(--pos-primary, #2563eb);
}

.payment-section-shell__copy {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.payment-section-shell__title {
	margin: 0;
	font-size: 13px;
	font-weight: 700;
	line-height: 1.2;
	color: var(--pos-text-primary, #0f172a);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.payment-section-shell__description {
	font-size: 11px;
	color: var(--pos-text-secondary, #64748b);
}

.payment-section-shell__badge {
	margin-inline-start: 6px;
}

.payment-section-shell__actions {
	flex: 0 0 auto;
	margin-inline-start: var(--payment-space-2, 8px);
	display: flex;
	align-items: center;
	gap: 4px;
}

.payment-section-shell__body {
	padding: 8px 10px 10px;
}

.payment-section-shell__footer {
	padding: 8px 10px;
	background: var(--pos-surface-muted, rgba(0, 0, 0, 0.02));
	border-top: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.06));
}
</style>
