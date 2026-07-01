import { supabase } from "./supabase";

export interface Listing {
  id: string;
  source: string;
  source_url: string | null;
  listing_type: string;
  status: string;
  estate: string | null;
  heading: string | null;
  street: string | null;
  street_number: string | null;
  unit: string | null;
  sectional_scheme: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  erf_size_m2: number | null;
  floor_size_m2: number | null;
  asking_price: number | null;
  monthly_rental: number | null;
  price_per_m2: number | null;
  first_seen_at: string | null;
  address: string;
}

function buildAddress(row: Record<string, unknown>): string {
  if (row.unit && row.sectional_scheme) {
    const scheme = (row.sectional_scheme as string)
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `Unit ${row.unit}, ${scheme}`;
  }
  if (row.street_number || row.street) {
    return [row.street_number, row.street].filter(Boolean).join(" ").trim();
  }
  if (row.heading) {
    const h = row.heading as string;
    return h.charAt(0).toUpperCase() + h.slice(1).toLowerCase();
  }
  return (row.estate as string) ?? "";
}

const SELECT_FIELDS =
  "id, source, source_url, listing_type, status, estate, heading, street, street_number, unit, sectional_scheme, property_type, bedrooms, bathrooms, erf_size_m2, floor_size_m2, asking_price, monthly_rental, price_per_m2, first_seen_at";

function mapRow(row: Record<string, unknown>): Listing {
  return {
    id: row.id as string,
    source: row.source as string,
    source_url: (row.source_url as string | null) ?? null,
    listing_type: row.listing_type as string,
    status: row.status as string,
    estate: (row.estate as string | null) ?? null,
    heading: (row.heading as string | null) ?? null,
    street: (row.street as string | null) ?? null,
    street_number: (row.street_number as string | null) ?? null,
    unit: (row.unit as string | null) ?? null,
    sectional_scheme: (row.sectional_scheme as string | null) ?? null,
    property_type: (row.property_type as string | null) ?? null,
    bedrooms: row.bedrooms != null ? Number(row.bedrooms) : null,
    bathrooms: row.bathrooms != null ? Number(row.bathrooms) : null,
    erf_size_m2: row.erf_size_m2 != null ? Number(row.erf_size_m2) : null,
    floor_size_m2: row.floor_size_m2 != null ? Number(row.floor_size_m2) : null,
    asking_price: row.asking_price != null ? Number(row.asking_price) : null,
    monthly_rental: row.monthly_rental != null ? Number(row.monthly_rental) : null,
    price_per_m2: row.price_per_m2 != null ? Number(row.price_per_m2) : null,
    first_seen_at: (row.first_seen_at as string | null) ?? null,
    address: buildAddress(row),
  };
}

export async function getActiveListings(
  estates: string[],
  schemes: string[] | null,
  propertyType: string
): Promise<Listing[]> {
  let query = supabase
    .from("listings")
    .select(SELECT_FIELDS)
    .in("estate", estates)
    .eq("listing_type", "for_sale")
    .in("status", ["active", "price_reduced"])
    .eq("property_type", propertyType)
    .order("asking_price", { ascending: true })
    .limit(10);

  if (schemes && schemes.length > 0) {
    const orFilter = schemes.map((s) => `sectional_scheme.ilike.%${s}%`).join(",");
    query = query.or(orFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getActiveRentals(
  estates: string[],
  schemes: string[] | null,
  propertyType: string
): Promise<Listing[]> {
  let query = supabase
    .from("listings")
    .select(SELECT_FIELDS)
    .in("estate", estates)
    .eq("listing_type", "to_let")
    .in("status", ["active", "price_reduced"])
    .eq("property_type", propertyType)
    .order("monthly_rental", { ascending: true })
    .limit(10);

  if (schemes && schemes.length > 0) {
    const orFilter = schemes.map((s) => `sectional_scheme.ilike.%${s}%`).join(",");
    query = query.or(orFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}
