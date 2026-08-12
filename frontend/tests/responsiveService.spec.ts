import { describe, expect, it } from "vitest";
import {
	POS_VIEWPORT_BREAKPOINTS,
	resolveDensityMode,
	resolveViewportMode,
} from "../src/posapp/composables/core/useResponsive";

describe("shared POS responsive service", () => {
	it("uses one canonical viewport matrix", () => {
		expect(resolveViewportMode(359)).toBe("phone");
		expect(resolveViewportMode(POS_VIEWPORT_BREAKPOINTS.phone)).toBe(
			"tablet-portrait",
		);
		expect(resolveViewportMode(899)).toBe("tablet-portrait");
		expect(resolveViewportMode(900)).toBe("tablet-landscape");
		expect(resolveViewportMode(1199)).toBe("tablet-landscape");
		expect(resolveViewportMode(1200)).toBe("desktop");
	});

	it("selects density from input modality while honoring terminal preference", () => {
		expect(
			resolveDensityMode({ width: 1366, coarsePointer: false }),
		).toBe("counter");
		expect(
			resolveDensityMode({ width: 1024, coarsePointer: false }),
		).toBe("compact");
		expect(
			resolveDensityMode({ width: 1366, coarsePointer: true }),
		).toBe("touch");
		expect(
			resolveDensityMode({
				width: 800,
				coarsePointer: true,
				preference: "counter",
			}),
		).toBe("counter");
	});
});
