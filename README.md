# Earnings Calendar — Forensic View

A static, installable PWA for analysts who need to scan earnings reports fast.
Built around the data of ~1,500 reports per quarter, with growth math, consensus beats,
and a fraud / anomaly rules engine baked in.

> **Stack:** Vite 7 · React 19 · TypeScript · Tailwind v4 · Zustand · TanStack Table v8 · Recharts · Fuse.js · vite-plugin-pwa
> **Deploy target:** GitHub Pages (HashRouter, no server needed)

---

## What it does

For every reporting company in the calendar, the app computes:

- **YoY growth** for EPS and revenue (signed, symmetric around negative bases)
- **Consensus beat / miss** magnitude (%) for EPS and revenue
- **Margin proxy** (EPS / revenue) and YoY change in basis points
- **Composite quality score (0–100)** combining growth, beats, margin, and a fraud penalty
- **Forensic verdict** — `beat` / `mixed` / `miss` / `unknown`
- **Fraud / anomaly flags** via an extensible rules engine

### Fraud / anomaly rules ([`src/lib/analytics/fraud.ts`](./src/lib/analytics/fraud.ts))

| Rule | Trigger | Severity |
|---|---|---|
| EPS / Revenue divergence | EPS YoY ≥ +30% while Revenue YoY ≤ −5% | medium / high |
| Low-quality EPS beat | EPS beats consensus, Revenue misses ≥ 2% | low / medium |
| Margin spike without growth | Margin proxy expands ≥ 500 bps with flat/down revenue | medium / high |
| Sandbagged consensus | Consensus reset −25% vs prior, then beaten ≥ 5% | low |
| EPS exactly meets consensus | Smoothed-earnings smell test | low |
| Major revenue miss | Revenue misses consensus by ≥ 5% | medium / high |
| Implausible EPS swing | \|EPS YoY\| ≥ 500% with revenue ≤ ±50% | medium |
| EPS collapse vs revenue growth | EPS YoY ≤ −30% while Revenue YoY ≥ +5% | medium / high |
| Trivial / in-line beat | Both beats < 0.5% | low |

Each company's `qualityScore` is penalised based on the severity of any rules it trips —
`-18 / -9 / -4` per high / medium / low flag, capped at −50.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | **Calendar** — earnings grouped by day, scannable cards with verdict, beat, YoY, quality bar, flag count |
| `/movers` | **Movers** — sortable table with Winners / Losers / Quality / All segments. Powered by TanStack Table v8. |
| `/alerts` | **Alerts** — fraud / anomaly feed with severity counts, rule chips, sortable by severity / count / quality / date |
| `/c/:ticker` | **Company detail** — magazine-quality breakdown with `MetricBars`, `QualityRadial`, `Sparkline`, narrative summary, and full flag list |

Plus a **⌘K command palette** (Linear-style) for fuzzy ticker / quick-action navigation,
and a global filter bar (verdicts, quarters, time of day, market-cap buckets, min quality, flagged-only).

---

## Architecture

```
src/
├── lib/
│   ├── types.ts                 # Domain types (RawX → Company)
│   ├── analytics/
│   │   ├── units.ts             # parseValue("247.8M") · format helpers
│   │   ├── growth.ts            # yoyGrowth · beatPct · marginProxy
│   │   ├── quality.ts           # composite score (0–100)
│   │   └── fraud.ts             # rule engine
│   ├── data/
│   │   ├── loader.ts            # JSON → Dataset (normalize + derive everything)
│   │   └── select.ts            # filter + sort + Fuse search
│   └── store/
│       └── useAppStore.ts       # Zustand: filters, sort, theme, palette, mobile nav
├── components/
│   ├── ui/                      # Badge, Button, Card, Input, Tooltip
│   ├── layout/                  # Shell, Header, MobileNav, ThemeToggle, StatusStrip
│   ├── filters/                 # SearchBox, FilterBar, FilterChip, SortMenu, CommandPalette
│   ├── calendar/                # CompanyCard, DayGroup, MoversTable, AlertCard, ...
│   └── charts/                  # Sparkline, MetricBars, QualityRadial
├── routes/                      # Calendar · Movers · Alerts · Company (lazy-loaded)
├── App.tsx                      # router shell + dataset bootstrap
├── main.tsx                     # HashRouter (GH Pages friendly)
└── index.css                    # Tailwind v4 + design tokens
```

---

## Data shape

Source: `public/data/earnings.json` (originally scraped from tradingeconomics.com).
The loader normalizes everything to typed numbers up-front, parses units (`K/M/B/T`),
and derives growth / beat / quality / flags so the UI never does math.

```ts
interface Company {
  ticker: string; name: string
  date: string; isoDate: string | null; weekday: string
  time: 'AM' | 'PM'; fiscalQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  marketCap: number | null
  eps:     { actual, consensus, previous: number | null }
  revenue: { actual, consensus, previous: number | null }   // raw $ (e.g. 247_800_000)
  epsDerived:     { yoy, beat, surprise, beatConsensus, grewYoY }
  revenueDerived: { yoy, beat, surprise, beatConsensus, grewYoY }
  marginProxyActual / Previous / ChangeBps: number | null
  qualityScore: number          // 0..100
  qualityBreakdown: { revenueGrowthScore, epsGrowthScore, ... }
  verdict: 'beat' | 'mixed' | 'miss' | 'unknown'
  flags: FraudFlag[]            // { id, label, severity, detail }
  topSeverity: 'low' | 'medium' | 'high' | null
}
```

---

## Local development

```bash
npm install
npm run dev          # vite dev server on http://localhost:5173
npm run build        # type-check + vite build → dist/
npm run preview      # preview the prod build
```

The build is fully static. `dist/` can be hosted on any static host
(GitHub Pages, Netlify, S3, Cloudflare Pages…). Routes use `HashRouter`
so deep links work without server-side rewrites.

### Bundle (post-split)

| Chunk | Size | Gzip |
|---|---|---|
| `index` (app shell) | 223 kB | 69 kB |
| `react-vendor` | 49 kB | 17 kB |
| `tanstack` | 50 kB | 13 kB |
| `recharts` (Company route only) | 395 kB | 115 kB |
| `fuse` (palette only) | 24 kB | 9 kB |
| `Calendar` route | 13 kB | 4 kB |
| `Movers` route | 12 kB | 4 kB |
| `Alerts` route | 13 kB | 4 kB |
| `Company` route | 22 kB | 6 kB |

First paint loads only the app shell + Calendar route + react-vendor (≈ 90 kB gzip).
Recharts is deferred until the user opens a Company detail page.

---

## Deploy to GitHub Pages

This repo ships a workflow at `.github/workflows/deploy.yml` that builds on every
push to `main` and deploys `dist/` to GitHub Pages. Enable Pages → "GitHub Actions"
in the repo settings; first push will publish to:

```
https://thekinghippopotamus.github.io/earnings-calendar/
```

`vite.config.ts` uses `base: './'` so the build is deploy-path agnostic.

---

## License

MIT
