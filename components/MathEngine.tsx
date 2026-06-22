"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { create, all } from "mathjs";
// @ts-ignore
import nerdamer from "nerdamer/all.min";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
const math = create(all);

type Tab = "symbolic" | "calculus" | "plot" | "geometry" | "matrix" | "stats" | "complex";

export default function MathEngine() {
  const [activeTab, setActiveTab] = useState<Tab>("symbolic");
  const [expression, setExpression] = useState("(x^2 - 1)/(x - 1)");
  const [symbolicOutput, setSymbolicOutput] = useState<string>("");
  const [calcInput, setCalcInput] = useState("x^3 + 2*x^2 - 5");
  const [calcOutput, setCalcOutput] = useState<string>("");
  const [graphInput, setGraphInput] = useState("sin(x) + 0.5*x");
  const [graphType, setGraphType] = useState<"2d" | "3d">("2d");
  const [graphData, setGraphData] = useState<any[]>([]);
  const [graphLayout, setGraphLayout] = useState<any>({});
  const [sampleTable, setSampleTable] = useState<Array<{ x: number; y: number }>>([]);
  const [matrixExpression, setMatrixExpression] = useState("[[2,1],[1,3]]");
  const [matrixResult, setMatrixResult] = useState<string>("");
  const [statsInput, setStatsInput] = useState("1, 2, 4, 7, 9");
  const [statsResult, setStatsResult] = useState<string>("");
  const [complexInput, setComplexInput] = useState("(2 + 3i)^2");
  const [complexOutput, setComplexOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "symbolic", label: "Symbolic" },
    { key: "calculus", label: "Calculus" },
    { key: "plot", label: "Graphing" },
    { key: "geometry", label: "Geometry" },
    { key: "matrix", label: "Matrix" },
    { key: "stats", label: "Statistics" },
    { key: "complex", label: "Complex" }
  ];

  useEffect(() => {
    if (activeTab === "geometry" && typeof window !== "undefined" && boardRef.current) {
      import("jsxgraph").then((JXG) => {
        const existingBoard = (JXG as any).JXG?.board?.current;
        if (existingBoard) {
          existingBoard.removeBoard();
        }
        const board = (JXG as any).default.initBoard(boardRef.current, {
          boundingbox: [-5, 5, 5, -5],
          axis: true,
          showNavigation: true,
          keepAspectRatio: true
        });
        board.create("point", [0, 0], { name: "O", size: 4, strokeColor: "cyan" });
        const A = board.create("point", [2, 2], { name: "A", face: "o", size: 4, strokeColor: "lime" });
        const B = board.create("point", [-2, 1], { name: "B", face: "o", size: 4, strokeColor: "lime" });
        board.create("line", [A, B], { strokeColor: "magenta", strokeWidth: 2 });
        board.create("circle", [A, B], { strokeColor: "amber", strokeWidth: 2 });
      });
    }
  }, [activeTab]);

  const buildSampleTable = (fn: (x: number) => number) => {
    const rows = Array.from({ length: 11 }, (_, index) => {
      const x = -5 + index;
      const y = Number.isFinite(fn(x)) ? Number(fn(x).toFixed(6)) : NaN;
      return { x, y };
    });
    setSampleTable(rows);
  };

  const plot2D = () => {
    setError(null);
    try {
      const compiled = math.compile(graphInput.replace(/\^/g, "**"));
      const xs = Array.from({ length: 201 }, (_, i) => -10 + i * 0.1);
      const ys = xs.map((x) => {
        const scope = { x };
        const value = compiled.evaluate(scope);
        return Number.isFinite(value) ? value : NaN;
      });
      setGraphData([
        {
          x: xs,
          y: ys,
          mode: "lines",
          line: { color: "#38bdf8" },
          name: "y = f(x)"
        }
      ]);
      setGraphLayout({
        title: "2D Function Plot",
        plot_bgcolor: "#0f172a",
        paper_bgcolor: "#020617",
        font: { color: "#cbd5e1" },
        xaxis: { title: "x", gridcolor: "#334155" },
        yaxis: { title: "y", gridcolor: "#334155" }
      });
      buildSampleTable((x) => compiled.evaluate({ x }));
    } catch (err) {
      console.error(err);
      setError("Unable to parse the graph expression.");
    }
  };

  const plot3D = () => {
    setError(null);
    try {
      const expr = graphInput.replace(/\^/g, "**");
      const compiled = math.compile(expr);
      const xValues = Array.from({ length: 35 }, (_, i) => -4 + i * 0.25);
      const yValues = Array.from({ length: 35 }, (_, j) => -4 + j * 0.25);
      const zValues = xValues.map((x) =>
        yValues.map((y) => {
          const value = compiled.evaluate({ x, y });
          return Number.isFinite(value) ? value : NaN;
        })
      );
      setGraphData([
        {
          x: xValues,
          y: yValues,
          z: zValues,
          type: "surface",
          colorscale: "Viridis"
        }
      ]);
      setGraphLayout({
        title: "3D Surface",
        scene: { xaxis: { title: "x" }, yaxis: { title: "y" }, zaxis: { title: "z" }, bgcolor: "#020617" },
        paper_bgcolor: "#020617",
        font: { color: "#cbd5e1" }
      });
      setSampleTable([]);
    } catch (err) {
      console.error(err);
      setError("Unable to parse the 3D surface expression.");
    }
  };

  const runSymbolic = (operation: "simplify" | "expand" | "factor") => {
    setError(null);
    try {
      let result;
      if (!expression.trim()) {
        throw new Error("Enter a valid expression.");
      }
      if (operation === "simplify") {
        result = nerdamer(expression).toString();
      } else if (operation === "expand") {
        result = nerdamer(expression).expand().toString();
      } else {
        result = nerdamer(expression).factor().toString();
      }
      setSymbolicOutput(result);
    } catch (err) {
      console.error(err);
      setError("Symbolic processing failed. Check your syntax.");
    }
  };

  const runCalculus = (action: "limit" | "derive" | "integrate") => {
    setError(null);
    try {
      if (!calcInput.trim()) {
        throw new Error("Enter a calculus expression.");
      }
      let result;
      if (action === "limit") {
        result = nerdamer.limit(calcInput, "x", 0).toString();
      } else if (action === "derive") {
        result = nerdamer.diff(calcInput, "x").toString();
      } else {
        result = nerdamer.integrate(calcInput, "x").toString();
      }
      setCalcOutput(result);
    } catch (err) {
      console.error(err);
      setError("Calculus operation failed. Ensure the expression is valid.");
    }
  };

  const runMatrixOperation = (operation: "inverse" | "determinant" | "rref" | "eigen") => {
    setError(null);
    try {
      const matrix = math.matrix(JSON.parse(matrixExpression));
      let result;
      switch (operation) {
        case "inverse":
          result = math.inv(matrix);
          break;
        case "determinant":
          result = math.det(matrix);
          break;
        case "rref":
          result = (math as any).rref(matrix);
          break;
        case "eigen": {
          const eigen = (math as any).eigs?.(matrix);
          result = eigen ? eigen.values : "Eigen decomposition unavailable";
          break;
        }
        default:
          result = "Unsupported operation";
      }
      setMatrixResult(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(err);
      setError("Matrix operation failed. Provide a valid JSON matrix.");
    }
  };

  const runStats = () => {
    setError(null);
    try {
      const values = statsInput.split(",").map((token) => Number(token.trim())).filter((value) => !Number.isNaN(value));
      if (values.length === 0) {
        throw new Error("Enter a numeric dataset.");
      }
      const mean = Number(math.mean(values));
      const median = Number(math.median(values));
      const stdev = Number(math.std(values));
      const variance = Number((math as any).var ? (math as any).var(values) : (math as any).variance(values));
      const sorted = [...values].sort((a, b) => a - b);
      const n = values.length;
      setStatsResult(`Mean: ${mean.toFixed(4)}\nMedian: ${median.toFixed(4)}\nStd Dev: ${stdev.toFixed(4)}\nVariance: ${variance.toFixed(4)}\nMin: ${sorted[0]}\nMax: ${sorted[n - 1]}\nCount: ${n}`);
    } catch (err) {
      console.error(err);
      setError("Statistics analysis failed. Ensure your dataset is valid.");
    }
  };

  const runComplex = () => {
    setError(null);
    try {
      const value = math.evaluate(complexInput.replace(/i/g, "i"));
      const complexResult = math.complex(value);
      const formatted = typeof complexResult.format === "function" ? (complexResult as any).format({ notation: "fixed", precision: 6 }) : complexResult.toString();
      setComplexOutput(formatted.toString());
    } catch (err) {
      console.error(err);
      setError("Complex evaluation failed. Use a valid complex expression like 3 + 2i.");
    }
  };

  const analysisOutput = useMemo(() => {
    const roots = sampleTable.filter((row) => Math.abs(row.y) < 1e-2).map((row) => row.x);
    return roots.length ? `Intercepts near x = ${roots.join(", ")}` : "No intercepts detected in sampled range.";
  }, [sampleTable]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${activeTab === tab.key ? "bg-cyan-500 text-slate-950" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">{error}</div> : null}

      {activeTab === "symbolic" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">Expression</label>
            <input
              value={expression}
              onChange={(event) => setExpression(event.target.value)}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="e.g. (x^3 - 1)/(x - 1)"
            />
            <div className="flex flex-wrap gap-3">
              {(["simplify", "expand", "factor"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => runSymbolic(op)}
                  className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                >
                  {op}
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 text-slate-100">
            <h3 className="text-lg font-semibold">Exact result</h3>
            <pre className="mt-4 whitespace-pre-wrap text-sm leading-6">{symbolicOutput || "Results appear here."}</pre>
          </section>
        </div>
      )}

      {activeTab === "calculus" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">Calculus expression</label>
            <input
              value={calcInput}
              onChange={(event) => setCalcInput(event.target.value)}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="e.g. x^3 + 2x^2"
            />
            <div className="flex flex-wrap gap-3">
              {(["limit", "derive", "integrate"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => runCalculus(op)}
                  className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                >
                  {op}
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 text-slate-100">
            <h3 className="text-lg font-semibold">Analytical output</h3>
            <pre className="mt-4 whitespace-pre-wrap text-sm leading-6">{calcOutput || "Results appear here."}</pre>
          </section>
        </div>
      )}

      {activeTab === "plot" && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-200">Expression</label>
              <input
                value={graphInput}
                onChange={(event) => setGraphInput(event.target.value)}
                className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                placeholder="e.g. sin(x) or x^2 + y^2"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setGraphType("2d")}
                  className={`rounded-2xl px-4 py-2 text-sm transition ${graphType === "2d" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-200 hover:bg-slate-700"}`}
                >
                  2D
                </button>
                <button
                  onClick={() => setGraphType("3d")}
                  className={`rounded-2xl px-4 py-2 text-sm transition ${graphType === "3d" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-200 hover:bg-slate-700"}`}
                >
                  3D
                </button>
                <button
                  onClick={graphType === "2d" ? plot2D : plot3D}
                  className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-indigo-400"
                >
                  Render
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 text-slate-100">
              <h3 className="text-lg font-semibold">Graph analysis</h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">{analysisOutput}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4">
            <Plot data={graphData} layout={graphLayout} useResizeHandler style={{ width: "100%", minHeight: 520 }} />
          </div>
          {sampleTable.length > 0 && (
            <div className="overflow-x-auto rounded-3xl border border-slate-700/80 bg-slate-900/80 p-4">
              <h3 className="text-lg font-semibold text-slate-100">Value Table</h3>
              <div className="mt-4 grid min-w-[360px] grid-cols-[1fr_1fr] gap-2 text-sm text-slate-300">
                <span className="font-semibold text-slate-200">x</span>
                <span className="font-semibold text-slate-200">y</span>
                {sampleTable.map((row) => (
                  <div key={`row-${row.x}`} className="contents">
                    <span className="border-t border-slate-700/80 py-2">{row.x}</span>
                    <span className="border-t border-slate-700/80 py-2">{Number.isNaN(row.y) ? "NaN" : row.y.toFixed(6)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "geometry" && (
        <div className="space-y-6">
          <p className="text-sm leading-7 text-slate-300">Interactive dynamic geometry board. Move points to explore constructions using JSXGraph.</p>
          <div className="h-[520px] overflow-hidden rounded-[2rem] border border-slate-700/80 bg-slate-900/80" ref={boardRef}></div>
        </div>
      )}

      {activeTab === "matrix" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">Matrix JSON</label>
            <textarea
              value={matrixExpression}
              onChange={(event) => setMatrixExpression(event.target.value)}
              rows={8}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
            />
            <div className="flex flex-wrap gap-3">
              {(["inverse", "determinant", "rref", "eigen"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => runMatrixOperation(op)}
                  className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
                >
                  {op}
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 text-slate-100">
            <h3 className="text-lg font-semibold">Matrix result</h3>
            <pre className="mt-4 whitespace-pre-wrap text-sm leading-6">{matrixResult || "Run an operation to see output."}</pre>
          </section>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">Dataset</label>
            <input
              value={statsInput}
              onChange={(event) => setStatsInput(event.target.value)}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="e.g. 3, 6, 9, 12"
            />
            <button
              onClick={runStats}
              className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-indigo-400"
            >
              Analyze
            </button>
          </section>
          <section className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 text-slate-100">
            <h3 className="text-lg font-semibold">Statistics</h3>
            <pre className="mt-4 whitespace-pre-wrap text-sm leading-6">{statsResult || "Statistical summary will appear here."}</pre>
          </section>
        </div>
      )}

      {activeTab === "complex" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">Complex expression</label>
            <input
              value={complexInput}
              onChange={(event) => setComplexInput(event.target.value)}
              className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="e.g. (2 + 3i)^2"
            />
            <button
              onClick={runComplex}
              className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-indigo-400"
            >
              Evaluate
            </button>
          </section>
          <section className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 text-slate-100">
            <h3 className="text-lg font-semibold">Complex result</h3>
            <pre className="mt-4 whitespace-pre-wrap text-sm leading-6">{complexOutput || "Complex output will appear here."}</pre>
          </section>
        </div>
      )}
    </div>
  );
}
