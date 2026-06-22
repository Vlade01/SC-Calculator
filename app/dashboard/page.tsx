import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import MathEngine from "@/components/MathEngine";
import FinanceTools from "@/components/FinanceTools";
import CurrencyConverter from "@/components/CurrencyConverter";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-8 lg:px-10">
      <div className="mx-auto grid max-w-[1800px] gap-8 lg:grid-cols-[300px_1fr]">
        <Sidebar />
        <section className="space-y-8">
          <header className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-8 shadow-panel">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/75">Welcome back</p>
                <h1 className="mt-4 text-4xl font-semibold text-slate-100">Advanced Scientific Workspace</h1>
                <p className="mt-3 max-w-2xl text-slate-400">Use the integrated CAS, graphing engine, financial tools, and currency converter to solve exact symbolic problems and make data-backed decisions.</p>
              </div>
              <div className="rounded-3xl bg-slate-900/90 px-6 py-5 text-sm text-slate-300 border border-slate-700/60">
                Signed in as <span className="font-medium text-slate-100">{session.user?.email}</span>
              </div>
            </div>
          </header>
          <div id="math" className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-8 shadow-panel">
            <MathEngine />
          </div>
          <div id="finance" className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-8 shadow-panel">
            <FinanceTools />
          </div>
          <div id="currency" className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-8 shadow-panel">
            <CurrencyConverter />
          </div>
        </section>
      </div>
    </main>
  );
}
