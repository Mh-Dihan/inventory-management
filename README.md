# Inventory Hub

Inventory Hub is now a frontend-only React/Vite application. All inventory data is stored in the browser with `localStorage`, including seeded sample data, products, categories, dashboard stats, reports, barcode lookup, stock adjustments, bulk tags, and duplicate checks.

## Start

```powershell
cd frontend
npm install
npm run dev
```

## Build

```powershell
cd frontend
npm run build
```

## Notes

- No backend is required.
- Data persists per browser through `localStorage`.
- Clearing browser storage resets the app back to seeded sample data.
