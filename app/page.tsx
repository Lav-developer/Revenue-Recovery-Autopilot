const metrics = [
  ["Revenue at risk", "—", "Calculated from open recovery cases"],
  ["Recovered", "—", "Recorded from successful outcome events"],
  ["Recovery rate", "—", "Recovered / eligible amount"],
  ["Interventions", "—", "Persisted intervention records"],
];

export default function OverviewPage() {
  return <div className="p-10"><header className="mb-10 flex items-end justify-between"><div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-amber">Revenue Recovery</p><h1 className="text-3xl font-semibold tracking-tight">Autopilot overview</h1><p className="mt-2 text-sm text-muted">A measured view of bounded recovery operations.</p></div><div className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-muted">Last 30 days <span className="ml-3 text-paper">▾</span></div></header>
    <section className="grid grid-cols-4 gap-4">{metrics.map(([label, value, note], i) => <article key={label} className={`rounded-lg border border-border bg-surface p-5 ${i === 1 ? "border-amber/50" : ""}`}><p className="text-sm text-muted">{label}</p><p className={`num mt-5 text-4xl font-semibold ${i === 1 ? "text-amber" : "text-paper"}`}>{value}</p><p className="mt-3 text-xs text-quiet">{note}</p></article>)}</section>
    <section className="mt-6 grid grid-cols-[1.4fr_1fr] gap-6"><div className="rounded-lg border border-border bg-surface p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Recovery funnel</h2><p className="mt-1 text-sm text-muted">Metrics will appear after the database is configured and seeded.</p></div><span className="rounded-full border border-border px-3 py-1 text-xs text-quiet">Awaiting data</span></div><div className="mt-8 grid grid-cols-4 gap-3">{["At risk", "Eligible", "Intervened", "Recovered"].map((stage) => <div key={stage} className="border-l-2 border-border pl-3"><div className="num text-2xl text-paper">—</div><div className="mt-1 text-xs text-muted">{stage}</div></div>)}</div></div><div className="rounded-lg border border-border bg-surface p-6"><h2 className="text-lg font-semibold">AI recovery activity</h2><p className="mt-2 text-sm leading-6 text-muted">Agent decisions and outcomes will be shown here once recovery events are processed.</p><div className="mt-8 border-t border-border pt-4 text-xs text-quiet">No activity recorded</div></div></section>
  </div>;
}
