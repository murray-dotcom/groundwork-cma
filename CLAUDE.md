# Groundwork CMA — Claude Code Guide

Internal comparable market analysis tool for Home Ground Real Estate brokers.
Live at: https://groundwork-cma.netlify.app

---

## Stack

- **Next.js 14** App Router (TypeScript)
- **Tailwind CSS** — custom brand colours via `tailwind.config.ts`
- **Supabase** (`@supabase/supabase-js`) — property intelligence DB
- **Recharts** — dual-line quarterly trend chart
- **Anthropic API** (`claude-sonnet-4-6`) — AI narrative at `/api/narrative`
- **Browser print** — PDF via `window.print()`, no react-pdf

---

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | CMA input form (estate, property type, ERF size, lookback, tolerance) |
| `app/cma/CMADisplay.tsx` | Results screen — comps table, trend chart, price panels, narrative |
| `lib/getComps.ts` | Fetches transactions from Supabase, deduplicates, fetches enrichment |
| `lib/getTrends.ts` | Fetches quarterly trend data (always 36-month lookback) |
| `lib/dedupeGarages.ts` | Two-pass garage deduplication utility |
| `components/EnrichmentPanel.tsx` | Per-comp enrichment drawer (built area, specs, ratings) |
| `components/TrendChart.tsx` | Recharts dual-line chart (median price + R/m²) |
| `components/PDFDownloadButton.tsx` | Triggers `window.print()` with 500ms delay for Recharts render |
| `app/globals.css` | Print stylesheet — `@media print` rules, `data-no-print`, `cma-section` |
| `supabase/migrations/` | SQL migrations for `transactions` and `property_attributes` tables |

---

## Critical Rules

### Supabase numeric fields are strings
Always cast `size_m2`, `sales_price`, and `price_per_m2` to `Number()` before any comparison or arithmetic. Supabase returns numeric columns as strings. This applies everywhere — in `map()`, in `reduce()`, in `filter()`. A missed cast will cause silent incorrect results (e.g. `"19" >= "154"` is `true` in JS string comparison).

### Garage deduplication — two passes, Number() cast required
`lib/dedupeGarages.ts` runs two passes. Both `reduce()` calls must use `Number(a.size_m2 ?? 0) >= Number(b.size_m2 ?? 0)` — not bare field comparison.
- **Pass 1:** group by `title_deed_no` — handles apartment + garage on same deed
- **Pass 2:** group by `sales_price + registration_date` — handles apartment + garage transferred together at same price with different deed numbers
- Zero-price records get a unique fallback key (`unique__deedNo__date`) to avoid incorrect merging

### ESLint will fail the Netlify build
Unused variables cause build failure on Netlify. Never underscore-prefix them — **remove unused parameters entirely**. If a function signature requires a parameter you don't use, restructure the code instead.

### PDF is browser print only
`react-pdf` and `@react-pdf/renderer` are removed. Do not reinstall. The `app/api/pdf/route.ts` and `components/CMADocument.tsx` files are deleted. PDF is generated via `window.print()` with `@media print` CSS in `app/globals.css`.

### Trend chart lookback is always 36 months
`lib/getTrends.ts` uses a hardcoded 36-month lookback regardless of the comps lookback setting. Do not tie it to the form input.

### Print CSS conventions
- `data-no-print` — hides UI controls (toggles, buttons, drawers) from print
- `cma-section` — adds `break-inside: avoid` so sections don't split across pages
- `comp-row` — same treatment for individual table rows

---

## Brand CI

| Token | Value |
|-------|-------|
| Sage | `#87825E` |
| Olive (dark) | `#585339` |
| Bronze | `#B47A05` / `#865A00` |
| Cream | `#F5F1EA` |
| Off-white | `#FAFAF8` |

**Fonts:** Cinzel (display/headings), Cormorant Garamond (body display), DM Sans (UI/numbers)

**Logo:** `public/images/logo_2.png` — use white/reversed version on dark olive backgrounds. Plain `<img>` tag with `src="/images/logo_2.png"` (no `public` prefix, no Next.js `<Image>` required).

---

## Workflow

- **Cloud only** — no local dev environment. All work happens in Claude Code remote sessions.
- **GitHub org:** `murray-dotcom` / repo: `groundwork-cma`
- **Production branch:** `main` — Netlify auto-deploys on push
- Always push to `main`. Never leave commits on feature branches without merging.
- Verify GitHub shows the commit on `main` before assuming a Netlify deploy will trigger.
- Run `npm run build` before committing to catch TypeScript and ESLint errors locally.

---

## Known Resolved Bugs — Do Not Reintroduce

| Bug | Fix location |
|-----|-------------|
| `size_m2` returned as string from Supabase, causing wrong dedup winner | `lib/getComps.ts` row map + both `reduce()` calls in `lib/dedupeGarages.ts` |
| Garage units consuming comp slots before dedup | `.limit(50)` on Supabase query, `.slice(0, 12)` after `dedupeGarages()` |
| Unit 67 / Unit 24 not deduplicating (different deed nos, same price+date) | Two-pass dedup in `lib/dedupeGarages.ts` |
| Unused variable ESLint failures breaking Netlify builds | Remove unused params entirely — never `_prefix` |
| Enrichment fields not pre-populating on panel reopen | `initial` prop in `CMADisplay.tsx` must include all 11 enrichment fields |
| New enrichment fields dropped from in-session override | `enrichedComps` merge in `CMADisplay.tsx` must spread all fields |
| Recharts SVG not rendering in print | 500ms `setTimeout` in `PDFDownloadButton`, fixed `700px` width in print CSS |
