import { supabase } from "./supabase";

export interface CMAParams {
  estate: string;
  propertyType: "freehold" | "sectional_title";
  sectionalScheme?: string;
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
  sale_price: number;
  price_per_m2: number;
  registration_date: string;
  is_market_sale: boolean;
  note?: string;
}

export interface CompsResult {
  comps: Transaction[];
  p25PricePerM2: number;
  medianPricePerM2: number;
  p75PricePerM2: number;
  conservativePrice: number;
  midMarketPrice: number;
  strongPrice: number;
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
  const { estate, propertyType, sectionalScheme, erfSize, builtArea, lookback, tolerance } = params;
  const sizeMin = Math.floor(erfSize * (1 - tolerance));
  const sizeMax = Math.ceil(erfSize * (1 + tolerance));
  // Equivalent to Postgres: current_date - interval '${lookback} months'
  const now = new Date();
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - lookback, now.getUTCDate()));
  const cutoffDateStr = cutoff.toISOString().split("T")[0];

  let query = supabase
    .from("transactions")
    .select("*")
    .eq("estate", estate)
    .eq("property_type", propertyType)
    .eq("is_market_sale", true)
    .gte("registration_date", cutoffDateStr)
    .gte("size_m2", sizeMin)
    .lte("size_m2", sizeMax)
    .order("registration_date", { ascending: false })
    .limit(12);

  if (propertyType === "sectional_title" && sectionalScheme) {
    query = query.eq("sectional_scheme", sectionalScheme);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const comps: Transaction[] = (data ?? []).map((row) => ({
    ...row,
    address:
      [row.street_number, row.street].filter(Boolean).join(" ").trim() ||
      row.title_deed_no ||
      "",
    sale_price: Number(row.sale_price),
    price_per_m2: Number(row.price_per_m2),
  }));
  const prices = comps
    .map((c) => c.price_per_m2)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  const p25 = percentile(prices, 25);
  const median = percentile(prices, 50);
  const p75 = percentile(prices, 75);

  const refArea = builtArea ?? erfSize;

  return {
    comps,
    p25PricePerM2: p25,
    medianPricePerM2: median,
    p75PricePerM2: p75,
    conservativePrice: refArea * p25,
    midMarketPrice: refArea * median,
    strongPrice: refArea * p75,
  };
}
