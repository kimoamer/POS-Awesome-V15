import type { CustomerSummary } from "../../types/models";

type SearchableCustomer = CustomerSummary & {
	_search_text?: string;
};

export function normalizeCustomerSearchTerm(
	term: string | null | undefined,
): string {
	if (typeof term !== "string") {
		return "";
	}
	return term.trim();
}

export function buildCustomerSearchParts(
	term: string | null | undefined,
): string[] {
	return normalizeCustomerSearchTerm(term)
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean);
}

export function buildCustomerSearchText(
	customer: CustomerSummary | null | undefined,
): string {
	if (!customer) {
		return "";
	}

	return [
		customer.customer_name,
		customer.name,
		customer.mobile_no,
		customer.email_id,
		(customer as CustomerSummary & { tax_id?: unknown }).tax_id,
	]
		.filter((value) => value !== null && value !== undefined)
		.map((value) => String(value).toLowerCase())
		.join("\n");
}

export function normalizeCustomerIndexValue(value: unknown): string {
	return String(value ?? "").trim().toLowerCase();
}

/**
 * Compact durable tokens used by the IndexedDB customer search index.
 * Full values support exact/prefix lookup while word tokens make names such as
 * "Ahmed Mohamed" discoverable by either word without scanning the catalogue.
 */
export function buildCustomerIndexTokens(
	customer: CustomerSummary | null | undefined,
): string[] {
	if (!customer) return [];
	const values = [
		customer.name,
		customer.customer_name,
		customer.mobile_no,
		customer.email_id,
		(customer as CustomerSummary & { tax_id?: unknown }).tax_id,
	];
	const tokens = new Set<string>();
	for (const value of values) {
		const normalized = normalizeCustomerIndexValue(value);
		if (!normalized) continue;
		tokens.add(normalized.slice(0, 140));
		for (const part of normalized.split(/[^\p{L}\p{N}@.+_-]+/u)) {
			if (part) tokens.add(part.slice(0, 140));
		}
		const digits = normalized.replace(/\D/g, "");
		if (digits.length >= 4) tokens.add(digits.slice(0, 40));
	}
	return Array.from(tokens).slice(0, 32);
}

export function customerMatchesSearchParts(
	customer: CustomerSummary | null | undefined,
	searchParts: readonly string[],
): boolean {
	if (!searchParts.length) {
		return true;
	}

	if (!customer) {
		return false;
	}

	const searchableCustomer = customer as SearchableCustomer;
	const searchText =
		searchableCustomer._search_text || buildCustomerSearchText(customer);

	return searchParts.every((part) => searchText.includes(part));
}

export function customerMatchesSearchTerm(
	customer: CustomerSummary | null | undefined,
	term: string | null | undefined,
): boolean {
	return customerMatchesSearchParts(customer, buildCustomerSearchParts(term));
}
