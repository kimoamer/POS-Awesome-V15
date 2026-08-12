import { config } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import "fake-indexeddb/auto";

const translateForTests = (value: string) => value;
const defaultFrappe = {
	_: translateForTests,
	call: async () => ({ message: null }),
	datetime: {
		nowdate: () => new Date().toISOString().slice(0, 10),
	},
	session: { user: "test@example.com", user_fullname: "Test User" },
	boot: { sysdefaults: {}, website_settings: {} },
	utils: { is_rtl: () => false },
	defaults: { get_default: () => null },
	realtime: { on: () => undefined, off: () => undefined, emit: () => undefined },
};

if (!(globalThis as any).frappe) {
	(globalThis as any).frappe = defaultFrappe;
}
if (!(globalThis as any).__) {
	(globalThis as any).__ = translateForTests;
}

// Most unit tests exercise POS components without installing the full Vuetify
// plugin. Keep interactive controls semantic so click, disabled and keyboard
// contracts are tested against real DOM elements rather than inert <v-btn>
// placeholders. Individual suites can still override these stubs.
const VBtnTestStub = defineComponent({
	name: "VBtn",
	inheritAttrs: false,
	emits: ["click"],
	props: {
		disabled: Boolean,
		loading: Boolean,
	},
	setup(props, { attrs, slots, emit }) {
		return () =>
			h(
				"button",
				{
					...attrs,
					type: (attrs.type as string) || "button",
					disabled: props.disabled || props.loading,
					onClick: (event: MouseEvent) => emit("click", event),
				},
				slots.default?.(),
			);
	},
});

const VTextFieldTestStub = defineComponent({
	name: "VTextField",
	inheritAttrs: false,
	emits: ["update:modelValue", "input", "change", "focus"],
	props: {
		modelValue: { type: [String, Number], default: "" },
		label: { type: String, default: "" },
		prefix: { type: String, default: "" },
		type: { type: String, default: "text" },
		disabled: Boolean,
		readonly: Boolean,
	},
	setup(props, { attrs, slots, emit }) {
		return () =>
			h("label", { class: attrs.class, "data-label": props.label }, [
				props.label ? h("span", { class: "v-field-label" }, props.label) : null,
				props.prefix ? h("span", { class: "v-field-prefix" }, props.prefix) : null,
				h("input", {
					type: props.type,
					value: props.modelValue,
					disabled: props.disabled,
					readonly: props.readonly,
					"aria-label": (attrs["aria-label"] as string) || props.label,
					onInput: (event: Event) => {
						const value = (event.target as HTMLInputElement).value;
						emit("update:modelValue", value);
						emit("input", event);
					},
					onChange: (event: Event) => emit("change", event),
					onFocus: (event: FocusEvent) => emit("focus", event),
				}),
				slots["append-inner"]?.(),
			]);
	},
});

const VMenuTestStub = defineComponent({
	name: "VMenu",
	setup(_, { slots }) {
		return () =>
			h("div", { class: "v-menu-test-stub" }, [
				slots.activator?.({ props: {} }),
				slots.default?.(),
			]);
	},
});

config.global.components = {
	...(config.global.components || {}),
	VBtn: VBtnTestStub,
	VTextField: VTextFieldTestStub,
	VMenu: VMenuTestStub,
};

config.global.mocks = {
	...(config.global.mocks || {}),
	__: translateForTests,
	frappe: (globalThis as any).frappe,
};

const previousWarnHandler = config.global.config?.warnHandler;
config.global.config = {
	...(config.global.config || {}),
	warnHandler(message, instance, trace) {
		// Unit tests deliberately avoid installing the full Vuetify runtime. Its
		// unresolved tags are rendered as inert custom elements unless a suite
		// supplies a semantic stub above. Repeating the same warning thousands of
		// times hides actionable Vue warnings and makes CI logs needlessly large.
		if (/^Failed to resolve component: v-[a-z0-9-]+/i.test(message)) {
			return;
		}
		if (previousWarnHandler) {
			previousWarnHandler(message, instance, trace);
			return;
		}
		console.warn(`[Vue warn]: ${message}${trace || ""}`);
	},
};
