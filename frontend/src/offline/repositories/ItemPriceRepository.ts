import { db, withDbTransaction } from "../db";
import { buildOfflineTenantScope } from "../scope";

export type OfflineItemPriceRecord = {
	name: string;
	price_list: string;
	item_code: string;
	uom?: string | null;
	currency?: string | null;
	customer?: string | null;
	price_list_rate?: number | null;
	valid_from?: string | null;
	valid_upto?: string | null;
	modified?: string | null;
	profile_scope?: string;
	[key: string]: any;
};

class ItemPriceRepository {
	async clear(scope = buildOfflineTenantScope()) {
		await db
			.table("item_price_records")
			.where("profile_scope")
			.equals(scope)
			.delete();
	}

	async upsertMany(
		rows: OfflineItemPriceRecord[],
		scope = buildOfflineTenantScope(),
	) {
		const validRows = (rows || []).filter(
			(row) => row?.name && row?.price_list && row?.item_code,
		).map((row) => ({ ...row, profile_scope: scope }));
		if (!validRows.length) {
			return;
		}
		await db.table("item_price_records").bulkPut(validRows);
	}

	async deleteByNames(
		names: string[],
		scope = buildOfflineTenantScope(),
	) {
		const keys = [...new Set((names || []).filter(Boolean))];
		if (!keys.length) {
			return;
		}
		await db
			.table("item_price_records")
			.bulkDelete(keys.map((name) => [scope, name]));
	}

	async deleteOutsidePriceLists(
		priceLists: string[],
		scope = buildOfflineTenantScope(),
	) {
		const allowed = new Set((priceLists || []).filter(Boolean));
		const table = db.table("item_price_records");
		if (!allowed.size) {
			await this.clear(scope);
			return;
		}
		const staleNames = await table
			.where("profile_scope")
			.equals(scope)
			.filter((row) => !allowed.has(String(row.price_list || "")))
			.primaryKeys();
		if (staleNames.length) {
			await table.bulkDelete(staleNames);
		}
	}

	async replaceAll(
		rows: OfflineItemPriceRecord[],
		scope = buildOfflineTenantScope(),
	) {
		await withDbTransaction("rw", "item_price_records", async () => {
			await this.clear(scope);
			await this.upsertMany(rows, scope);
		});
	}

	async findForItem(
		priceList: string,
		itemCode: string,
		scope = buildOfflineTenantScope(),
	): Promise<OfflineItemPriceRecord[]> {
		if (!priceList || !itemCode) {
			return [];
		}
		return db
			.table("item_price_records")
			.where("[profile_scope+price_list+item_code]")
			.equals([scope, priceList, itemCode])
			.toArray();
	}

	async findForItemAndUom(
		priceList: string,
		itemCode: string,
		uom: string,
		scope = buildOfflineTenantScope(),
	): Promise<OfflineItemPriceRecord[]> {
		if (!priceList || !itemCode || !uom) {
			return [];
		}
		return db
			.table("item_price_records")
			.where("[profile_scope+price_list+item_code+uom]")
			.equals([scope, priceList, itemCode, uom])
			.toArray();
	}
}

export const itemPriceRepository = new ItemPriceRepository();
