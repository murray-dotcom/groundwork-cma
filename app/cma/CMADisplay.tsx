"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CompsResult, Transaction } from "@/lib/getComps";
import type { TrendPoint } from "@/lib/getTrends";
import type { EnrichmentData } from "@/components/EnrichmentPanel";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const PDFDownloadButton = dynamic(() => import("@/components/PDFDownloadButton"), { ssr: false });
const TrendChart = dynamic(() => import("@/components/TrendChart"), { ssr: false });
const EnrichmentPanel = dynamic(() => import("@/components/EnrichmentPanel"), { ssr: false });

interface CMADisplayProps {
  params: {
    address: string;
    estates: string[];
    propertyType: string;
    schemes?: string[];
    erfSize: number;
    builtArea?: number;
    askingPrice?: number;
    lookback: number;
    tolerance: number;
  };
  result: CompsResult;
  trends: TrendPoint[];
}

function formatRand(n: number) {
  return `R ${Math.round(n).toLocaleString("en-ZA")}`;
}

function formatRandPerM2(n: number) {
  return `R ${Math.round(n).toLocaleString("en-ZA")}/m²`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

function closestComp(comps: Transaction[], erfSize: number): string {
  if (comps.length === 0) return "";
  let closest = comps[0];
  let minDiff = Math.abs(comps[0].size_m2 - erfSize);
  for (const c of comps) {
    const diff = Math.abs(c.size_m2 - erfSize);
    if (diff < minDiff) { minDiff = diff; closest = c; }
  }
  return closest.id;
}

function pricePercentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const idx = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedArr[lower];
  return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (idx - lower);
}

function derivePrices(comps: Transaction[]) {
  const salePrices = comps.map((c) => c.sales_price).filter((p) => p > 0).sort((a, b) => a - b);
  const erfPpm = comps.map((c) => c.price_per_m2).filter((p) => p > 0).sort((a, b) => a - b);
  return {
    conservativePrice: pricePercentile(salePrices, 25),
    midMarketPrice: pricePercentile(salePrices, 50),
    strongPrice: pricePercentile(salePrices, 75),
    p25PricePerM2: pricePercentile(erfPpm, 25),
    medianPricePerM2: pricePercentile(erfPpm, 50),
    p75PricePerM2: pricePercentile(erfPpm, 75),
  };
}

