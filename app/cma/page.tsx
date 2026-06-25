import { getComps } from "@/lib/getComps";
import { getTrends } from "@/lib/getTrends";
import type { TrendPoint } from "@/lib/getTrends";
import CMADisplay from "./CMADisplay";
import Link from "next/link";

interface PageProps {
  searchParams: {
    address?: string;
    estate?: string;
    propertyType?: string;
    sectionalScheme?: string;
    erfSize?: string;
    builtArea?: string;
    askingPrice?: string;
    lookback?: string;
    tolerance?: string;
  };
}

export default async function CMAPage({ searchParams }: PageProps) {
  const address = searchParams.address ?? "";
  const estate = searchParams.estate ?? "Simbithi Eco Estate";
  const propertyType = (searchParams.propertyType ?? "freehold") as "freehold" | "sectional_title";
  const erfSize = Number(searchParams.erfSize ?? 0);
  const builtArea = searchParams.builtArea ? Number(searchParams.builtArea) : undefined;
  const askingPrice = searchParams.askingPrice ? Number(searchParams.askingPrice) : undefined;
  const lookback = Number(searchParams.lookback ?? 24);
  const tolerance = Number(searchParams.tolerance ?? 0.30);

  const params = {
    address,
    estate,
    propertyType,
    sectionalScheme: searchParams.sectionalScheme,
    erfSize,
    builtArea,
    askingPrice,
    lookback,
    tolerance,
  };

  let result;
  let trends: TrendPoint[] = [];
  let error: string | null = null;

  try {
    [result, trends] = await Promise.all([
      getComps({
        estate,
        propertyType,
        sectionalScheme: searchParams.sectionalScheme,
        erfSize,
        builtArea,
        lookback,
        tolerance,
      }),
      getTrends({
        estate,
        propertyType,
        sectionalScheme: searchParams.sectionalScheme,
      }).catch(() => [] as TrendPoint[]),
    ]);
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : "Failed to fetch comparable sales.";
  }

  if (error || !result) {
    return (
      <main className="min-h-screen bg-off-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="font-cormorant text-lg text-olive mb-4">{error ?? "An unexpected error occurred."}</p>
          <Link href="/" className="font-cinzel text-xs tracking-widest text-bronze underline">← Back to form</Link>
        </div>
      </main>
    );
  }

  if (result.comps.length === 0) {
    return (
      <main className="min-h-screen bg-off-white flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white border border-sage/20 rounded-lg p-8">
          <div className="font-cinzel text-olive text-sm tracking-widest mb-4">HOME GROUND</div>
          <p className="font-cormorant text-lg text-gray-700 mb-2">No comparable sales found in the selected period.</p>
          <p className="font-cormorant text-sm text-sage mb-6">Try extending the lookback period or size tolerance.</p>
          <Link
            href={`/?${new URLSearchParams({ address, estate, propertyType, erfSize: String(erfSize) }).toString()}`}
            className="bg-bronze text-cream font-cinzel tracking-[0.15em] text-xs px-6 py-3 rounded hover:bg-bronze/90 transition-colors"
          >
            Adjust Parameters
          </Link>
        </div>
      </main>
    );
  }

  return <CMADisplay params={params} result={result} trends={trends} />;
}
