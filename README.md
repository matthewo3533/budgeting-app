# Budget Tracker

A React budgeting app that analyses spending patterns from bank CSV exports. Built with ThemeCN-inspired colours, Chart.js, and drag-and-drop categorization.

## Run in development

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Features

- **Upload CSV** – Export from your bank (e.g. ANZ, BNZ) and upload. Supports columns: Account number, Effective Date, Transaction Date, Description, Transaction Code, Amount, Balance, etc.
- **Categorise** – Drag transactions into categories: Rent, Utilities, Subscriptions, Groceries, Takeout, Petrol. Use **Group similar** to assign all matching merchants (e.g. all "New World") to one category at once.
- **Dashboard** – Donut chart of spending by category, biggest income sources, biggest costs, income vs expenses, and an adjustable date range for all charts.

## Tech

- React 18 + TypeScript + Vite
- Tailwind CSS v4 + shadcn-style UI (ThemeCN palette)
- Chart.js (Doughnut & Bar)
- @dnd-kit for drag-and-drop, anime.js for drop animations
- Zustand for state, Papa Parse for CSV

## Sample data

Use the included CSV `38-9001-0346768-01_2025-11-21_2026-02-21.csv` to test the import and categorisation flow.
