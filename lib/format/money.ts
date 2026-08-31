export function formatMinorUnits(value: string | number | bigint, currency = "INR"): string {
  const raw = typeof value === "bigint" ? value.toString() : String(value);
  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;
  const minor = digits.padStart(3, "0");
  const whole = minor.slice(0, -2).replace(/^0+(?=\d)/, "") || "0";
  const fraction = minor.slice(-2);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${negative ? "-" : ""}${symbol}${grouped}.${fraction}`;
}

export function formatPercent(value: number | null | undefined): string { return value == null ? "—" : `${value.toFixed(1)}%`; }
