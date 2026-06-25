"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export interface EnrichmentData {
  built_area_m2?: number;
  sea_view?: boolean;
  view_rating?: number;
  dwelling_type?: string;
  condition_rating?: number;
  enrichment_notes?: string;
}

interface EnrichmentPanelProps {
  titleDeedNo: string;
  estate: string;
  initial: EnrichmentData;
  onSaved: (data: EnrichmentData) => void;
  onClose: () => void;
}

const DWELLING_TYPES = [
  { value: "house", label: "House" },
  { value: "townhouse", label: "Townhouse" },
  { value: "apartment", label: "Apartment" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "simplex", label: "Simplex" },
  { value: "vacant_land", label: "Vacant Land" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className={`text-lg leading-none transition-colors ${
            s <= (hover || value) ? "text-bronze" : "text-sage/30"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function EnrichmentPanel({ titleDeedNo, estate, initial, onSaved, onClose }: EnrichmentPanelProps) {
  const [builtArea, setBuiltArea] = useState(initial.built_area_m2?.toString() ?? "");
  const [seaView, setSeaView] = useState(initial.sea_view ?? false);
  const [viewRating, setViewRating] = useState(initial.view_rating ?? 0);
  const [dwellingType, setDwellingType] = useState(initial.dwelling_type ?? "");
  const [conditionRating, setConditionRating] = useState(initial.condition_rating ?? 0);
  const [notes, setNotes] = useState(initial.enrichment_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = {
      title_deed_no: titleDeedNo,
      estate,
    };
    if (builtArea !== "") payload.built_area_m2 = Number(builtArea);
    payload.sea_view = seaView;
    if (viewRating > 0) payload.view_rating = viewRating;
    if (dwellingType) payload.property_detail_type = dwellingType.toLowerCase();
    if (conditionRating > 0) payload.condition_rating = conditionRating;
    if (notes) payload.notes = notes;

    const { error: err } = await supabase
      .from("property_attributes")
      .upsert(payload, { onConflict: "title_deed_no,estate" });

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }

    const enrichmentData: EnrichmentData = {
      built_area_m2: builtArea !== "" ? Number(builtArea) : undefined,
      sea_view: seaView,
      view_rating: viewRating > 0 ? viewRating : undefined,
      dwelling_type: dwellingType || undefined,
      condition_rating: conditionRating > 0 ? conditionRating : undefined,
      enrichment_notes: notes || undefined,
    };

    onSaved(enrichmentData);
    setSaved(true);
    setTimeout(onClose, 800);
  }

  const labelClass = "block text-xs font-cormorant font-semibold tracking-widest uppercase text-olive mb-1";
  const inputClass = "w-full border border-sage/40 rounded px-3 py-2 bg-white font-dm-sans text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-bronze/50";

  return (
    <div className="bg-cream/60 border-t border-sage/20 p-5">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <p className="font-cinzel text-xs tracking-[0.15em] text-olive uppercase">Enrich Comparable</p>
          <button onClick={onClose} className="text-sage/60 hover:text-sage text-lg leading-none">×</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Built Area m²</label>
            <input
              type="number"
              value={builtArea}
              onChange={(e) => setBuiltArea(e.target.value)}
              placeholder="e.g. 320"
              min="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Dwelling Type</label>
            <select value={dwellingType} onChange={(e) => setDwellingType(e.target.value)} className={inputClass}>
              <option value="">— select —</option>
              {DWELLING_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>View Rating</label>
            <StarRating value={viewRating} onChange={setViewRating} />
          </div>
          <div>
            <label className={labelClass}>Condition Rating</label>
            <StarRating value={conditionRating} onChange={setConditionRating} />
          </div>
        </div>

        <div className="mb-4">
          <label className={labelClass}>
            Sea View
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-dm-sans text-sm text-gray-700">
            <input
              type="checkbox"
              checked={seaView}
              onChange={(e) => setSeaView(e.target.checked)}
              className="accent-bronze w-4 h-4"
            />
            Yes, sea view
          </label>
        </div>

        <div className="mb-4">
          <label className={labelClass}>Notes <span className="normal-case font-normal text-sage/60">({200 - notes.length} chars left)</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 200))}
            placeholder="Additional notes about this comparable…"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && <p className="font-dm-sans text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="bg-bronze text-cream font-cinzel tracking-[0.12em] text-xs px-5 py-2 rounded hover:bg-bronze/90 transition-colors disabled:opacity-60"
          >
            {saved ? "Saved ✓" : saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onClose}
            className="font-cormorant text-sm text-sage hover:text-olive transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
