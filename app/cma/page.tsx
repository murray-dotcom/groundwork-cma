import { getComps } from "@/lib/getComps";
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

  const params = { address, estate, propertyType, sectionalScheme: searchParams.sectionalScheme, erfSize, builtArea, askingPrice, lookback, tolerance };

  let result;
  let error: string | null = null;

  try {
    result = await getComps({
      estate,
      propertyType,
      sectionalScheme: searchParams.sectionalScheme,
      erfSize,
      builtArea,
      lookback,
      tolerance,
    });
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : "Failed to fetch comparable sales.";
  }

  if (error || !result) {
    return (
      <main className="min-h-screen bg-off-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="font-cormorant text-lg text-olive mb-4">{error ?? "An unexpected error occurred."}</p>
          <Link href="/" className="font-cinzel text-xs tracking-widest text-bronze underline">← Back to form</Link>
        </div>
      </main>
    );
  }

  return <CMADisplay params={params} result={result} />;
}
