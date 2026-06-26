"use client";

export default function PDFDownloadButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50" data-no-print>
      <button
        onClick={() => setTimeout(() => window.print(), 500)}
        className="bg-bronze text-cream font-cinzel tracking-[0.15em] text-xs px-6 py-3 rounded shadow-lg hover:bg-bronze/90 transition-colors"
      >
        Download PDF
      </button>
    </div>
  );
}
