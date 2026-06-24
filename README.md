# Groundwork CMA

A broker-facing web application for generating Comparable Market Analysis (CMA) reports for Home Ground Real Estate. Pulls comparable sales from the Groundwork Supabase database, calculates market-derived price indications, generates AI-written market commentary, and exports branded A4 PDF reports.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** with Home Ground brand tokens
- **@supabase/supabase-js** — reads `transactions` table in the Groundwork Supabase project
- **@react-pdf/renderer** — client-side PDF generation
- **@anthropic-ai/sdk** — 2-sentence market narrative via claude-sonnet-4-6
- Deploy target: **Netlify**

## Local setup

### 1. Install

```bash
git clone https://github.com/murray-dotcom/groundwork-cma.git
cd groundwork-cma
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Groundwork Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Anthropic API key (narrative generation) |

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Usage

1. Fill in the CMA form: subject address, estate, property type, sizes, optional asking price, lookback period and size tolerance.
2. Click **Generate CMA** — the app queries Supabase for comparable sales and calculates conservative / mid-market / strong price indications.
3. Review the results screen. Broker can type inline notes in the table before exporting.
4. Click **Download PDF** to save a branded A4 PDF.

## Supabase dependency

This app reads from the **Groundwork Supabase project** (`zumdsmmhsttnfruyvngq`). It has no local database.

### Required `transactions` table columns

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `address` | text | Property street address |
| `estate` | text | e.g. `"Simbithi Eco Estate"` |
| `property_type` | text | `freehold` or `sectional_title` |
| `sectional_scheme` | text | Scheme name (sectional title only) |
| `size_m2` | numeric | ERF or unit size |
| `built_area_m2` | numeric | Built area (optional) |
| `sale_price` | numeric | Registration price in ZAR |
| `price_per_m2` | numeric | `sale_price / size_m2` |
| `registration_date` | date | Transfer registration date |
| `is_market_sale` | boolean | `true` for arm's-length sales |

### RLS policy

Apply `supabase/migrations/002_cma_read_policy.sql` in the Groundwork Supabase SQL editor to allow the anon key to read the `transactions` table.

## Netlify deployment

Set these environment variables in the Netlify dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://zumdsmmhsttnfruyvngq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
ANTHROPIC_API_KEY=<Anthropic API key — add via Murray>
```

The `netlify.toml` is pre-configured for Next.js via `@netlify/plugin-nextjs`.

## Brand

| Token | Value |
|---|---|
| Sage | `#87825E` |
| Dark Olive | `#585339` |
| Bronze | `#B47A05` |
| Cream | `#F5F1EA` |
| Off-White | `#FAFAF8` |
| Display font | Cinzel |
| Body font | Cormorant Garamond |
| UI / numbers | DM Sans |
