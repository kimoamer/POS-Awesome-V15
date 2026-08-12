import { useUIStore } from "../../../stores/uiStore";
import { isOffline } from "../../../../offline/index";

declare const frappe: any;

const cache = new Map<string, { data: any[]; ts: number }>();

export function useBundles() {
	const uiStore = useUIStore();
	const getComponents = async (bundleCode: string) => {
		const cached = cache.get(bundleCode);
		const now = Date.now();
		if (cached && now - cached.ts < 60000) {
			return cached.data;
		}
		if (isOffline()) return cached?.data || [];
		try {
			const r = await frappe.call({
				method: "posawesome.posawesome.api.bundles.get_bundle_components",
				args: {
					bundles: [bundleCode],
					pos_profile: uiStore.posProfile?.name || null,
					pos_opening_shift:
						uiStore.posOpeningShift?.name ||
						uiStore.posOpeningShift ||
						null,
				},
			});
			const data =
				r.message && r.message[bundleCode] ? r.message[bundleCode] : [];
			cache.set(bundleCode, { data, ts: now });
			return data;
		} catch (e) {
			if (!isOffline())
				console.error("Failed to fetch bundle components", e);
			return [];
		}
	};

	return { getBundleComponents: getComponents };
}
