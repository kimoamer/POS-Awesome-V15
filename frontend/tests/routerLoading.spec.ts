// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	createPosAppRouter,
	resolveRouteLoadFailureAction,
	resolveRouteLoadingMessage,
} from "../src/posapp/router";
import {
	resetCapabilityContextForTests,
	setCapabilityContext,
} from "../src/posapp/services/capabilities";

describe("route loading messaging", () => {
	beforeEach(() => {
		window.scrollTo = vi.fn();
	});

	afterEach(() => {
		resetCapabilityContextForTests();
		window.history.replaceState({}, "", "/");
	});

	it("uses explicit route loading labels when provided", () => {
		expect(
			resolveRouteLoadingMessage({
				meta: { loadingMessage: "Loading payments..." },
			}),
		).toBe("Loading payments...");
	});

	it("falls back to route title or a generic label", () => {
		expect(
			resolveRouteLoadingMessage({
				meta: { title: "Reports" },
			}),
		).toBe("Loading Reports...");

		expect(resolveRouteLoadingMessage({ meta: {} })).toBe("Loading view...");
	});

	it("keeps route guards compatible with the loading router factory", async () => {
		const { router, dispose } = createPosAppRouter();

		expect(router).toBeTruthy();
		dispose();
	});

	it("rechecks the active route when POS Profile capabilities finish loading", async () => {
		const { router, dispose } = createPosAppRouter();
		await router.push("/orders");
		await router.isReady();
		expect(router.currentRoute.value.path).toBe("/orders");

		setCapabilityContext({
			ready: true,
			posProfile: {
				name: "POS-1",
				posa_allow_purchase_order: 0,
			},
		});

		await vi.waitFor(() => {
			expect(router.currentRoute.value.name).toBe("access-denied");
		});
		dispose();
	});

	it("routes offline chunk failures to an explicit unavailable state", () => {
		expect(
			resolveRouteLoadFailureAction({
				error: new TypeError(
					"Failed to fetch dynamically imported module: /assets/payments.js",
				),
				isOnline: false,
				pendingRouteFullPath: "/payments?draft=1",
			}),
		).toEqual({
			type: "offline-fallback",
			target: "/payments?draft=1",
		});
	});

	it("keeps online chunk failures on the reload recovery path", () => {
		expect(
			resolveRouteLoadFailureAction({
				error: new TypeError(
					"Failed to fetch dynamically imported module: /assets/payments.js",
				),
				isOnline: true,
				pendingRouteFullPath: "/payments",
			}),
		).toEqual({
			type: "chunk-recovery",
		});
	});
});
