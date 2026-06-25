"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CompsResult, Transaction } from "@/lib/getComps";
import dynamic from "next/dynamic";

const PDFDownloadButton = dynamic(() => import("@/components/PDFDownloadButton"), { ssr: false });

interface CMADisplayProps {
  params: {
    address: string;
    estate: string;
    propertyType: string;
    erfSize: number;
    builtArea?: number;
    askingPrice?: number;
    lookback: number;
    tolerance: number;
  };
  result: CompsResult;
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

export default function CMADisplay({ params, result }: CMADisplayProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [narrative, setNarrative] = useState<string>("");
  const [narrativeLoading, setNarrativeLoading] = useState(true);
  const [excludeOutliers, setExcludeOutliers] = useState(false);
  const today = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  const { lower, upper } = result.outlierBounds;
  const filteredComps = excludeOutliers
    ? result.comps.filter((c) => c.sales_price >= lower && c.sales_price <= upper)
    : result.comps;
  const outlierCount = result.comps.length - filteredComps.length;

  const prices = excludeOutliers ? derivePrices(filteredComps) : {
    conservativePrice: result.conservativePrice,
    midMarketPrice: result.midMarketPrice,
    strongPrice: result.strongPrice,
    p25PricePerM2: result.p25PricePerM2,
    medianPricePerM2: result.medianPricePerM2,
    p75PricePerM2: result.p75PricePerM2,
  };

  const closestId = closestComp(filteredComps, params.erfSize);

  useEffect(() => {
    fetch("/api/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: params.address,
        estate: params.estate,
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

  const cmaData = {
    params,
    result: {
      ...result,
      comps: filteredComps,
      ...prices,
    },
    notes,
    narrative,
    today,
  };

  // router is used for back navigation via Link in parent; suppress unused warning
  void router;

  return (
    <main className="min-h-screen bg-off-white py-8 px-4">
        {/* Low comps warning */}
        {filteredComps.length < 3 && (
          <div className="max-w-5xl mx-auto mb-2 bg-yellow-50 border border-yellow-200 rounded-lg px-5 py-3 text-yellow-800 font-cormorant text-sm">
            Only {filteredComps.length} comparable sale{filteredComps.length === 1 ? "" : "s"} found — results may be indicative only.
          </div>
        )}
      <div className="max-w-5xl mx-auto space-y-6" id="cma-report">

        {/* SECTION 1 — Header */}
        <div className="bg-olive text-cream rounded-t-lg px-8 py-5 flex justify-between items-start">
          <div>
            <h1 className="font-cinzel text-2xl tracking-[0.25em]">HOME GROUND</h1>
            <p className="font-cormorant text-cream/60 text-sm tracking-wider mt-0.5">Real Estate</p>
          </div>
          <div className="text-right">
            <p className="font-cinzel text-sm tracking-[0.15em] text-cream/90">COMPARABLE MARKET ANALYSIS</p>
            <p className="font-cormorant text-cream/60 text-sm mt-0.5">
              {params.address}, {params.estate}
            </p>
            <p className="font-dm-sans text-cream/50 text-xs mt-0.5">
              Prepared: {today} | Lightstone Data
            </p>
          </div>
        </div>

        {/* SECTION 2 — Subject property strip */}
        <div className="bg-white border border-sage/20 rounded-lg grid grid-cols-4 divide-x divide-sage/20">
          {[
            { label: "Subject Property", value: params.address },
            { label: "ERF Size", value: `${params.erfSize} m²` },
            { label: "Built Area", value: params.builtArea ? `${params.builtArea} m²` : "—" },
            { label: "Estate", value: params.estate },
          ].map(({ label, value }) => (
            <div key={label} className="px-6 py-4">
              <p className="font-cormorant text-xs uppercase tracking-widest text-sage">{label}</p>
              <p className="font-dm-sans text-sm text-gray-800 mt-1 font-medium">{value}</p>
            </div>
          ))}
        </div>

        {/* SECTION 3 — Negotiation position (if asking price provided) */}
        {params.askingPrice && params.askingPrice > 0 && (
          <div className="bg-white border border-sage/20 rounded-lg p-6">
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

        {/* SECTION 4 — Comparable sales table */}
        <div className="bg-white border border-sage/20 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-sage/20 flex items-center justify-between">
            <h2 className="font-cinzel text-xs tracking-[0.2em] text-olive uppercase">Comparable Sales</h2>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-olive text-cream">
                  {["Address", "Sale Date", "ERF m²", "Built m²", "Sale Price", "R/m²", "Note"].map((h) => (
                    <th key={h} className="font-cormorant text-xs tracking-wider uppercase px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComps.map((comp, i) => (
                  <tr key={comp.id} className={i % 2 === 0 ? "bg-cream/40" : "bg-white"}>
                    <td className="px-4 py-3 font-dm-sans text-gray-800">
                      {comp.address}
                      {comp.id === closestId && <span className="ml-1 text-bronze">★</span>}
                    </td>
                    <td className="px-4 py-3 font-dm-sans text-gray-600">{formatDate(comp.registration_date)}</td>
                    <td className="px-4 py-3 font-dm-sans text-gray-600">{comp.size_m2}</td>
                    <td className="px-4 py-3 font-dm-sans text-gray-600">{comp.built_area_m2 ?? "—"}</td>
                    <td className="px-4 py-3 font-dm-sans text-gray-800 font-medium">{formatRand(Number(comp.sales_price))}</td>
                    <td className="px-4 py-3 font-dm-sans text-gray-600">{formatRandPerM2(Number(comp.price_per_m2))}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={notes[comp.id] ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [comp.id]: e.target.value }))}
                        placeholder="Add note…"
                        className="w-full text-xs font-dm-sans border-b border-sage/30 bg-transparent focus:outline-none focus:border-bronze text-gray-600 placeholder-gray-300"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5 — Price indication panels */}
        <div>
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
                <p className="font-dm-sans text-cream/60 text-xs mt-2">@ {formatRandPerM2(ppm)} ERF</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6 — Recommended range + narrative */}
        <div className="bg-white border border-sage/20 rounded-lg p-6">
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
        <div className="text-center py-4 border-t border-sage/20">
          <p className="font-cormorant text-xs text-sage/70 tracking-wider">
            This report is prepared for informational purposes only and does not constitute a formal valuation. Data sourced from Lightstone.
          </p>
          <p className="font-cinzel text-xs text-olive/60 tracking-[0.15em] mt-1">
            HOME GROUND REAL ESTATE | homegroundestates.co.za | Ballito, KwaZulu-Natal North Coast
          </p>
        </div>
      </div>

      {/* PDF Download button */}
      <PDFDownloadButton cmaData={cmaData} />
    </main>
  );
}
