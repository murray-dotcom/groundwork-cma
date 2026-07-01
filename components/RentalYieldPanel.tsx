import type { Listing } from "@/lib/getListings";

interface RentalYieldPanelProps {
  rentals: Listing[];
  midMarketPrice: number;
  estateLabel: string;
}

function formatRand(n: number) {
  return `R ${Math.round(n).toLocaleString("en-ZA")}`;
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function SourceBadge({ source }: { source: string }) {
  if (source === "property24")
    return (
      <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-dm-sans font-semibold px-1.5 py-0.5 rounded">
        P24
      </span>
    );
  if (source === "private_property")
    return (
      <span className="inline-block bg-sage/10 text-sage border border-sage/20 text-[10px] font-dm-sans font-semibold px-1.5 py-0.5 rounded">
        PP
      </span>
    );
  return (
    <span className="inline-block bg-gray-100 text-gray-500 text-[10px] font-dm-sans font-semibold px-1.5 py-0.5 rounded">
      —
    </span>
  );
}

export default function RentalYieldPanel({ rentals, midMarketPrice, estateLabel }: RentalYieldPanelProps) {
  const validRentals = rentals.filter((r) => r.monthly_rental != null && r.monthly_rental > 0);
  const medianMonthly =
    validRentals.length > 0 ? medianOf(validRentals.map((r) => r.monthly_rental!)) : null;
  const grossYield =
    medianMonthly != null && midMarketPrice > 0
      ? ((medianMonthly * 12) / midMarketPrice) * 100
      : null;

  const displayRentals = validRentals.slice(0, 3);

  return (
    <div className="cma-section bg-white border border-sage/20 rounded-lg p-6">
      <h2 className="font-cinzel text-xs tracking-[0.2em] text-olive uppercase mb-4">
        Rental Yield Estimate — {estateLabel}
      </h2>

      {validRentals.length === 0 ? (
        <p className="font-cormorant text-sm text-sage/70 italic">
          No active rental listings found for yield calculation.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-10 mb-5">
            <div>
              <p className="font-cormorant text-xs uppercase tracking-widest text-sage mb-1">
                Median Monthly Rental
              </p>
              <p className="font-cinzel text-2xl" style={{ color: "#B47A05" }}>
                {formatRand(medianMonthly!)}
              </p>
            </div>
            {grossYield != null && (
              <div>
                <p className="font-cormorant text-xs uppercase tracking-widest text-sage mb-1">
                  Est. Gross Yield
                </p>
                <p className="font-cinzel text-2xl text-olive">{grossYield.toFixed(1)}%</p>
              </div>
            )}
          </div>

          {displayRentals.length > 0 && (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/60">
                    {["Address", "Beds", "Monthly Rental", "Source"].map((h, i) => (
                      <th
                        key={i}
                        className="font-cormorant text-xs tracking-wider uppercase px-3 py-2 text-left font-medium text-olive"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRentals.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? "bg-cream/20" : "bg-white"}>
                      <td className="px-3 py-2 font-dm-sans text-gray-800 text-xs">
                        {r.source_url ? (
                          <a
                            href={r.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-bronze transition-colors"
                          >
                            {r.address}
                          </a>
                        ) : (
                          r.address
                        )}
                      </td>
                      <td className="px-3 py-2 font-dm-sans text-gray-600 text-xs text-center">
                        {r.bedrooms ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-dm-sans text-gray-800 text-xs font-medium">
                        {formatRand(r.monthly_rental!)} / month
                      </td>
                      <td className="px-3 py-2">
                        <SourceBadge source={r.source} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <p className="font-cormorant text-xs italic text-sage/60 leading-relaxed mt-2">
        Gross yield estimate based on active rental listings and current market price indication.
        Actual yields depend on occupancy, expenses, and management costs.
      </p>
    </div>
  );
}
