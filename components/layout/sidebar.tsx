import Link from "next/link";

const navigation = ["Overview", "At Risk", "Recoveries", "Interventions", "Customers", "Escalations", "Audit Log", "Policies", "Settings"];
const paths: Record<string, string> = { Overview: "/", "At Risk": "/cases", Recoveries: "/recoveries", Interventions: "/interventions", Customers: "/customers", Escalations: "/escalations", "Audit Log": "/audit", Policies: "/policies", Settings: "/settings" };

export function Sidebar() {
  return <aside className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col border-r border-border bg-surface px-5 py-6">
    <div className="mb-10"><div className="flex items-center gap-2 text-sm font-semibold tracking-tight"><span className="h-2.5 w-2.5 rounded-full bg-amber" />Revenue Recovery</div><p className="mt-2 pl-4 text-xs text-quiet">AUTOPILOT OPERATIONS</p></div>
    <nav className="space-y-1">{navigation.map((item, index) => <Link key={item} href={paths[item]} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${index === 0 ? "bg-elevated text-paper" : "text-muted hover:bg-elevated hover:text-paper"}`}><span className="w-4 text-center text-xs text-quiet">{["⌂", "◌", "↗", "◇", "◉", "!", "≡", "⚙", "·"][index]}</span>{item}</Link>)}</nav>
    <div className="mt-auto border-t border-border pt-5"><p className="text-[11px] uppercase tracking-wider text-quiet">Agent status</p><div className="mt-2 flex items-center gap-2 text-sm text-success"><span className="h-2 w-2 rounded-full bg-success" />Operational</div></div>
  </aside>;
}
