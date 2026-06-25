import { supabase } from "./supabase";

export interface CMAParams {
  estates: string[];
  propertyType: "freehold" | "sectional_title";
  schemes?: string[];
  erfSize: number;
  builtArea?: number;
  lookback: number;
  tolerance: number;
}

export interface Transaction {
  id: string;
  address: string;
  street_number?: string;
  street?: string;
  title_deed_no?: string;
  estate: string;
  property_type: string;
  sectional_scheme?: string;
  size_m2: number;
  built_area_m2?: number;
  sales_price: number;
  price_per_m2: number;
  registration_date: string;
  is_market_sale: boolean;
  note?: string;
}

export interface OutlierBounds {
  lower: number;
  upper: number;
}

export interface CompsResult {
  comps: Transaction[];
  p25PricePerM2: number;
  medianPricePerM2: number;
  p75PricePerM2: number;
  conservativePrice: number;
  midMarketPrice: number;
  strongPrice: number;
  outlierBounds: OutlierBounds;
}

function calculateOutlierBounds(salePrices: number[]): OutlierBounds {
  if (salePrices.length < 2) return { lower: 0, upper: Infinity };
  const sorted = [...salePrices].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  return { lower: q1 - 1.5 * iqr, upper: q3 + 1.5 * iqr };
}

function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const idx = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedArr[lower];
  return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (idx - lower);
}

export async function getComps(params: CMAParams): Promise<CompsResult> {
  const { estates, propertyType, schemes, erfSize, lookback, tolerance } = params;
  const sizeMin = Math.floor(erfSize * (1 - tolerance));
  const sizeMax = Math.ceil(erfSize * (1 + tolerance));
  // Equivalent to Postgres: current_date - interval '${lookback} months'
  const now = new Date();
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - lookback, now.getUTCDate()));
  const cutoffDateStr = cutoff.toISOString().split("T")[0];

  console.log("[getComps] query params:", {
    estates,
    property_type: propertyType,
    schemes: schemes ?? null,
    sizeMin,
    sizeMax,
    cutoffDate: cutoffDateStr,
    lookback,
    tolerance,
  });

  let query = supabase
    .from("transactions")
    .select("*")
    .in("estate", estates)
    .eq("property_type", propertyType)
    .eq("is_market_sale", true)
    .gte("registration_date", cutoffDateStr)
    .order("registration_date", { ascending: false })
    .limit(12);

  // For freehold, size_m2 is the ERF so we can filter by it.
  // For sectional title, size_m2 is the participation quota (often very
  // different from the ERF size the broker enters), so skip the size
  // filter — the scheme names via ILIKE already narrow the result set.
  if (propertyType === "freehold") {
    query = query.gte("size_m2", sizeMin).lte("size_m2", sizeMax);
  }

  if (propertyType === "sectional_title" && schemes && schemes.length > 0) {
    const orFilter = schemes.map((s) => `sectional_scheme.ilike.%${s}%`).join(",");
    query = query.or(orFilter);
  }

  const { data, error } = await query;

  console.log("[getComps] raw response:", {
    count: data?.length ?? 0,
    error: error?.message ?? null,
    sample: data?.[0] ?? null,
  });
  if (error) throw new Error(error.message);

  const comps: Transaction[] = (data ?? []).map((row) => ({
    ...row,
    address:
      [row.street_number, row.street].filter(Boolean).join(" ").trim() ||
      row.title_deed_no ||
      "",
    sales_price: Number(row.sales_price),
    price_per_m2: Number(row.price_per_m2),
  }));

  // Price indications: percentiles of actual comp sale prices.
  // ERF-based price_per_m2 from Lightstone is not suitable for
  // built-area multiplication, so we derive values directly from
  // the distribution of comparable sale prices.
  const salePrices = comps
    .map((c) => c.sales_price)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  const conservativePrice = percentile(salePrices, 25);
  const midMarketPrice = percentile(salePrices, 50);
  const strongPrice = percentile(salePrices, 75);

  // ERF-based R/m² kept for reference labels on the panels only.
  const erfPricesPerM2 = comps
    .map((c) => c.price_per_m2)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  const p25PricePerM2 = percentile(erfPricesPerM2, 25);
  const medianPricePerM2 = percentile(erfPricesPerM2, 50);
  const p75PricePerM2 = percentile(erfPricesPerM2, 75);

  const outlierBounds = calculateOutlierBounds(salePrices);

  return {
    comps,
    p25PricePerM2,
    medianPricePerM2,
    p75PricePerM2,
    conservativePrice,
    midMarketPrice,
    strongPrice,
    outlierBounds,
  };
}
