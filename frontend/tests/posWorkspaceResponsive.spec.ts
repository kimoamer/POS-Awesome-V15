import { describe, expect, it } from "vitest";

describe("Cross-Viewport Workspace Rules", () => {
	it("resolves viewport mode based on window width breakpoints", () => {
		const resolveViewportMode = (width: number) => {
			if (width < 600) return "phone";
			if (width < 900) return "tablet-portrait";
			if (width < 1200) return "tablet-landscape";
			return "desktop";
		};

		expect(resolveViewportMode(390)).toBe("phone");
		expect(resolveViewportMode(768)).toBe("tablet-portrait");
		expect(resolveViewportMode(1024)).toBe("tablet-landscape");
		expect(resolveViewportMode(1440)).toBe("desktop");
	});

	it("resolves target control height for viewport modes", () => {
		const resolveControlHeight = (mode: string) => {
			switch (mode) {
				case "phone":
					return "44px";
				case "tablet-portrait":
				case "tablet-landscape":
					return "42px";
				default:
					return "40px";
			}
		};

		expect(resolveControlHeight("phone")).toBe("44px");
		expect(resolveControlHeight("tablet-portrait")).toBe("42px");
		expect(resolveControlHeight("desktop")).toBe("40px");
	});
});
