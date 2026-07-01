import type { Listing } from "@/lib/getListings";

interface ActiveListingsPanelProps {
  listings: Listing[];
  estateLabel: string;
}

function formatRand(n: number) {
  return `R ${Math.round(n).toLocaleString("en-ZA")}`;
}

function formatRandPerM2(n: number) {
  return `R ${Math.round(n).toLocaleString("en-ZA")}/m²`;
}

function daysAgo(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
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

export default function ActiveListingsPanel({ listings, estateLabel }: ActiveListingsPanelProps) {
  return (
    <div className="cma-section bg-white border border-sage/20 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-sage/20">
        <h2 className="font-cinzel text-xs tracking-[0.2em] text-olive uppercase">
          Active Listings — {estateLabel}
        </h2>
      </div>

      {listings.length === 0 ? (
        <div className="px-6 py-5">
          <p className="font-cormorant text-sm text-sage/70 italic">
            No active listings currently found in this area.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/60">
                {["Address", "Beds", "Baths", "Asking Price", "R/m²", "Days Listed", "Source", ""].map((h, i) => (
                  <th
                    key={i}
                    className="font-cormorant text-xs tracking-wider uppercase px-4 py-3 text-left font-medium text-olive"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((listing, i) => {
                const days = daysAgo(listing.first_seen_at);
                const ratePerM2 =
                  listing.price_per_m2 && listing.price_per_m2 > 0
                    ? listing.price_per_m2
                    : listing.asking_price && listing.erf_size_m2 && listing.erf_size_m2 > 0
                    ? Math.round(listing.asking_price / listing.erf_size_m2)
                    : null;
                return (
                  <tr
                    key={listing.id}
                    className={`comp-row ${i % 2 === 0 ? "bg-cream/20" : "bg-white"}`}
                  >
                    <td className="px-4 py-3 font-dm-sans text-gray-800">{listing.address}</td>
                    <td className="px-4 py-3 font-dm-sans text-gray-600 text-center">
                      {listing.bedrooms ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-dm-sans text-gray-600 text-center">
                      {listing.bathrooms ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-dm-sans text-gray-800 font-medium whitespace-nowrap">
                      {listing.asking_price ? formatRand(listing.asking_price) : "—"}
                      {listing.status === "price_reduced" && (
                        <span className="ml-1.5 text-[10px] font-dm-sans text-sage bg-sage/10 px-1.5 py-0.5 rounded">
                          Price Reduced
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-dm-sans text-gray-500 text-xs">
                      {ratePerM2 ? formatRandPerM2(ratePerM2) : "—"}
                    </td>
                    <td className="px-4 py-3 font-dm-sans text-gray-500 text-xs">
                      {days != null ? `${days}d` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source={listing.source} />
                    </td>
                    <td className="px-4 py-3" data-no-print>
                      {listing.source_url ? (
                        <a
                          href={listing.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-cormorant text-xs text-bronze hover:text-olive transition-colors"
                        >
                          View ↗
                        </a>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
