"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

export default function FinanceTools() {
  const [principal, setPrincipal] = useState("100000");
  const [interestRate, setInterestRate] = useState("7.5");
  const [tenure, setTenure] = useState("5");
  const [monthlyInvestment, setMonthlyInvestment] = useState("5000");
  const [returnRate, setReturnRate] = useState("12");
  const [timePeriod, setTimePeriod] = useState("10");

  const emi = useMemo(() => {
    const P = Number(principal);
    const r = Number(interestRate) / 1200;
    const n = Number(tenure) * 12;
    if (!P || !r || !n) return 0;
    return (P * r) / (1 - Math.pow(1 + r, -n));
  }, [principal, interestRate, tenure]);

  const emiInfo = useMemo(() => {
    const n = Number(tenure) * 12;
    const totalPayment = emi * n;
    const totalInterest = totalPayment - Number(principal);
    return {
      monthly: Number.isFinite(emi) ? emi : 0,
      totalInterest: Number.isFinite(totalInterest) ? totalInterest : 0,
      totalPayment: Number.isFinite(totalPayment) ? totalPayment : 0
    };
  }, [emi, principal, tenure]);

  const sip = useMemo(() => {
    const m = Number(monthlyInvestment);
    const annual = Number(returnRate) / 100;
    const months = Number(timePeriod) * 12;
    const monthlyRate = annual / 12;
    if (!m || !months) return { invested: 0, returns: 0, total: 0 };
    const total = m * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const invested = m * months;
    return {
      invested,
      returns: total - invested,
      total: total
    };
  }, [monthlyInvestment, returnRate, timePeriod]);

  const pieData = useMemo<any[]>(() => {
    return [
      { values: [emiInfo.totalInterest, Number(principal)], labels: ["Interest", "Principal"], type: "pie", textinfo: "label+percent", hole: 0.45 }
    ];
  }, [emiInfo.totalInterest, principal]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-slate-100">EMI Calculator</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <label className="block">
              <span className="text-slate-200">Principal</span>
              <input
                type="number"
                value={principal}
                onChange={(event) => setPrincipal(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="text-slate-200">Annual Interest Rate (%)</span>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(event) => setInterestRate(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="text-slate-200">Tenure (years)</span>
              <input
                type="number"
                value={tenure}
                onChange={(event) => setTenure(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Monthly EMI</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">₹{emiInfo.monthly.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Total Interest</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">₹{emiInfo.totalInterest.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Total Payment</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">₹{emiInfo.totalPayment.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-slate-100">EMI Breakdown</h2>
          <Plot
            data={pieData}
            layout={{
              margin: { t: 30, b: 20, l: 20, r: 20 },
              paper_bgcolor: "#0f172a",
              plot_bgcolor: "#0f172a",
              font: { color: "#cbd5e1" },
              showlegend: true
            }}
            style={{ width: "100%", height: 360 }}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-slate-100">SIP Calculator</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <label className="block">
              <span className="text-slate-200">Monthly Investment</span>
              <input
                type="number"
                value={monthlyInvestment}
                onChange={(event) => setMonthlyInvestment(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="text-slate-200">Expected Annual Return (%)</span>
              <input
                type="number"
                step="0.1"
                value={returnRate}
                onChange={(event) => setReturnRate(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="text-slate-200">Time Period (years)</span>
              <input
                type="number"
                value={timePeriod}
                onChange={(event) => setTimePeriod(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-slate-100">SIP Summary</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Total Invested</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">₹{sip.invested.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Estimated Returns</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">₹{sip.returns.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-4">
              <p className="text-sm text-slate-400">Total Wealth</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">₹{sip.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
