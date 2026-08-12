import { db, withDbTransaction } from "../db";
import { buildOfflineTenantScope } from "../scope";

export type OfflinePricingRuleRecord = {
	key: string;
	rule_name: string;
	target_type: string;
	target_value: string;
	modified?: string | null;
	profile_scope?: string;
	[key: string]: any;
};

class PricingRuleRepository {
	async clear(scope = buildOfflineTenantScope()) {
		await db
			.table("pricing_rule_records")
			.where("profile_scope")
			.equals(scope)
			.delete();
	}

	async replaceRuleTargets(
		rows: OfflinePricingRuleRecord[],
		scope = buildOfflineTenantScope(),
	) {
		const validRows = (rows || []).filter(
			(row) => row?.key && row?.rule_name,
		).map((row) => ({ ...row, profile_scope: scope }));
		if (!validRows.length) {
			return;
		}
		const ruleNames = [...new Set(validRows.map((row) => row.rule_name))];
		await withDbTransaction("rw", "pricing_rule_records", async () => {
			await db
				.table("pricing_rule_records")
				.where("[profile_scope+rule_name]")
				.anyOf(ruleNames.map((name) => [scope, name]))
				.delete();
			await db.table("pricing_rule_records").bulkPut(validRows);
		});
	}

	async deleteByRuleNames(
		ruleNames: string[],
		scope = buildOfflineTenantScope(),
	) {
		const names = [...new Set((ruleNames || []).filter(Boolean))];
		if (!names.length) {
			return;
		}
		await db
			.table("pricing_rule_records")
			.where("[profile_scope+rule_name]")
			.anyOf(names.map((name) => [scope, name]))
			.delete();
	}

	async findByTarget(
		targetType: string,
		targetValue: string,
		scope = buildOfflineTenantScope(),
	): Promise<OfflinePricingRuleRecord[]> {
		if (!targetType) {
			return [];
		}
		return db
			.table("pricing_rule_records")
			.where("[profile_scope+target_type+target_value]")
			.equals([scope, targetType, targetValue || ""])
			.toArray();
	}

	async getAll(
		scope = buildOfflineTenantScope(),
	): Promise<OfflinePricingRuleRecord[]> {
		return db
			.table("pricing_rule_records")
			.where("profile_scope")
			.equals(scope)
			.toArray();
	}
}

export const pricingRuleRepository = new PricingRuleRepository();
