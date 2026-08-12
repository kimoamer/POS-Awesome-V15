import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { OFFLINE_SYNC_SCHEMA_VERSION } from "../src/offline/sync/schemaVersion";

const backendCommonPath = resolve(
	process.cwd(),
	"../posawesome/posawesome/api/offline_sync/common.py",
);

describe("offline sync schema contract", () => {
	it("keeps the frontend and backend protocol versions identical", () => {
		const backendSource = readFileSync(backendCommonPath, "utf8");
		const match = backendSource.match(
			/^SYNC_SCHEMA_VERSION\s*=\s*["']([^"']+)["']/m,
		);

		expect(match?.[1]).toBe(OFFLINE_SYNC_SCHEMA_VERSION);
	});
});
