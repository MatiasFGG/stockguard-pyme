const chileCurrencyFormatter =
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

export function formatCurrency(
  value: number | string,
): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "$0";
  }

  return chileCurrencyFormatter.format(
    numericValue,
  );
}