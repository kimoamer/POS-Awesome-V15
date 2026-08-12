import { defineStore } from "pinia";
import { ref } from "vue";

export type ConfirmDialogOptions = {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	color?: "primary" | "warning" | "error";
	persistent?: boolean;
};

type QueuedConfirmation = {
	id: number;
	options: ConfirmDialogOptions;
	resolve: (confirmed: boolean) => void;
};

export const useDialogStore = defineStore("dialogs", () => {
	const active = ref<(ConfirmDialogOptions & { id: number }) | null>(null);
	const queue: QueuedConfirmation[] = [];
	let current: QueuedConfirmation | null = null;
	let sequence = 0;

	function showNext() {
		if (current || !queue.length) return;
		current = queue.shift() || null;
		active.value = current
			? { id: current.id, ...current.options }
			: null;
	}

	function confirm(options: ConfirmDialogOptions) {
		return new Promise<boolean>((resolve) => {
			queue.push({ id: ++sequence, options, resolve });
			showNext();
		});
	}

	function settle(confirmed: boolean) {
		if (!current) return;
		const request = current;
		current = null;
		active.value = null;
		request.resolve(confirmed);
		queueMicrotask(showNext);
	}

	return {
		active,
		confirm,
		accept: () => settle(true),
		cancel: () => settle(false),
	};
});
