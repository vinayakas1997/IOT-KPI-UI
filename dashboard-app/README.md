# Manufacturing KPI Dashboard

Vite + React + TypeScript rebuild of the original single-file `kpi_dashboard.html`, split into
per-component files with a fluid (not fixed-canvas) layout so it works across different monitor
sizes and aspect ratios.

## Dev vs. build

- `npm run dev` — normal Vite dev server with HMR. This never looks like the final artifact
  (multiple requests, unbundled) — that's expected.
- `npm run build` — produces a **single self-contained `dist/index.html`** (via
  `vite-plugin-singlefile`) with all JS/CSS inlined. This is the file that actually ships — open
  it directly (double-click / `file://`) on the kiosk machine, no server required. Always verify
  changes against this built file, not just the dev server.

## Live-data swap point

All demo numbers live in `src/data/mockData.ts`, typed against the interfaces in `src/types/`.
Every component receives its data via props — nothing reads globals or hardcodes numbers in
markup. To wire up real IoT data later, replace the contents of `mockData.ts` (or swap its
import in `App.tsx` for a real data-fetching hook) — no component changes should be needed.

## `infoId` / future click-to-explain

Every card takes an `infoId` prop (see `src/types/infoId.ts`), rendered as `data-info={infoId}`
by the shared `Card` component. `src/data/explainRegistry.ts` maps each `infoId` to its
corresponding file in `../each-component-explanation/`. No click handler or modal exists yet —
this is just the stable hook so that feature is a small addition later, not a rearchitecture.

## Layout notes

The dashboard uses CSS Grid/Flexbox with `clamp()`/`%`/`fr` throughout instead of fixed pixel
widths, so it reflows across aspect ratios (tested at 3440×1440, 2560×1080, 1920×1080, 1600×900,
1366×768) rather than being scaled/letterboxed. The two hand-built SVG scatter charts
(`ScatterSplineChart`) and the radar chart (`OverallLineHealthRadar`) keep their point-generation
math imperative (in a `useEffect` writing into an SVG ref) — only their containing box is fluid.
