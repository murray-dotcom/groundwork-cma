import { supabase } from "./supabase";

export interface TrendPoint {
  quarter: string;   // e.g. "Q1 2024"
  median_price: number;
  count: number;
}

function quarterLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `Q${q} ${d.getUTCFullYear()}`;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface TrendParams {
  estates: string[];
  propertyType: "freehold" | "sectional_title";
  schemes?: string[];
}

export async function getTrends(params: TrendParams): Promise<TrendPoint[]> {
  const { estates, propertyType, schemes } = params;

  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 3);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  let query = supabase
    .from("transactions")
    .select("registration_date, sales_price")
    .in("estate", estates)
    .eq("property_type", propertyType)
    .eq("is_market_sale", true)
    .gte("registration_date", cutoffStr)
    .order("registration_date", { ascending: true });

  if (propertyType === "sectional_title" && schemes && schemes.length > 0) {
    const orFilter = schemes.map((s) => `sectional_scheme.ilike.%${s}%`).join(",");
    query = query.or(orFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Group by quarter client-side
  const groups = new Map<string, number[]>();
  for (const row of data ?? []) {
    const price = Number(row.sales_price);
    if (!price || price <= 0) continue;
    const label = quarterLabel(row.registration_date);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(price);
  }

  // Sort quarters chronologically, filter to ≥ 2 sales
  const sorted = Array.from(groups.entries())
    .filter(([, prices]) => prices.length >= 2)
    .sort(([a], [b]) => {
      // Parse "Q1 2024" -> sortable number
      const parse = (s: string) => {
        const [q, y] = s.split(" ");
        return Number(y) * 10 + Number(q.slice(1));
      };
      return parse(a) - parse(b);
    })
    .map(([quarter, prices]) => ({
      quarter,
      median_price: median([...prices].sort((a, b) => a - b)),
      count: prices.length,
    }));

  return sorted;
}
