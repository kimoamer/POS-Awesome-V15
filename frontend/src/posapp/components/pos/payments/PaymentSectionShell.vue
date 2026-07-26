<template>
	<section class="payment-section-shell" :class="{ 'payment-section-shell--collapsible': collapsible }">
		<header class="payment-section-shell__header" @click="collapsible && toggleExpand()">
			<div class="payment-section-shell__title-group">
				<v-icon v-if="icon" size="20" class="payment-section-shell__icon">
					{{ icon }}
				</v-icon>
				<h3 class="payment-section-shell__title">{{ title }}</h3>
				<v-chip v-if="badge" size="x-small" color="primary" variant="tonal" class="ml-2">
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
					@click.stop="toggleExpand()"
				>
					<v-icon size="18">
						{{ isExpanded ? "mdi-chevron-up" : "mdi-chevron-down" }}
					</v-icon>
				</v-btn>
			</div>
		</header>

		<div v-show="!collapsible || isExpanded" class="payment-section-shell__body">
			<slot></slot>
		</div>

		<footer v-if="$slots.footer && (!collapsible || isExpanded)" class="payment-section-shell__footer">
			<slot name="footer"></slot>
		</footer>
	</section>
</template>

<script setup lang="ts">
import { ref } from "vue";

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

const isExpanded = ref(props.expanded);

const toggleExpand = () => {
	if (props.collapsible) {
		isExpanded.value = !isExpanded.value;
	}
};
</script>

<style scoped>
.payment-section-shell {
	background: var(--pos-card-bg, var(--pos-surface-raised, #ffffff));
	border: 1px solid var(--pos-border-light, rgba(0, 0, 0, 0.08));
	border-radius: var(--pos-radius-md, 12px);
	box-shadow: 0 4px 14px var(--pos-shadow-light, rgba(0, 0, 0, 0.03));
	overflow: hidden;
	margin-bottom: 12px;
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
