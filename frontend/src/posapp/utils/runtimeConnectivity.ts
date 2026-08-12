export const TRANSPORT_UNAVAILABLE_EVENT = "posawesome:transport-unavailable";

declare global {
	interface Window {
		serverOnline?: boolean;
		__posaTransportMonitorInstalled?: boolean;
	}
}

function getTransportStatus(error: any): number | null {
	const rawStatus =
		error?.status ??
		error?.httpStatus ??
		error?.xhr?.status ??
		error?.target?.status;
	const status = Number(rawStatus);
	return Number.isFinite(status) ? status : null;
}

export function isRuntimeDisconnected(): boolean {
	if (typeof window === "undefined") return false;
	if (window.navigator?.onLine === false) return true;
	return window.serverOnline === false;
}

export function isTransportUnavailableError(error: unknown): boolean {
	const candidate = error as any;
	const status = getTransportStatus(candidate);
	if (status === 0) return true;

	const message = String(
		candidate?.message ||
			candidate?.statusText ||
			candidate?.xhr?.statusText ||
			candidate ||
			"",
	).toLowerCase();
	return (
		message.includes("err_name_not_resolved") ||
		message.includes("failed to fetch") ||
		message.includes("networkerror") ||
		message.includes("network request failed")
	);
}

export function markTransportUnavailable(error?: unknown): void {
	if (typeof window === "undefined") return;
	window.serverOnline = false;
	try {
		window.localStorage?.setItem("serverOnline", "false");
	} catch {
		// Storage can be unavailable in private/restricted browser contexts.
	}
	window.dispatchEvent(
		new CustomEvent(TRANSPORT_UNAVAILABLE_EVENT, {
			detail: { error },
		}),
	);
}

/**
 * Frappe still has a number of legacy callers that use `frappe.call`
 * directly. Observe their underlying jQuery requests so the first DNS/network
 * failure immediately switches the POS runtime to offline mode and prevents a
 * cascade of follow-up calls.
 */
export function installGlobalTransportMonitor(): void {
	if (
		typeof window === "undefined" ||
		window.__posaTransportMonitorInstalled
	) {
		return;
	}

	if (typeof window.serverOnline !== "boolean") {
		let persistedOnline = true;
		try {
			persistedOnline =
				window.localStorage?.getItem("serverOnline") !== "false";
		} catch {
			// Keep the browser-reported state when storage is restricted.
		}
		window.serverOnline =
			window.navigator?.onLine !== false && persistedOnline;
	}

	const jquery = (window as any).jQuery || (window as any).$;
	if (typeof jquery !== "function") return;

	window.__posaTransportMonitorInstalled = true;
	jquery(document).on(
		"ajaxError.posawesomeTransport",
		(_event: unknown, xhr: unknown) => {
			if (isTransportUnavailableError(xhr)) {
				markTransportUnavailable(xhr);
			}
		},
	);
}
