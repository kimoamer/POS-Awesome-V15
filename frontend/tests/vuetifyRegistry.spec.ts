// @vitest-environment node

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(testDir, "../src");
const registryFile = resolve(sourceRoot, "posapp/plugins/vuetify.ts");

function listVueFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return listVueFiles(path);
		return entry.isFile() && entry.name.endsWith(".vue") ? [path] : [];
	});
}

function toComponentName(tag: string) {
	return tag
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

describe("Vuetify component registry", () => {
	it("registers every Vuetify tag used by POS templates", () => {
		const usedComponents = new Set<string>();
		for (const file of listVueFiles(sourceRoot)) {
			const source = readFileSync(file, "utf8");
			for (const match of source.matchAll(/<(v-[a-z0-9-]+)(?=[\s/>])/g)) {
				usedComponents.add(toComponentName(match[1]));
			}
		}

		const registrySource = readFileSync(registryFile, "utf8");
		const registryBody = registrySource.match(
			/export const POS_VUETIFY_COMPONENTS = \{([\s\S]*?)\n\};/,
		)?.[1];
		expect(registryBody).toBeTruthy();
		const registered = new Set(
			Array.from(registryBody!.matchAll(/\b(V[A-Za-z0-9]+)\s*,/g), (match) =>
				match[1],
			),
		);
		const missing = Array.from(usedComponents)
			.filter((name) => !registered.has(name))
			.sort();

		expect(missing).toEqual([]);
	});
});
