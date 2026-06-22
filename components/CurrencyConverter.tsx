"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch currency rates.");
  }
  const data = await response.json();
  if (data.result !== "success" && data.result !== undefined) {
    throw new Error(data.error || "Currency API returned an invalid response.");
  }
  return data;
};

const apiUrl = "https://open.er-api.com/v6/latest/USD";

const currencyList = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "INR",
  "CNY",
  "CHF",
  "SGD"
];

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [amount, setAmount] = useState("100");

  const { data, error, isLoading } = useSWR(apiUrl, fetcher, {
    refreshInterval: 60 * 60 * 1000,
    revalidateOnFocus: false
  });

  const rate = useMemo(() => {
    if (!data || !data.rates) return 0;
    const baseToFrom = data.rates[fromCurrency];
    const baseToTo = data.rates[toCurrency];
    if (!baseToFrom || !baseToTo) return 0;
    return baseToTo / baseToFrom;
  }, [data, fromCurrency, toCurrency]);

  const result = useMemo(() => {
    const numeric = Number(amount);
    if (!rate || Number.isNaN(numeric)) return 0;
    return numeric * rate;
  }, [amount, rate]);

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_0.8fr]">
      <div className="space-y-6 rounded-[2rem] border border-slate-700/80 bg-slate-900/80 p-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="w-full text-sm font-medium text-slate-200">
              Amount
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>
            <label className="w-full text-sm font-medium text-slate-200">
              From
              <select
                value={fromCurrency}
                onChange={(event) => setFromCurrency(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              >
                {currencyList.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="w-full text-sm font-medium text-slate-200">
            To
            <select
              value={toCurrency}
              onChange={(event) => setToCurrency(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            >
              {currencyList.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-6">
          <p className="text-sm text-slate-400">Converted Amount</p>
          <p className="mt-3 text-4xl font-semibold text-slate-100">{isLoading ? "Loading..." : ` ${result.toFixed(4)} ${toCurrency}`}</p>
          <p className="mt-2 text-sm text-slate-400">Rate: {rate ? rate.toFixed(6) : "--"}</p>
        </div>
      </div>
      <div className="rounded-[2rem] border border-slate-700/80 bg-slate-900/80 p-6 text-slate-300">
        <h2 className="text-xl font-semibold text-slate-100">Live Currency Engine</h2>
        <p className="mt-4 leading-7">
          Requests use cached exchange rate responses and refresh hourly to prevent unnecessary API traffic while keeping conversion figures current.
        </p>
        <div className="mt-6 space-y-3 text-sm leading-6 text-slate-400">
          {error ? <p className="text-rose-300">{error.message || "Unable to load rates."}</p> : null}
          <p>Source: open.er-api.com</p>
          <p>Selected currencies are commonly used for global finance, analytics, and trading.</p>
          <p>Change the amount or currency pair to update the calculation instantly.</p>
        </div>
      </div>
    </div>
  );
}
