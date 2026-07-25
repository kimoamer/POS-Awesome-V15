export function formatMoney(
	value: number | string | null | undefined,
	formatCurrency: (val: any) => string,
	currencySymbol: (curr?: string) => string,
	displayCurrency?: string,
): string {
	const numericValue = Number(value || 0);
	const formatted = String(formatCurrency(numericValue) || "0.00").trim();
	const symbol = String(currencySymbol(displayCurrency) || "").trim();

	if (!symbol) {
		return formatted;
	}

	if (formatted.includes(symbol)) {
		return formatted;
	}

	return `${symbol} ${formatted}`.trim();
}
