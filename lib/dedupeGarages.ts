interface HasDeedSize {
  title_deed_no?: string | null;
  size_m2?: number | null;
}

export function dedupeGarages<T extends HasDeedSize>(transactions: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const t of transactions) {
    const key = t.title_deed_no ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const result: T[] = [];
  for (const group of Array.from(groups.values())) {
    const largest = group.reduce((a, b) =>
      (a.size_m2 ?? 0) >= (b.size_m2 ?? 0) ? a : b
    );
    result.push(largest);
  }
  return result;
}
