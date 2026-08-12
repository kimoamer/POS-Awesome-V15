const FONT_SOURCE_PATTERN = /(?:\s*src:\s*[^;]+;)+/;
const WOFF2_SOURCE_PATTERN = /url\(([^)]*\.woff2(?:\?[^)]*)?)\)\s*format\((['"]?)woff2\2\)/i;
const MDI_ICON_TOKEN_PATTERN = /\bmdi-[a-z0-9-]+\b/g;
const MDI_GLYPH_RULE_PATTERN = /\.mdi-([a-z0-9-]+)::before\s*{[^}]*}/g;

/**
 * Modern POS targets already require browsers with IndexedDB, modules and
 * service workers. Keep only WOFF2 inside each font-face so Vite does not emit
 * legacy EOT/TTF/WOFF copies that can never be selected by those browsers.
 */
export function keepOnlyWoff2FontSources(css) {
	return String(css || "").replace(/@font-face\s*{[\s\S]*?}/gi, (fontFace) => {
		const woff2Source = fontFace.match(WOFF2_SOURCE_PATTERN)?.[0];
		if (!woff2Source) return fontFace;
		return fontFace.replace(FONT_SOURCE_PATTERN, `\n  src: ${woff2Source};`);
	});
}

export function isPosFontStylesheet(id) {
	const normalized = String(id || "").replace(/\\/g, "/");
	return (
		normalized.includes("/@mdi/font/css/materialdesignicons.css") ||
		/\/@fontsource\/roboto\/(?:400|500|700)\.css(?:\?|$)/.test(normalized)
	);
}

export function collectMdiIconNames(sources) {
	const names = new Set();
	for (const source of sources || []) {
		for (const match of String(source || "").matchAll(MDI_ICON_TOKEN_PATTERN)) {
			names.add(match[0]);
		}
	}
	return names;
}

export function getMissingMdiIcons(css, iconNames) {
	const available = new Set();
	for (const match of String(css || "").matchAll(MDI_GLYPH_RULE_PATTERN)) {
		available.add(`mdi-${match[1]}`);
	}
	return Array.from(iconNames || []).filter((name) => !available.has(name));
}

export function subsetMaterialDesignIconCss(css, iconNames) {
	const used = iconNames instanceof Set ? iconNames : new Set(iconNames || []);
	return String(css || "").replace(
		MDI_GLYPH_RULE_PATTERN,
		(rule, suffix) => (used.has(`mdi-${suffix}`) ? rule : ""),
	);
}
