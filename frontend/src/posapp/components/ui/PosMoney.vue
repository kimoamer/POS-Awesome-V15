<template>
	<bdi class="pos-money" :class="{ 'pos-money--negative': numericValue < 0 }">
		{{ formatted }}
	</bdi>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
	defineProps<{
		value?: number | string | null;
		currency?: string;
		locale?: string;
		minimumFractionDigits?: number;
		maximumFractionDigits?: number;
	}>(),
	{ value: 0, maximumFractionDigits: 2 },
);

const numericValue = computed(() => {
	const resolved = Number(props.value || 0);
	return Number.isFinite(resolved) ? resolved : 0;
});
const formatted = computed(() => {
	try {
		return new Intl.NumberFormat(props.locale, {
			style: props.currency ? "currency" : "decimal",
			currency: props.currency || undefined,
			minimumFractionDigits: props.minimumFractionDigits,
			maximumFractionDigits: props.maximumFractionDigits,
		}).format(numericValue.value);
	} catch {
		return `${numericValue.value.toFixed(props.maximumFractionDigits)} ${props.currency || ""}`.trim();
	}
});
</script>

<style scoped>
.pos-money { font-variant-numeric: tabular-nums; unicode-bidi: isolate; white-space: nowrap; }
.pos-money--negative { color: var(--pos-error); }
</style>
