import { mergeConfig } from "vite";
import viteConfig from "./vite.config.js";

export default mergeConfig(viteConfig, {
	// The production Vite config intentionally replaces NODE_ENV. Unit tests
	// need Vue's development hooks so Vue Test Utils can observe component
	// emissions and report runtime warnings instead of silently dropping them.
	define: {
		"process.env.NODE_ENV": JSON.stringify("test"),
		process: JSON.stringify({ env: { NODE_ENV: "test" } }),
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		include: [
			"tests/**/*.spec.{js,ts}",
			"tests/**/*.test.{js,ts}",
			"src/**/__tests__/**/*.{js,ts}",
		],
		exclude: ["tests/smoke/**", "tests/e2e/**", "tests/performance/TTI.spec.ts"],
	},
});
