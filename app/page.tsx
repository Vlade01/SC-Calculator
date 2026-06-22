import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-10 shadow-panel backdrop-blur-xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <section>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/75">Welcome back</p>
            <h1 className="mt-4 text-5xl font-semibold text-slate-50">Next-gen scientific calculator for engineering and finance.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Sign in to access symbolic algebra, calculus tooling, dynamic geometry, EMI/SIP projections, and live currency conversion.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/login" className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                Log In
              </Link>
              <Link href="/signup" className="rounded-2xl border border-slate-600 px-6 py-3 text-sm text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200">
                Create Account
              </Link>
            </div>
          </section>
          <section className="rounded-[2rem] border border-slate-700/70 bg-slate-900/80 p-8 shadow-panel">
            <h2 className="text-2xl font-semibold text-slate-100">Featured Modules</h2>
            <ul className="mt-6 space-y-4 text-slate-300">
              <li>• Exact symbolic simplification, factoring, and calculus with nerdamer</li>
              <li>• Interactive 2D / 3D graphs and JSXGraph constructions</li>
              <li>• EMI & SIP financial planning tools</li>
              <li>• Live currency converter with optimized caching</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
