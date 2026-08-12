<template>
	<main class="access-denied" role="main" aria-labelledby="access-denied-title">
		<v-icon icon="mdi-shield-lock-outline" size="52" color="warning" />
		<h1 id="access-denied-title">{{ __("Access not available") }}</h1>
		<p>
			{{
				__(
					"Your ERPNext permissions, POS Profile, or cashier role does not allow this action.",
				)
			}}
		</p>
		<PosButton icon="mdi-arrow-left" @click="$router.back()">
			{{ __("Go back") }}
		</PosButton>
	</main>
</template>

<script setup lang="ts">
import PosButton from "../ui/PosButton.vue";
declare const __: (message: string) => string;
</script>

<style scoped>
.access-denied {
	display: grid;
	min-block-size: min(70vh, 42rem);
	place-content: center;
	justify-items: center;
	gap: 1rem;
	padding: 2rem;
	text-align: center;
}

.access-denied h1 {
	font-size: clamp(1.5rem, 3vw, 2.25rem);
}

.access-denied p {
	max-inline-size: 38rem;
	color: rgb(var(--v-theme-on-surface-variant));
}
</style>
