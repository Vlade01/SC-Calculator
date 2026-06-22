import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard#math", label: "CAS & Graphs" },
  { href: "/dashboard#finance", label: "Finance" },
  { href: "/dashboard#currency", label: "Currency" }
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-72 xl:w-80 flex-col gap-6 p-6 bg-slate-950/80 border border-slate-700/60 rounded-3xl shadow-panel sticky top-6 h-[calc(100vh-48px)]">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/75">Scientific Hub</p>
        <h2 className="mt-4 text-3xl font-semibold text-slate-100">SC Calcy</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">Advanced CAS, financial models, and real-time currency tools for engineers and analysts.</p>
      </div>
      <nav className="mt-8 flex flex-col gap-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800/80 hover:text-cyan-200">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
