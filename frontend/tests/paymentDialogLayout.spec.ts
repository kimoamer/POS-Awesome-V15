import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Payment Dialog Layout & CSS Validity Contract", () => {
	it("verifies Payments.vue.css contains raw CSS, no style opening or closing tags, and container query rule", () => {
		const cssPath = path.resolve(__dirname, "../src/posapp/components/pos/Payments.vue.css");
		const content = fs.readFileSync(cssPath, "utf-8");

		expect(content).not.toContain("<style");
		expect(content).not.toContain("</style>");
		expect(content).toContain(".payment-shell");
		expect(content).toContain(".payment-layout");
		expect(content).toContain("container-name: payment-body");
		expect(content).toContain("@container payment-body (min-width: 900px)");
	});

	it("verifies theme.css contains global posa-payment-dialog-overlay overlay rule", () => {
		const themePath = path.resolve(__dirname, "../src/posapp/styles/theme.css");
		const content = fs.readFileSync(themePath, "utf-8");

		expect(content).toContain(".posa-payment-dialog-overlay");
		expect(content).toContain("width: min(1180px, calc(100vw - 32px)) !important");
	});
});
