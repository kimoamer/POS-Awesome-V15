import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Payment Dialog Layout & CSS Validity Contract", () => {
	it("verifies Payments.vue contains inline scoped style block with 4-row shell and desktop 2-column grid", () => {
		const paymentsPath = path.resolve(__dirname, "../src/posapp/components/pos/Payments.vue");
		const content = fs.readFileSync(paymentsPath, "utf-8");

		expect(content).toContain("<style scoped>");
		expect(content).not.toContain('<style scoped src="./Payments.vue.css"></style>');
		expect(content).toContain(".payment-shell");
		expect(content).toContain("grid-template-rows: 72px 76px minmax(0, 1fr) 66px");
		expect(content).toContain(".payment-layout");
		expect(content).toContain("grid-template-columns: minmax(0, 1.15fr) minmax(350px, 0.85fr)");
	});

	it("verifies theme.css contains global posa-payment-dialog-overlay overlay rule", () => {
		const themePath = path.resolve(__dirname, "../src/posapp/styles/theme.css");
		const content = fs.readFileSync(themePath, "utf-8");

		expect(content).toContain(".posa-payment-dialog-overlay");
		expect(content).toContain("width: min(1120px, calc(100vw - 24px)) !important");
	});
});
