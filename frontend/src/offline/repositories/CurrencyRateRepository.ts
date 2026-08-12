import { db } from "../db";
import { buildOfflineProfileScope } from "../scope";

export type OfflineCurrencyRateRecord = {
	name: string;
	profile_scope?: string;
	profile_name: string;
	company: string;
	from_currency: string;
	to_currency: string;
	exchange_rate: number;
	date: string;
	modified?: string | null;
	[key: string]: any;
};

type CurrencyRateLookup = {
	profileScope?: string;
	profileName: string;
	company: string;
	fromCurrency: string;
	toCurrency: string;
	date: string;
};

class CurrencyRateRepository {
	private resolveScope(scope?: string) {
		return scope || buildOfflineProfileScope(null);
	}

	async clear(scope?: string) {
		await db
			.table("currency_rate_records")
			.where("profile_scope")
			.equals(this.resolveScope(scope))
			.delete();
	}

	async upsertMany(rows: OfflineCurrencyRateRecord[], scope?: string) {
		const profileScope = this.resolveScope(scope);
		const validRows = (rows || []).filter(
			(row) =>
				row?.name &&
				row?.profile_name &&
				row?.from_currency &&
				row?.to_currency &&
				row?.date,
		);
		if (!validRows.length) {
			return;
		}
		await db.table("currency_rate_records").bulkPut(
			validRows.map((row) => ({ ...row, profile_scope: profileScope })),
		);
	}

	async deleteByNames(names: string[], scope?: string) {
		const keys = [...new Set((names || []).filter(Boolean))];
		if (!keys.length) {
			return;
		}
		const profileScope = this.resolveScope(scope);
		await db
			.table("currency_rate_records")
			.bulkDelete(keys.map((name) => [profileScope, name]));
	}

	async findForPair({
		profileScope,
		profileName,
		company,
		fromCurrency,
		toCurrency,
	}: Omit<CurrencyRateLookup, "date">): Promise<
		OfflineCurrencyRateRecord[]
	> {
		if (!profileName || !fromCurrency || !toCurrency) {
			return [];
		}
		return db
			.table("currency_rate_records")
			.where("[profile_scope+company+from_currency+to_currency]")
			.equals([
				this.resolveScope(
					profileScope || buildOfflineProfileScope({ name: profileName }),
				),
				company || "",
				fromCurrency,
				toCurrency,
			])
			.toArray();
	}

	async findLatestOnOrBefore(
		lookup: CurrencyRateLookup,
	): Promise<OfflineCurrencyRateRecord | null> {
		const rows = await this.findForPair(lookup);
		const eligible = rows
			.filter((row) => !lookup.date || row.date <= lookup.date)
			.sort((left, right) => {
				const dateOrder = String(right.date || "").localeCompare(
					String(left.date || ""),
				);
				if (dateOrder) {
					return dateOrder;
				}
				return String(right.modified || "").localeCompare(
					String(left.modified || ""),
				);
			});
		return eligible[0] || null;
	}
}

export const currencyRateRepository = new CurrencyRateRepository();
