import { computed, shallowRef } from "vue";

export type PosCapability =
	| "pos.sale"
	| "dashboard.view"
	| "reports.view"
	| "payments.manage"
	| "purchase_order.create"
	| "barcode.print"
	| "gift_cards.manage"
	| "cash_movement.manage"
	| "shift.close"
	| "cashier.switch"
	| "settings.manage"
	| "discount.apply"
	| "return.create"
	| "offline.sell";

type PermissionAction = "read" | "create" | "write" | "submit" | "print";

export type CapabilityContext = {
	posProfile: Record<string, any> | null;
	currentCashier: Record<string, any> | null;
	roles: string[];
	doctypePermissions: Record<string, Partial<Record<PermissionAction, boolean>>>;
	networkOnline: boolean;
	hasOpeningShift: boolean;
	ready: boolean;
};

const defaultContext: CapabilityContext = {
	posProfile: null,
	currentCashier: null,
	roles: [],
	doctypePermissions: {},
	networkOnline: true,
	hasOpeningShift: false,
	ready: false,
};

const capabilityContext = shallowRef<CapabilityContext>({ ...defaultContext });

function asBoolean(value: unknown, fallback = false) {
	if (value === undefined || value === null || value === "") return fallback;
	return [true, 1, "1", "true", "yes", "Yes"].includes(value as any);
}

function globalFrappe(): any {
	return (globalThis as any).frappe;
}

function uniqueRoles(values: unknown[]) {
	return Array.from(
		new Set(
			values
				.flatMap((value) => (Array.isArray(value) ? value : []))
				.map((role) => String(role || "").trim())
				.filter(Boolean),
		),
	);
}

export function resolveRuntimeRoles() {
	const frappe = globalFrappe();
	const sessionUser = String(frappe?.session?.user || "");
	return uniqueRoles([
		frappe?.user_roles,
		frappe?.boot?.user?.roles,
		frappe?.boot?.user_info?.[sessionUser]?.roles,
	]);
}

function hasRole(context: CapabilityContext, ...roles: string[]) {
	const current = new Set(context.roles);
	return roles.some((role) => current.has(role));
}

function isPrivileged(context: CapabilityContext) {
	return hasRole(context, "Administrator", "System Manager");
}

function runtimeDoctypePermission(
	doctype: string,
	action: PermissionAction,
): boolean | null {
	const model = globalFrappe()?.model;
	const methodNames: Record<PermissionAction, string[]> = {
		read: ["can_read"],
		create: ["can_create"],
		write: ["can_write"],
		submit: ["can_submit"],
		print: ["can_print", "can_read"],
	};
	for (const name of methodNames[action]) {
		if (typeof model?.[name] !== "function") continue;
		try {
			return !!model[name](doctype);
		} catch {
			return false;
		}
	}
	return null;
}

function canUseDoctype(
	context: CapabilityContext,
	doctype: string,
	action: PermissionAction,
) {
	if (isPrivileged(context)) return true;
	const explicit = context.doctypePermissions?.[doctype]?.[action];
	if (typeof explicit === "boolean") return explicit;
	const runtime = runtimeDoctypePermission(doctype, action);
	if (typeof runtime === "boolean") return runtime;
	// Before Frappe boot permissions are available, navigation remains visible;
	// every server mutation still performs the authoritative permission check.
	return true;
}

function profileFlag(
	context: CapabilityContext,
	keys: string[],
	fallback = false,
) {
	const profile = context.posProfile || {};
	for (const key of keys) {
		if (Object.prototype.hasOwnProperty.call(profile, key)) {
			return asBoolean(profile[key]);
		}
	}
	return fallback;
}

function anyProfileFlag(
	context: CapabilityContext,
	keys: string[],
	fallback = false,
) {
	const profile = context.posProfile || {};
	const configured = keys.filter((key) =>
		Object.prototype.hasOwnProperty.call(profile, key),
	);
	if (!configured.length) return fallback;
	return configured.some((key) => asBoolean(profile[key]));
}