export default function CMADisplay({ params, result, trends }: CMADisplayProps) {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [narrative, setNarrative] = useState<string>("");
  const [narrativeLoading, setNarrativeLoading] = useState(true);
  const [excludeOutliers, setExcludeOutliers] = useState(false);
  const [expandedEnrichmentId, setExpandedEnrichmentId] = useState<string | null>(null);
  const [enrichmentOverrides, setEnrichmentOverrides] = useState<Record<string, EnrichmentData>>({});
  const [pricingMode, setPricingMode] = useState<"erf" | "built">("erf");
  const today = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  const { lower, upper } = result.outlierBounds;

  // Apply enrichment overrides onto comps
  const enrichedComps = result.comps.map((c) => {
    const override = enrichmentOverrides[c.id];
    if (!override) return c;
    return {
      ...c,
      built_area_m2: override.built_area_m2 ?? c.built_area_m2,
      sea_view: override.sea_view ?? c.sea_view,
      view_rating: override.view_rating ?? c.view_rating,
      dwelling_type: override.dwelling_type ?? c.dwelling_type,
      condition_rating: override.condition_rating ?? c.condition_rating,
      enrichment_notes: override.enrichment_notes ?? c.enrichment_notes,
      is_enriched: true,
    };
  });

  const filteredComps = excludeOutliers
    ? enrichedComps.filter((c) => c.sales_price >= lower && c.sales_price <= upper)
    : enrichedComps;
  const outlierCount = enrichedComps.length - filteredComps.length;

  // Built-area pricing: comps that have a known built_area_m2 and the subject has builtArea
  const canSwitchToBuilt = Boolean(params.builtArea) &&
    filteredComps.some((c) => c.built_area_m2 && c.built_area_m2 > 0);

  function deriveBuiltPrices(comps: Transaction[]) {
    if (!params.builtArea) return null;
    const withBuilt = comps.filter((c) => c.built_area_m2 && c.built_area_m2 > 0);
    if (withBuilt.length === 0) return null;
    const ppmBuilt = withBuilt
      .map((c) => c.sales_price / c.built_area_m2!)
      .sort((a, b) => a - b);
    const p25 = pricePercentile(ppmBuilt, 25);
    const p50 = pricePercentile(ppmBuilt, 50);
    const p75 = pricePercentile(ppmBuilt, 75);
    return {
      conservativePrice: p25 * params.builtArea!,
      midMarketPrice: p50 * params.builtArea!,
      strongPrice: p75 * params.builtArea!,
      p25PricePerM2: p25,
      medianPricePerM2: p50,
      p75PricePerM2: p75,
    };
  }

  const erfPrices = excludeOutliers ? derivePrices(filteredComps) : {
    conservativePrice: result.conservativePrice,
    midMarketPrice: result.midMarketPrice,
    strongPrice: result.strongPrice,
    p25PricePerM2: result.p25PricePerM2,
    medianPricePerM2: result.medianPricePerM2,
    p75PricePerM2: result.p75PricePerM2,
  };

  const builtPrices = deriveBuiltPrices(filteredComps);
  const prices = pricingMode === "built" && builtPrices ? builtPrices : erfPrices;

  const closestId = closestComp(filteredComps, params.erfSize);

  useEffect(() => {
    fetch("/api/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: params.address,
        estate: params.estates.join(", "),
        compsCount: filteredComps.length,
        conservativePrice: prices.conservativePrice,
        midMarketPrice: prices.midMarketPrice,
        strongPrice: prices.strongPrice,
        medianPricePerM2: prices.medianPricePerM2,
        askingPrice: params.askingPrice,
      }),
    })
      .then((r) => r.json())
      .then((d) => { setNarrative(d.narrative); setNarrativeLoading(false); })
      .catch(() => setNarrativeLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // router is used for back navigation via Link in parent; suppress unused warning
  void router;

  return (
    <main className="min-h-screen bg-off-white py-8 px-4">
        {/* Low comps warning */}
        {filteredComps.length < 3 && (
          <div className="max-w-5xl mx-auto mb-2 bg-yellow-50 border border-yellow-200 rounded-lg px-5 py-3 text-yellow-800 font-cormorant text-sm" data-no-print>
            Only {filteredComps.length} comparable sale{filteredComps.length === 1 ? "" : "s"} found — results may be indicative only.
          </div>
        )}
      <div className="max-w-5xl mx-auto space-y-6" id="cma-report">

        {/* SECTION 1 — Header */}
        <div className="cma-section bg-olive text-cream rounded-t-lg px-8 py-5 flex justify-between items-start">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo_2.png"
              alt="Home Ground Real Estate"
              style={{ height: "78px" }}
            />
          </div>
          <div className="text-right">
            <p className="font-cinzel text-sm tracking-[0.15em] text-cream/90">COMPARABLE MARKET ANALYSIS</p>
            <p className="font-cormorant text-cream/60 text-sm mt-0.5">
              {params.address}, {params.estates.join(" + ")}
            </p>
            <p className="font-dm-sans text-cream/50 text-xs mt-0.5">
              Prepared: {today} | Lightstone Data
            </p>
            <button
              onClick={handleSignOut}
              className="mt-2 font-cormorant text-xs text-cream/40 hover:text-cream/70 transition-colors"
              data-no-print
            >
              Sign out
            </button>
          </div>
        </div>

        {/* SECTION 2 — Subject property strip */}
        <div className="cma-section bg-white border border-sage/20 rounded-lg grid grid-cols-4 divide-x divide-sage/20">
          {[
            { label: "Subject Property", value: params.address },
            { label: "ERF Size", value: `${params.erfSize} m²` },
            {
              label: "Built Area",
              value: params.builtArea ? `${params.builtArea} m²` : null,
              hint: "Add via enrich ↓",
            },
            { label: "Estate", value: params.estates.join(" + ") },
          ].map(({ label, value, hint }) => (
            <div key={label} className="px-6 py-4">
              <p className="font-cormorant text-xs uppercase tracking-widest text-sage">{label}</p>
              {value
                ? <p className="font-dm-sans text-sm text-gray-800 mt-1 font-medium">{value}</p>
                : <p className="font-dm-sans text-sm mt-1">
                    <span className="text-gray-400">—</span>
                    {hint && <span className="ml-2 font-cormorant text-xs italic text-sage/60">{hint}</span>}
                  </p>
              }
            </div>
          ))}
        </div>

        {/* SECTION 3 — Negotiation position (if asking price provided) */}
        {params.askingPrice && params.askingPrice > 0 && (
          <div className="cma-section negotiation-panel bg-white border border-sage/20 rounded-lg p-6">
            <h2 className="font-cinzel text-xs tracking-[0.2em] text-olive uppercase mb-4">Negotiation Position</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-cream rounded p-4 text-center">
                <p className="font-cormorant text-xs uppercase tracking-widest text-sage mb-1">Original Asking Price</p>
                <p className="font-cinzel text-2xl text-olive">{formatRand(params.askingPrice)}</p>
              </div>
              <div className="bg-olive rounded p-4 text-center">
                <p className="font-cormorant text-xs uppercase tracking-widest text-cream/70 mb-1">Market Mid-Point</p>
                <p className="font-cinzel text-2xl text-cream">{formatRand(prices.midMarketPrice)}</p>
              </div>
            </div>
            <p className="font-cormorant text-sm text-gray-600 italic">
              {params.askingPrice > prices.midMarketPrice
                ? `The asking price of ${formatRand(params.askingPrice)} sits ${formatRand(params.askingPrice - prices.midMarketPrice)} above the market mid-point, leaving room for negotiation toward the ${formatRand(prices.midMarketPrice)}–${formatRand(prices.strongPrice)} range.`
                : params.askingPrice < prices.midMarketPrice
                ? `The asking price of ${formatRand(params.askingPrice)} is ${formatRand(prices.midMarketPrice - params.askingPrice)} below the market mid-point of ${formatRand(prices.midMarketPrice)}, suggesting competitive positioning.`
                : `The asking price is aligned with the market mid-point of ${formatRand(prices.midMarketPrice)}.`}
            </p>
          </div>
        )}

        {/* SECTION 3b — Price trend chart */}
        <div className="cma-section bg-white border border-sage/20 rounded-lg p-6">
          <h2 className="font-cinzel text-xs tracking-[0.2em] text-olive uppercase mb-4">
            Price Trend — {params.estates.join(" + ")}
          </h2>
          <TrendChart data={trends} estate={params.estates.join(", ")} />
        </div>

        {/* SECTION 4 — Comparable sales table */}
        <div className="cma-section bg-white border border-sage/20 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-sage/20 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-cinzel text-xs tracking-[0.2em] text-olive uppercase">
              {params.schemes && params.schemes.length > 0
                ? `Comparable Sales — ${params.schemes.join(", ")}`
                : "Comparable Sales"}
            </h2>
            <div className="flex items-center gap-4 flex-wrap" data-no-print>
              {canSwitchToBuilt && (
                <div className="flex items-center gap-1 bg-cream rounded overflow-hidden text-xs font-dm-sans border border-sage/20">
                  <button
                    onClick={() => setPricingMode("erf")}
                    className={`px-3 py-1 transition-colors ${pricingMode === "erf" ? "bg-olive text-cream" : "text-sage hover:text-olive"}`}
                  >
                    Price by ERF
                  </button>
                  <button
                    onClick={() => setPricingMode("built")}
                    className={`px-3 py-1 transition-colors ${pricingMode === "built" ? "bg-olive text-cream" : "text-sage hover:text-olive"}`}
                  >
                    Price by built area
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="font-cormorant text-xs text-sage">Exclude outliers</span>
                <button
                  role="switch"
                  aria-checked={excludeOutliers}
                  onClick={() => setExcludeOutliers((v) => !v)}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none ${
                    excludeOutliers ? "bg-sage" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                      excludeOutliers ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                {excludeOutliers && outlierCount > 0 && (
                  <span className="font-dm-sans text-xs text-sage/80">
                    {outlierCount} outlier{outlierCount === 1 ? "" : "s"} excluded
                  </span>
                )}
              </label>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-olive text-cream">
                  {["Address", "Sale Date", "ERF m²", "Built m²", "Sale Price",
                    filteredComps.some((c) => c.built_area_m2) ? "R/m² ERF | BUILT" : "R/m²",
                    "Note", ""].map((h, i) => (
                    <th key={i} className="font-cormorant text-xs tracking-wider uppercase px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComps.map((comp, i) => (
                  <React.Fragment key={comp.id}>
                    <tr className={`comp-row ${i % 2 === 0 ? "bg-cream/40" : "bg-white"}`}>
                      <td className="px-4 py-3 font-dm-sans text-gray-800">
                        {comp.address}
                        {comp.id === closestId && <span className="ml-1 text-bronze">★</span>}
                        {comp.is_enriched && <span className="ml-1 text-sage" title="Enriched">✎</span>}
                      </td>
                      <td className="px-4 py-3 font-dm-sans text-gray-600">{formatDate(comp.registration_date)}</td>
                      <td className="px-4 py-3 font-dm-sans text-gray-600">{comp.size_m2}</td>
                      <td className="px-4 py-3 font-dm-sans text-gray-600">{comp.built_area_m2 ?? "—"}</td>
                      <td className="px-4 py-3 font-dm-sans text-gray-800 font-medium">{formatRand(Number(comp.sales_price))}</td>
                      <td className="px-4 py-3 font-dm-sans">
                        <span className="text-gray-400 text-xs">{formatRandPerM2(Number(comp.price_per_m2))} ERF</span>
                        {comp.built_area_m2 && comp.built_area_m2 > 0 && (
                          <span className="block font-medium" style={{ color: "#B47A05" }}>
                            {formatRandPerM2(Math.round(comp.sales_price / comp.built_area_m2))} built
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={notes[comp.id] ?? ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [comp.id]: e.target.value }))}
                          placeholder="Add note…"
                          className="w-full text-xs font-dm-sans border-b border-sage/30 bg-transparent focus:outline-none focus:border-bronze text-gray-600 placeholder-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3" data-no-print>
                        <button
                          onClick={() => setExpandedEnrichmentId((id) => id === comp.id ? null : comp.id)}
                          className="font-cormorant text-xs text-sage hover:text-olive transition-colors whitespace-nowrap"
                          title="Enrich this comparable"
                        >
                          {expandedEnrichmentId === comp.id ? "Close" : "Enrich"}
                        </button>
                      </td>
                    </tr>
                    {expandedEnrichmentId === comp.id && (
                      <tr data-no-print>
                        <td colSpan={8} className="p-0">
                          <EnrichmentPanel
                            titleDeedNo={comp.title_deed_no ?? comp.id}
                            estate={comp.estate}
                            initial={{
                              built_area_m2: comp.built_area_m2,
                              sea_view: comp.sea_view,
                              view_rating: comp.view_rating,
                              dwelling_type: comp.dwelling_type,
                              condition_rating: comp.condition_rating,
                              enrichment_notes: comp.enrichment_notes,
                            }}
                            onSaved={(data) => {
                              setEnrichmentOverrides((prev) => ({ ...prev, [comp.id]: data }));
                            }}
                            onClose={() => setExpandedEnrichmentId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5 — Price indication panels */}
        <div className="cma-section">
          <h2 className="font-cinzel text-xs tracking-[0.2em] text-olive uppercase mb-3">Market-Derived Price Indication</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Conservative", price: prices.conservativePrice, ppm: prices.p25PricePerM2, bg: "bg-sage" },
              { label: "Mid-Market", price: prices.midMarketPrice, ppm: prices.medianPricePerM2, bg: "bg-olive" },
              { label: "Strong Market", price: prices.strongPrice, ppm: prices.p75PricePerM2, bg: "bg-bronze" },
            ].map(({ label, price, ppm, bg }) => (
              <div key={label} className={`${bg} rounded-lg p-6 text-center`}>
                <p className="font-cormorant text-xs uppercase tracking-widest text-cream/70 mb-2">{label}</p>
                <p className="font-cinzel text-xl text-cream leading-tight">{formatRand(price)}</p>
                <p className="font-dm-sans text-cream/60 text-xs mt-2">@ {formatRandPerM2(ppm)} {pricingMode === "built" ? "built" : "ERF"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6 — Recommended range + narrative */}
        <div className="cma-section bg-white border border-sage/20 rounded-lg p-6">
          <p className="font-cinzel text-xs tracking-[0.2em] text-olive uppercase mb-3">
            RECOMMENDED NEGOTIATED RANGE: {formatRand(prices.conservativePrice)} – {formatRand(prices.strongPrice)}
          </p>
          {narrativeLoading ? (
            <div className="h-10 bg-sage/10 rounded animate-pulse" />
          ) : (
            <p className="font-cormorant text-base text-gray-700 leading-relaxed italic">{narrative}</p>
          )}
        </div>

        {/* SECTION 7 — Footer */}
        <div className="cma-section text-center py-4 border-t border-sage/20">
          <p className="font-cormorant text-xs text-sage/70 tracking-wider">
            This report is prepared for informational purposes only and does not constitute a formal valuation. Data sourced from Lightstone.
          </p>
          <p className="font-cinzel text-xs text-olive/60 tracking-[0.15em] mt-1">
            HOME GROUND REAL ESTATE | homegroundestates.co.za | Ballito, KwaZulu-Natal North Coast
          </p>
        </div>
      </div>

      {/* PDF Download button */}
      <PDFDownloadButton />
    </main>
  );
}
