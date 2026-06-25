interface HasDeedSizePriceDate {
  title_deed_no?: string | null;
  size_m2?: number | null;
  sales_price?: number | null;
  registration_date?: string | null;
}

export function dedupeGarages<T extends HasDeedSizePriceDate>(transactions: T[]): T[] {
  // Pass 1: group by title_deed_no — handles apartment + garage sharing the same deed
  const pass1Groups = new Map<string, T[]>();
  for (const t of transactions) {
    const key = t.title_deed_no ?? "";
    if (!pass1Groups.has(key)) pass1Groups.set(key, []);
    pass1Groups.get(key)!.push(t);
  }
  const pass1: T[] = [];
  for (const group of Array.from(pass1Groups.values())) {
    pass1.push(group.reduce((a, b) => Number(a.size_m2 ?? 0) >= Number(b.size_m2 ?? 0) ? a : b));
  }

  // Pass 2: group by sales_price + registration_date — handles apartment + garage
  // transferred together at the same price with different deed numbers
  const pass2Groups = new Map<string, T[]>();
  for (const t of pass1) {
    const price = Math.round(Number(t.sales_price ?? 0));
    const key = price > 0
      ? `${price}__${t.registration_date ?? ""}`
      : `unique__${t.title_deed_no ?? ""}__${t.registration_date ?? ""}`;
    if (!pass2Groups.has(key)) pass2Groups.set(key, []);
    pass2Groups.get(key)!.push(t);
  }
  const result: T[] = [];
  for (const group of Array.from(pass2Groups.values())) {
    result.push(group.reduce((a, b) => Number(a.size_m2 ?? 0) >= Number(b.size_m2 ?? 0) ? a : b));
  }
  return result;
}
