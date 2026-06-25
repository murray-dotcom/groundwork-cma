"use client";

import { useState } from "react";

interface PDFDownloadButtonProps {
  cmaData: {
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
    result: {
      comps: Array<{
        id: string;
        address: string;
        size_m2: number;
        built_area_m2?: number;
        sales_price: number;
        price_per_m2: number;
        registration_date: string;
      }>;
      p25PricePerM2: number;
      medianPricePerM2: number;
      p75PricePerM2: number;
      conservativePrice: number;
      midMarketPrice: number;
      strongPrice: number;
    };
    notes: Record<string, string>;
    narrative: string;
    today: string;
  };
}

export default function PDFDownloadButton({ cmaData }: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmaData),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const address = cmaData.params.address.replace(/\s+/g, "_");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `${address}_CMA_${date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("PDF generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
      {error && (
        <p className="font-dm-sans text-xs text-red-600 bg-white border border-red-200 rounded px-3 py-1.5 shadow">
          {error}
        </p>
      )}
      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-bronze text-cream font-cinzel tracking-[0.15em] text-xs px-6 py-3 rounded shadow-lg hover:bg-bronze/90 transition-colors disabled:opacity-60 flex items-center gap-2"
      >
        {loading && (
          <span className="inline-block w-3 h-3 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
        )}
        {loading ? "Generating PDF…" : "Download PDF"}
      </button>
    </div>
  );
}
