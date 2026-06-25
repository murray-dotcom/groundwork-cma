"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ESTATES = [
  "Simbithi Eco Estate",
  "Dunkirk Estate",
  "Ballito",
  "Black Rock",
  "Brettenwood Coastal Estate",
  "Compensation Beach",
  "Salt Rock",
  "Shakas Rock",
  "Thompsons Bay",
  "Umhlali Beach",
  "Willard Beach",
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
  const [form, setForm] = useState({
    address: "",
    estate: ESTATES[0],
    propertyType: "freehold" as "freehold" | "sectional_title",
    sectionalScheme: "",
    erfSize: "",
    builtArea: "",
    askingPrice: "",
    lookback: "24",
    tolerance: "0.30",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      address: form.address,
      estate: form.estate,
      propertyType: form.propertyType,
      sectionalScheme: form.sectionalScheme,
      erfSize: form.erfSize,
      builtArea: form.builtArea,
      askingPrice: form.askingPrice,
      lookback: form.lookback,
      tolerance: form.tolerance,
    });
    router.push(`/cma?${params.toString()}`);
  }

  const inputClass =
    "w-full border border-sage/40 rounded px-3 py-2 bg-white font-dm-sans text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-bronze/50";
  const labelClass = "block text-xs font-cormorant font-semibold tracking-widest uppercase text-olive mb-1";

  return (
    <main className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-sm border border-sage/20 overflow-hidden">
        {/* Header */}
        <div className="bg-olive px-8 py-6">
          <h1 className="font-cinzel text-cream text-xl tracking-[0.2em]">HOME GROUND</h1>
          <p className="font-cormorant text-cream/70 text-sm mt-1 tracking-wider">Comparable Market Analysis</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* Subject address */}
          <div>
            <label className={labelClass}>Subject Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. 31 Ladlau"
              required
              className={inputClass}
            />
          </div>

          {/* Estate */}
          <div>
            <label className={labelClass}>Estate</label>
            <select name="estate" value={form.estate} onChange={handleChange} className={inputClass}>
              {ESTATES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Property type */}
          <div>
            <label className={labelClass}>Property Type</label>
            <div className="flex gap-6 mt-1">
              {(["freehold", "sectional_title"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 font-dm-sans text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="propertyType"
                    value={type}
                    checked={form.propertyType === type}
                    onChange={handleChange}
                    className="accent-bronze"
                  />
                  {type === "freehold" ? "Freehold" : "Sectional Title"}
                </label>
              ))}
            </div>
          </div>

          {/* Sectional scheme — only if sectional title */}
          {form.propertyType === "sectional_title" && (
            <div>
              <label className={labelClass}>Sectional Scheme</label>
              <input
                name="sectionalScheme"
                value={form.sectionalScheme}
                onChange={handleChange}
                placeholder="Scheme name"
                className={inputClass}
              />
            </div>
          )}

          {/* ERF / Unit size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {form.propertyType === "sectional_title" ? "Unit Size m²" : "ERF Size m²"}
              </label>
              <input
                name="erfSize"
                type="number"
                value={form.erfSize}
                onChange={handleChange}
                placeholder="e.g. 850"
                required
                min="1"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Built Area m² <span className="normal-case font-normal">(optional)</span></label>
              <input
                name="builtArea"
                type="number"
                value={form.builtArea}
                onChange={handleChange}
                placeholder="e.g. 320"
                min="1"
                className={inputClass}
              />
            </div>
          </div>

          {/* Asking price */}
          <div>
            <label className={labelClass}>Asking Price R <span className="normal-case font-normal">(optional)</span></label>
            <input
              name="askingPrice"
              type="number"
              value={form.askingPrice}
              onChange={handleChange}
              placeholder="e.g. 4500000"
              min="1"
              className={inputClass}
            />
          </div>

          {/* Lookback + tolerance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Lookback Period</label>
              <select name="lookback" value={form.lookback} onChange={handleChange} className={inputClass}>
                {LOOKBACK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Size Tolerance</label>
              <select name="tolerance" value={form.tolerance} onChange={handleChange} className={inputClass}>
                {TOLERANCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-bronze text-cream font-cinzel tracking-[0.15em] text-sm py-3 rounded hover:bg-bronze/90 transition-colors mt-2"
          >
            Generate CMA
          </button>
        </form>
      </div>
    </main>
  );
}