function isSupervisor(context: CapabilityContext) {
	return Boolean(
		context.currentCashier?.is_supervisor ||
			isPrivileged(context) ||
			hasRole(
				context,
				"Sales Manager",
				"Accounts Manager",
				"Stock Manager",
			),
	);
}

export function resolveCapability(
	capability: PosCapability,
	context: CapabilityContext,
) {
	const hasProfile = Boolean(context.posProfile?.name);
	const canCreateSale =
		canUseDoctype(context, "POS Invoice", "create") ||
		canUseDoctype(context, "Sales Invoice", "create");

	switch (capability) {
		case "pos.sale":
			return hasProfile && canCreateSale;
		case "dashboard.view":
			return (
				isSupervisor(context) &&
				profileFlag(context, ["posa_enable_awesome_dashboard"], true) &&
				canUseDoctype(context, "Sales Invoice", "read")
			);
		case "reports.view":
			return (
				isSupervisor(context) &&
				canUseDoctype(context, "Sales Invoice", "read")
			);
		case "payments.manage":
			return (
				profileFlag(context, ["posa_use_pos_awesome_payments"], true) &&
				anyProfileFlag(
					context,
					[
						"posa_allow_make_new_payments",
						"posa_allow_reconcile_payments",
						"posa_allow_mpesa_reconcile_payments",
					],
					true,
				) &&
				canUseDoctype(context, "Payment Entry", "create")
			);
		case "purchase_order.create":
			return (
				profileFlag(context, ["posa_allow_purchase_order"], false) &&
				canUseDoctype(context, "Purchase Order", "create")
			);
		case "barcode.print":
			return (
				canUseDoctype(context, "Item", "read") &&
				canUseDoctype(context, "Item", "print")
			);
		case "gift_cards.manage":
			return profileFlag(context, ["posa_use_gift_cards"], false);
		case "cash_movement.manage":
			return (
				profileFlag(context, ["posa_enable_cash_movement"], false) &&
				context.hasOpeningShift
			);
		case "shift.close":
			return context.hasOpeningShift;
		case "cashier.switch":
			return isSupervisor(context) || hasRole(context, "POS User");
		case "settings.manage":
			return isSupervisor(context);
		case "discount.apply":
			return (
				canCreateSale &&
				profileFlag(
					context,
					[
						"posa_allow_user_to_edit_additional_discount",
						"posa_allow_user_to_edit_item_discount",
					],
					false,
				)
			);
		case "return.create":
			return (
				canCreateSale &&
				profileFlag(context, ["posa_allow_return", "posa_allow_returns"], false)
			);
		case "offline.sell":
			return hasProfile && context.hasOpeningShift && canCreateSale;
		default:
			return false;
	}
}

export function setCapabilityContext(
	patch: Partial<CapabilityContext> & { roles?: string[] },
) {
	capabilityContext.value = {
		...capabilityContext.value,
		...patch,
		roles: patch.roles || capabilityContext.value.roles,
	};
	return capabilityContext.value;
}

export function hydrateRuntimeCapabilityContext(
	patch: Partial<CapabilityContext> = {},
) {
	return setCapabilityContext({
		...patch,
		roles: patch.roles || resolveRuntimeRoles(),
		ready: patch.ready ?? true,
	});
}

export function can(capability: PosCapability) {
	return resolveCapability(capability, capabilityContext.value);
}

export function isCapabilityContextReady() {
	return capabilityContext.value.ready;
}

export function useCapabilities() {
	return {
		context: computed(() => capabilityContext.value),
		can: (capability: PosCapability) =>
			computed(() => resolveCapability(capability, capabilityContext.value)),
		canNow: can,
		setContext: setCapabilityContext,
		hydrateRuntimeContext: hydrateRuntimeCapabilityContext,
	};
}

export function resetCapabilityContextForTests() {
	capabilityContext.value = { ...defaultContext };
}
