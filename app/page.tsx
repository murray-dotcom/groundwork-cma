"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ESTATES = [
  "Simbithi Eco Estate",
  "Dunkirk Estate",
  "Ballito",
  "Black Rock",
  "Brettenwood Coastal Estate",
  "Compensation Beach",
  "Elaleni Coastal Estate",
  "Salt Rock",
  "Shakas Rock",
  "Thompsons Bay",
  "Umhlali Beach",
  "Willard Beach",
  "Zululami Luxury Coastal Estate",
];

const LOOKBACK_OPTIONS = [
  { label: "12 months", value: "12" },
  { label: "24 months", value: "24" },
  { label: "36 months", value: "36" },
];
const TOLERANCE_OPTIONS = [
  { label: "±20%", value: "0.20" },
  { label: "±30%", value: "0.30" },
  { label: "±40%", value: "0.40" },
];

export default function Home() {
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [selectedEstates, setSelectedEstates] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState<"freehold" | "sectional_title">("freehold");
  const [schemeSearch, setSchemeSearch] = useState("");
  const [availableSchemes, setAvailableSchemes] = useState<string[]>([]);
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>([]);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [erfSize, setErfSize] = useState("");
  const [builtArea, setBuiltArea] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [lookback, setLookback] = useState("24");
  const [tolerance, setTolerance] = useState("0.30");

  // Fetch distinct schemes whenever estates or property type change
  useEffect(() => {
    if (propertyType !== "sectional_title" || selectedEstates.length === 0) {
      setAvailableSchemes([]);
      setSelectedSchemes([]);
      return;
    }
    setSchemesLoading(true);
    supabase
      .from("transactions")
      .select("sectional_scheme")
      .in("estate", selectedEstates)
      .eq("property_type", "sectional_title")
      .eq("is_market_sale", true)
      .not("sectional_scheme", "is", null)
      .then(({ data }) => {
        const seen = new Set<string>();
        const unique: string[] = [];
        for (const r of data ?? []) {
          const s: string = r.sectional_scheme;
          if (s && !seen.has(s)) { seen.add(s); unique.push(s); }
        }
        unique.sort();
        setAvailableSchemes(unique);
        setSchemesLoading(false);
      });
  }, [selectedEstates, propertyType]);

  function toggleEstate(estate: string) {
    setSelectedEstates((prev) =>
      prev.includes(estate) ? prev.filter((e) => e !== estate) : [...prev, estate]
    );
    setSelectedSchemes([]);
  }

  function toggleScheme(scheme: string) {
    setSelectedSchemes((prev) =>
      prev.includes(scheme) ? prev.filter((s) => s !== scheme) : [...prev, scheme]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("address", address);
    params.set("propertyType", propertyType);
    params.set("erfSize", erfSize);
    params.set("builtArea", builtArea);
    params.set("askingPrice", askingPrice);
    params.set("lookback", lookback);
    params.set("tolerance", tolerance);
    params.set("estates", selectedEstates.join(","));
    if (propertyType === "sectional_title" && selectedSchemes.length > 0) {
      params.set("schemes", selectedSchemes.join(","));
    }
    router.push(`/cma?${params.toString()}`);
  }

  const filteredSchemes = availableSchemes.filter((s) =>
    s.toLowerCase().includes(schemeSearch.toLowerCase())
  );

  const inputClass =
    "w-full border border-sage/40 rounded px-3 py-2 bg-white font-dm-sans text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-bronze/50";
  const labelClass =
    "block text-xs font-cormorant font-semibold tracking-widest uppercase text-olive mb-1";
  const checkboxLabelClass =
    "flex items-center gap-2 font-dm-sans text-sm text-gray-700 cursor-pointer hover:text-olive";

  return (
    <main className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-sm border border-sage/20 overflow-hidden">
        {/* Header */}
        <div className="bg-olive px-8 py-6">
          <h1 className="font-cinzel text-cream text-xl tracking-[0.2em]">HOME GROUND</h1>
          <p className="font-cormorant text-cream/70 text-sm mt-1 tracking-wider">
            Comparable Market Analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* Subject address */}
          <div>
            <label className={labelClass}>Subject Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 31 Ladlau"
              required
              className={inputClass}
            />
          </div>

          {/* Estate multi-select */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className={labelClass}>Estate</label>
              {selectedEstates.length > 0 && (
                <span className="font-dm-sans text-xs text-sage">
                  {selectedEstates.length} selected
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-sage/20 rounded p-3 bg-off-white max-h-52 overflow-y-auto">
              {ESTATES.map((estate) => (
                <label key={estate} className={checkboxLabelClass}>
                  <input
                    type="checkbox"
                    checked={selectedEstates.includes(estate)}
                    onChange={() => toggleEstate(estate)}
                    className="accent-sage w-3.5 h-3.5 shrink-0"
                  />
                  <span className="text-xs leading-snug">{estate}</span>
                </label>
              ))}
            </div>
            {selectedEstates.length === 0 && (
              <p className="font-cormorant text-xs text-sage/70 mt-1 italic">
                Select at least one estate
              </p>
            )}
          </div>

          {/* Property type */}
          <div>
            <label className={labelClass}>Property Type</label>
            <div className="flex gap-6 mt-1">
              {(["freehold", "sectional_title"] as const).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 font-dm-sans text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name="propertyType"
                    value={type}
                    checked={propertyType === type}
                    onChange={() => {
                      setPropertyType(type);
                      setSelectedSchemes([]);
                    }}
                    className="accent-bronze"
                  />
                  {type === "freehold" ? "Freehold" : "Sectional Title"}
                </label>
              ))}
            </div>
          </div>

          {/* Sectional scheme multi-select */}
          {propertyType === "sectional_title" && (
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className={labelClass}>Sectional Scheme</label>
                {selectedSchemes.length > 0 && (
                  <span className="font-dm-sans text-xs text-sage">
                    {selectedSchemes.length} scheme{selectedSchemes.length === 1 ? "" : "s"} selected
                  </span>
                )}
              </div>
              {selectedEstates.length === 0 ? (
                <p className="font-cormorant text-xs text-sage/70 italic">
                  Select an estate first
                </p>
              ) : schemesLoading ? (
                <div className="h-8 bg-sage/10 rounded animate-pulse" />
              ) : availableSchemes.length === 0 ? (
                <p className="font-cormorant text-xs text-sage/70 italic">
                  No sectional title schemes found for selected estate(s)
                </p>
              ) : (
                <>
                  <input
                    value={schemeSearch}
                    onChange={(e) => setSchemeSearch(e.target.value)}
                    placeholder="Filter schemes…"
                    className={`${inputClass} mb-2 text-xs`}
                  />
                  <div className="grid grid-cols-1 gap-1.5 border border-sage/20 rounded p-3 bg-off-white max-h-44 overflow-y-auto">
                    {filteredSchemes.length === 0 ? (
                      <p className="font-cormorant text-xs text-sage/60 italic">No matches</p>
                    ) : (
                      filteredSchemes.map((scheme) => (
                        <label key={scheme} className={checkboxLabelClass}>
                          <input
                            type="checkbox"
                            checked={selectedSchemes.includes(scheme)}
                            onChange={() => toggleScheme(scheme)}
                            className="accent-sage w-3.5 h-3.5 shrink-0"
                          />
                          <span className="text-xs leading-snug">{scheme}</span>
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ERF / Unit size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {propertyType === "sectional_title" ? "Unit Size m²" : "ERF Size m²"}
              </label>
              <input
                type="number"
                value={erfSize}
                onChange={(e) => setErfSize(e.target.value)}
                placeholder="e.g. 850"
                required
                min="1"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Built Area m²{" "}
                <span className="normal-case font-normal">(optional)</span>
              </label>
              <input
                type="number"
                value={builtArea}
                onChange={(e) => setBuiltArea(e.target.value)}
                placeholder="e.g. 320"
                min="1"
                className={inputClass}
              />
            </div>
          </div>

          {/* Asking price */}
          <div>
            <label className={labelClass}>
              Asking Price R{" "}
              <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="number"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              placeholder="e.g. 4500000"
              min="1"
              className={inputClass}
            />
          </div>

          {/* Lookback + tolerance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Lookback Period</label>
              <select
                value={lookback}
                onChange={(e) => setLookback(e.target.value)}
                className={inputClass}
              >
                {LOOKBACK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Size Tolerance</label>
              <select
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className={inputClass}
              >
                {TOLERANCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={selectedEstates.length === 0}
            className="w-full bg-bronze text-cream font-cinzel tracking-[0.15em] text-sm py-3 rounded hover:bg-bronze/90 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate CMA
          </button>
        </form>
      </div>
    </main>
  );
}
