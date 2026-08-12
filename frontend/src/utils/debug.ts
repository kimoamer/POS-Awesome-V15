function readDebugFlag(key: string) {
	try {
		return globalThis.localStorage?.getItem(key) === "1";
	} catch {
		return false;
	}
}

export function isPosDebugEnabled(channel?: string) {
	return (
		readDebugFlag("posawesome_debug") ||
		(Boolean(channel) && readDebugFlag(`posawesome_debug_${channel}`))
	);
}

export function posDebug(channel: string, ...args: unknown[]) {
	if (!isPosDebugEnabled(channel)) return;
	console.debug(`[POSAwesome:${channel}]`, ...args);
}
