"use client";

import { useState, useRef, useCallback } from "react";
import type { AnalysisResult, GuidanceItem } from "../lib/types";

const TONE_STYLE: Record<string, { bar: string; label: string; bg: string }> = {
  Optimistic: { bar: "bg-[#2d7a4f]", label: "text-[#2d7a4f]", bg: "bg-[#eaf5ee]" },
  Cautious:   { bar: "bg-[#b8860b]", label: "text-[#8b6914]", bg: "bg-[#fdf6e3]" },
  Neutral:    { bar: "bg-[#6b7280]", label: "text-[#6b7280]", bg: "bg-[#f3f4f6]" },
  Pessimistic:{ bar: "bg-[#a63d3d]", label: "text-[#a63d3d]", bg: "bg-[#fdf0ef]" },
};

const CONF_STYLE: Record<string, string> = {
  High: "border-[#2d7a4f] text-[#2d7a4f]",
  Medium: "border-[#b8860b] text-[#8b6914]",
  Low: "border-[#a63d3d] text-[#a63d3d]",
};

export default function Home() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("File exceeds the 20 MB limit."); return; }
    setError(null); setData(null); setFileName(file.name); setLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) setError(json.error || "Analysis failed.");
      else setData(json as AnalysisResult);
    } catch { setError("Connection failed. Please retry."); }
    finally { setLoading(false); }
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const tone = data ? TONE_STYLE[data.sentiment] ?? TONE_STYLE.Neutral : null;
  const conf = data ? CONF_STYLE[data.confidence_score] ?? CONF_STYLE.Medium : null;

  const reset = () => { setData(null); setFileName(null); setError(null); };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0c1b2a]/95 border-b border-[#1a3a5c]">
        <div className="max-w-[1120px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#c9a84c] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c1b2a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-9"/>
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight">MoneyStories</span>
            <span className="text-[10px] text-[#c9a84c] font-medium tracking-widest uppercase ml-1 hidden sm:inline">Research</span>
          </div>
          {data && (
            <button onClick={reset}
              className="text-xs px-3.5 py-1.5 rounded border border-[#c9a84c]/40 text-[#e8d48b] hover:bg-[#c9a84c]/10 transition cursor-pointer">
              New Report
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-[1120px] w-full mx-auto px-6">

        {/* ── UPLOAD ── */}
        {!data && !loading && (
          <section className="anim-fade-up py-16 sm:py-24">
            <div className="max-w-xl mx-auto">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#c9a84c] font-semibold mb-4">
                Earnings Intelligence
              </p>
              <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold text-[#0c1b2a] leading-[1.15] mb-4">
                Turn conference calls<br/>into actionable research.
              </h1>
              <p className="text-[15px] text-[#5a5a52] leading-relaxed mb-10 max-w-md">
                Upload a transcript and receive structured analysis — management tone,
                risks, guidance, and growth signals — in seconds.
              </p>

              <div
                onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`group relative rounded-xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-[#c9a84c] bg-[rgba(201,168,76,0.08)]"
                    : "border-[#d6d3c8] hover:border-[#c9a84c]/60 hover:bg-[rgba(201,168,76,0.04)]"
                }`}
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-[#0c1b2a] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="12" y2="12"/><line x1="15" y1="15" x2="12" y2="12"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#0c1b2a] mb-1">
                  Drop your transcript here
                </p>
                <p className="text-xs text-[#8a8880]">
                  PDF format &middot; up to 20 MB
                </p>
                <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={onFile} className="hidden" />
              </div>

              {error && (
                <div className="mt-5 rounded-lg bg-[#fdf0ef] border border-[#e8c4c4] px-4 py-3 text-sm text-[#a63d3d]">
                  {error}
                </div>
              )}

              <div className="mt-16 grid grid-cols-3 gap-px bg-[#d6d3c8] rounded-lg overflow-hidden">
                {[
                  { n: "01", t: "Upload", d: "Drop a PDF transcript" },
                  { n: "02", t: "Analyze", d: "AI extracts structured data" },
                  { n: "03", t: "Report", d: "Dashboard-ready insights" },
                ].map((s) => (
                  <div key={s.n} className="bg-white p-5">
                    <span className="text-[10px] font-bold text-[#c9a84c] tracking-widest">{s.n}</span>
                    <h4 className="text-sm font-semibold text-[#0c1b2a] mt-1">{s.t}</h4>
                    <p className="text-xs text-[#8a8880] mt-0.5">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <section className="anim-fade-up flex flex-col items-center justify-center py-32">
            <div className="relative w-14 h-14 mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-[#d6d3c8]" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#c9a84c] animate-spin" />
              <div className="absolute inset-[6px] rounded-full border-2 border-transparent border-b-[#0c1b2a] animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
            <p className="text-base font-semibold text-[#0c1b2a]">Processing transcript</p>
            <p className="text-xs text-[#8a8880] mt-1.5 font-mono">{fileName}</p>
            <div className="mt-6 w-48 h-1 rounded-full overflow-hidden loading-shimmer" />
          </section>
        )}

        {/* ── RESULTS ── */}
        {data && tone && conf && (
          <section className="py-10 space-y-6">

            {/* Back + File label */}
            <div className="anim-fade-up flex items-center gap-3 text-xs text-[#8a8880]">
              <button onClick={reset}
                className="flex items-center gap-1.5 text-[#5a5a52] hover:text-[#0c1b2a] transition cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                <span className="font-medium">Back</span>
              </button>
              <span className="text-[#d6d3c8]">|</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {fileName}
            </div>

            {/* Sentiment + Confidence row */}
            <div className="anim-fade-up anim-fade-up-d1 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-5">
              <div className={`rounded-xl p-6 ${tone.bg} border border-black/5`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[#5a5a52]">Management Tone</span>
                  <span className={`text-[10px] tracking-[0.15em] uppercase font-bold ${tone.label}`}>{data.sentiment}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/5 mb-4">
                  <div className={`h-full rounded-full ${tone.bar} transition-all duration-700`}
                    style={{ width: data.sentiment === "Optimistic" ? "85%" : data.sentiment === "Cautious" ? "55%" : data.sentiment === "Neutral" ? "50%" : "25%" }} />
                </div>
                <p className="text-[13px] text-[#3a3a35] leading-relaxed">{data.sentiment_reasoning}</p>
              </div>

              <div className="rounded-xl bg-white border border-[#e8e5dc] p-6 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[#5a5a52] mb-3">Guidance Clarity</span>
                <span className={`inline-block px-4 py-1.5 rounded-md border-2 text-base font-bold tracking-wide ${conf}`}>
                  {data.confidence_score}
                </span>
                <span className="text-[11px] text-[#8a8880] mt-2">specificity of forward-looking statements</span>
              </div>
            </div>

            {/* Positives + Negatives */}
            <div className="anim-fade-up anim-fade-up-d2 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl bg-white border border-[#e8e5dc] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-5 h-5 rounded-sm bg-[#2d7a4f] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <h3 className="text-sm font-bold text-[#0c1b2a] tracking-tight">Key Positives</h3>
                </div>
                <ul className="space-y-2.5">
                  {data.positives.map((p, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] text-[#3a3a35] leading-snug">
                      <span className="text-[#2d7a4f] font-bold mt-px flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-white border border-[#e8e5dc] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-5 h-5 rounded-sm bg-[#a63d3d] flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                  <h3 className="text-sm font-bold text-[#0c1b2a] tracking-tight">Risks &amp; Concerns</h3>
                </div>
                <ul className="space-y-2.5">
                  {data.negatives.map((n, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] text-[#3a3a35] leading-snug">
                      <span className="text-[#a63d3d] font-bold mt-px flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Forward Guidance table */}
            <div className="anim-fade-up anim-fade-up-d3 rounded-xl bg-white border border-[#e8e5dc] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#f0ece0] flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-9"/></svg>
                <h3 className="text-sm font-bold text-[#0c1b2a] tracking-tight">Forward Guidance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[10px] tracking-[0.12em] uppercase text-[#8a8880] border-b border-[#f0ece0]">
                      <th className="text-left font-semibold px-6 py-3">Metric</th>
                      <th className="text-left font-semibold px-6 py-3">Outlook</th>
                      <th className="text-left font-semibold px-6 py-3">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.guidance.map((g: GuidanceItem, i: number) => (
                      <tr key={i} className="border-b border-[#f7f5ef] last:border-none hover:bg-[#faf8f2] transition-colors">
                        <td className="px-6 py-3.5 font-semibold text-[#0c1b2a] whitespace-nowrap">{g.metric}</td>
                        <td className="px-6 py-3.5 text-[#3a3a35]">{g.outlook}</td>
                        <td className="px-6 py-3.5 text-[#8a8880] whitespace-nowrap font-mono text-xs">{g.timeframe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Capacity + Growth */}
            <div className="anim-fade-up anim-fade-up-d4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl bg-[#0c1b2a] p-6">
                <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[#c9a84c]">Capacity Utilization</span>
                <p className="text-[13px] text-[#c8c4b8] leading-relaxed mt-3">{data.capacity_utilization}</p>
              </div>
              <div className="rounded-xl bg-[#0c1b2a] p-6">
                <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[#c9a84c]">Growth Initiatives</span>
                <ul className="mt-3 space-y-2">
                  {data.growth_initiatives.map((g, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] text-[#c8c4b8] leading-snug">
                      <span className="text-[#c9a84c] font-mono text-xs mt-px flex-shrink-0">{String(i+1).padStart(2,"0")}</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="anim-fade-up anim-fade-up-d5 text-center text-[11px] text-[#8a8880] pt-6 pb-10 border-t border-[#e8e5dc]">
              AI-generated analysis from uploaded transcript &middot; Verify against source &middot; Not investment advice
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
