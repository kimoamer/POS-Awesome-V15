export const ITEM_IMAGE_KEYS = [
	"image",
	"item_image",
	"thumbnail",
	"item_image_url",
	"website_image",
	"image_url",
] as const;

export function normalizeItemImageUrl(value: string): string {
	const url = String(value || "").trim();

	if (!url) return "";

	if (
		url.startsWith("http://") ||
		url.startsWith("https://") ||
		url.startsWith("data:") ||
		url.startsWith("blob:") ||
		url.startsWith("/")
	) {
		return url;
	}

	if (url.startsWith("files/") || url.startsWith("private/files/")) {
		return `/${url}`;
	}

	return url;
}

export function resolveItemImage(item: any, fallbackItem?: any): string {
	const sources = [item, fallbackItem];

	for (const source of sources) {
		if (!source) continue;

		for (const key of ITEM_IMAGE_KEYS) {
			const raw = source?.[key];

			const value =
				typeof raw === "string"
					? raw.trim()
					: typeof raw === "object"
						? String(raw?.file_url || raw?.url || raw?.src || "").trim()
						: "";

			if (value) {
				return normalizeItemImageUrl(value);
			}
		}
	}

	return "";
}
