// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import ConfirmDialog from "../src/posapp/components/ui/ConfirmDialog.vue";
import { useDialogStore } from "../src/posapp/stores/dialogStore";

const DialogStub = defineComponent({
	name: "VDialog",
	props: {
		modelValue: Boolean,
		persistent: Boolean,
	},
	emits: ["update:modelValue"],
	setup(props, { slots }) {
		return () =>
			h(
				"div",
				{
					class: "dialog-stub",
					"data-open": String(props.modelValue),
					"data-persistent": String(props.persistent),
				},
				slots.default?.(),
			);
	},
});

const BoxStub = defineComponent({
	setup(_, { slots }) {
		return () => h("div", {}, slots.default?.());
	},
});

function mountDialog() {
	return mount(ConfirmDialog, {
		global: {
			plugins: [createPinia()],
			components: {
				VDialog: DialogStub,
				VCard: BoxStub,
				VCardTitle: BoxStub,
				VCardText: BoxStub,
				VCardActions: BoxStub,
				VIcon: BoxStub,
			},
		},
	});
}

describe("ConfirmDialog", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it("treats ordinary confirmations as dismissible and resolves cancel on close", async () => {
		const wrapper = mountDialog();
		const dialogs = useDialogStore();
		const result = dialogs.confirm({
			title: "Clear cart",
			message: "This cannot be undone.",
		});

		await nextTick();
		const dialog = wrapper.findComponent(DialogStub);
		expect(dialog.props("persistent")).toBe(false);

		dialog.vm.$emit("update:modelValue", false);
		await expect(result).resolves.toBe(false);
	});

	it("keeps explicitly persistent confirmations open on dismiss attempts", async () => {
		const wrapper = mountDialog();
		const dialogs = useDialogStore();
		const result = dialogs.confirm({
			title: "Close shift",
			message: "Supervisor approval is required.",
			persistent: true,
		});

		await nextTick();
		const dialog = wrapper.findComponent(DialogStub);
		expect(dialog.props("persistent")).toBe(true);

		dialog.vm.$emit("update:modelValue", false);
		await nextTick();
		expect(dialogs.active).not.toBeNull();

		dialogs.cancel();
		await expect(result).resolves.toBe(false);
	});
});
