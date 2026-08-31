import { formatMinorUnits, formatPercent } from "@/lib/format/money";

export function MetricCard({ label, value, percent, dominant, note }: { label: string; value?: string | number; percent?: number; dominant?: boolean; note?: string }) {
  const display = percent !== undefined ? formatPercent(percent) : value === undefined ? "—" : typeof value === "number" ? value.toLocaleString("en-IN") : formatMinorUnits(value);
  return <article className={`rounded-lg border bg-surface p-5 ${dominant ? "border-amber/60" : "border-border"}`}><p className="text-xs uppercase tracking-wider text-muted">{label}</p><p className={`num mt-4 text-3xl font-semibold ${dominant ? "text-amber" : "text-paper"}`}>{display}</p>{note && <p className="mt-2 text-xs text-quiet">{note}</p>}</article>;
}
