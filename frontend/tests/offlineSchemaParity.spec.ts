import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const projectRoot = resolve(__dirname, "..");

function readSource(relativePath: string) {
	return readFileSync(join(projectRoot, relativePath), "utf8");
}

function extractObjectBody(source: string, constantName: string) {
	const marker = `const ${constantName} = {`;
	const start = source.indexOf(marker);
	expect(start, `${constantName} must exist`).toBeGreaterThanOrEqual(0);
	let depth = 0;
	let bodyStart = -1;
	for (let index = start; index < source.length; index += 1) {
		if (source[index] === "{") {
			depth += 1;
			if (bodyStart < 0) bodyStart = index + 1;
		} else if (source[index] === "}") {
			depth -= 1;
			if (depth === 0 && bodyStart >= 0) {
				return source
					.slice(bodyStart, index)
					.replace(/\/\/.*$/gm, "")
					.replace(/\s+/g, " ")
					.trim();
			}
		}
	}
	throw new Error(`Unable to parse ${constantName}`);
}

function latestDexieVersion(source: string) {
	return Math.max(
		...Array.from(source.matchAll(/db\.version\((\d+)\)/g), (match) =>
			Number(match[1]),
		),
	);
}

describe("offline IndexedDB schema parity", () => {
	it("keeps the main thread and persistence worker on the same latest schema", () => {
		const main = readSource("src/offline/db.ts");
		const worker = readSource("src/posapp/workers/itemWorker.js");

		expect(latestDexieVersion(worker)).toBe(latestDexieVersion(main));
		for (const schemaName of [
			"BASE_SCHEMA",
			"SCHEMA_V14",
			"SCHEMA_V15",
			"SCHEMA_V16",
			"SCHEMA_V17",
			"SCHEMA_V18",
			"SCHEMA_V19",
			"SCHEMA_V20",
			"SCHEMA_V21",
			"SCHEMA_V22",
			"SCHEMA_V23",
		]) {
			expect(extractObjectBody(worker, schemaName), schemaName).toBe(
				extractObjectBody(main, schemaName),
			);
		}
		expect(worker).toContain(
			"const SCHEMA_SIGNATURE = JSON.stringify(SCHEMA_V23)",
		);
		expect(worker).toContain('searchParams.get("v")');
		expect(worker).toContain('type: "persist_worker_unavailable"');
		expect(worker).not.toContain("Failed to open IndexedDB in worker");
	});
});
