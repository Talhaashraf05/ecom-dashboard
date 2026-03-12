# SQP Intelligence Dashboard

A React-based dashboard for visualizing Amazon **Search Query Performance (SQP)** Brand View data. Upload weekly CSV exports and get instant insights into impression share, click share, purchase share, and search volume trends.

## Features

- **Multi-week CSV upload** — drag & drop up to 12 weekly SQP CSV files
- **KPI summary cards** — impression share, click share, purchase share, search volume with week-over-week deltas and sparklines
- **Keyword table** — sortable, searchable, paginated keyword list with per-row sparklines
- **Expandable keyword detail** — click any keyword to see WoW charts (line, area, bar) and a detailed week-over-week breakdown table
- **Chronological sorting** — handles year boundaries correctly (e.g. Week 50/2025 → Week 1/2026)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

## Usage

1. Open the app in your browser
2. Drop one or more `GB_Search_query_performance_Brand_view_Simple_Week_*.csv` files onto the upload zone
3. Explore KPI cards, filter keywords, and click rows to expand detailed WoW analysis

## Tech Stack

- [React](https://react.dev)
- [Vite](https://vite.dev)
- [Recharts](https://recharts.org) — charts and visualizations
- [Lucide React](https://lucide.dev) — icons
