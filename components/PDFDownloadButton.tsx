"use client";

import { useState, useEffect } from "react";

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) return null;

  async function handleDownload() {
    setLoading(true);
    try {
      const [{ pdf }, { default: CMADocument }, { saveAs }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./CMADocument"),
        import("file-saver"),
      ]);
      const blob = await pdf(<CMADocument cmaData={cmaData} />).toBlob();
      const date = new Date().toISOString().split("T")[0];
      const filename = `${cmaData.params.address.replace(/\s+/g, "_")}_CMA_${date}.pdf`;
      saveAs(blob, filename);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="fixed bottom-6 right-6 bg-bronze text-cream font-cinzel tracking-[0.15em] text-xs px-6 py-3 rounded shadow-lg hover:bg-bronze/90 transition-colors disabled:opacity-60 z-50"
    >
      {loading ? "Generating PDF…" : "Download PDF"}
    </button>
  );
}
