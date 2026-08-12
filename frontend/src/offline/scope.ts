type ProfileScopeInput = {
	name?: string | null;
	warehouse?: string | null;
};

function normalizePart(value: unknown, fallback: string) {
	const resolved = String(value || "").trim();
	return encodeURIComponent(resolved || fallback);
}

export function getOfflineSiteScope() {
	const host =
		typeof globalThis.location !== "undefined"
			? globalThis.location.host || globalThis.location.hostname
			: "";
	return normalizePart(host, "unknown-site");
}

export function getOfflineSessionUser() {
	const runtime = globalThis as typeof globalThis & {
		frappe?: { session?: { user?: string | null } };
	};
	return normalizePart(runtime.frappe?.session?.user, "anonymous");
}

export function buildOfflineTenantScope() {
	return `${getOfflineSiteScope()}::${getOfflineSessionUser()}`;
}

export function buildOfflineProfileScope(
	profile: ProfileScopeInput | null | undefined,
) {
	return [
		buildOfflineTenantScope(),
		normalizePart(profile?.name, "no-profile"),
		normalizePart(profile?.warehouse, "no-warehouse"),
	].join("::");
}

export const LEGACY_UNSCOPED_ITEM_SCOPE = "legacy::unscoped";
