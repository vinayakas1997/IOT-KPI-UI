# Make dashboard data internally consistent: shared events, real calculations, shorter docs

## Context

The dashboard was migrated to React with per-component mock data (`dashboard-app/src/data/mockData.ts`), but the numbers were transcribed as-is from the original static mockup — which means they were never actually consistent with each other: `errLog` (13 entries), `errHours` (10 tick events), and `stageBreakdowns` (6 downtime ranges) all disagree on what happened during the shift, and `Plan Achieve %` / `OEE %` are standalone hardcoded percentages with no link to Run Time / Lost Time / Availability / Performance / Quality shown right next to them. Separately, `Total Approved Units` (43,927) is on a totally different numeric scale than the `Production vs Target` chart's daily total (130) sitting in the same row.

The user wants three things:
1. Scale production to ~1000/day and make Plan Achieve % / OEE % **actually computed** from real inputs, not standalone numbers — reflected in both the explanation docs and the display.
2. A single shared list of downtime/alarm events that drives the Live Error/Alarm Log, the MTBF/MTTR timeline, **and** Plan Achieve %'s Lost Time Hours, so they can never drift out of sync (and matches how real IoT downtime data would actually arrive).
3. Trim `each-component-explanation/*.md` to 1-2 sentences per section.

## Key design decision — surfacing before implementing

To make the top-row scorecards consistent with the now shift-scoped Plan Achieve %/OEE %, **`Total Approved Units` and `Total Defects` also drop from their old ~44k/~7k scale down to shift-scale (~400-500 range)**, since they'll now be derived from the same shift's actual run time × rate, instead of representing an unrelated longer period. `Defect %` stays 14% (unchanged story), just now computed instead of hardcoded. If you'd rather keep the big scorecard numbers as-is (representing a longer period like month-to-date) and only rescale the Production vs Target chart, say so before I implement — that's a one-line scope change.

## The calculation chain (concrete resulting numbers)

All derived at module-load time in `mockData.ts`, from these inputs: `shiftStart`/`shiftEnd` (unchanged, 08:20-19:20), `buffers` (unchanged, 20 min), `bottleneck` (unchanged: Machine 3, 45s ideal / 58s actual), and the new `downtimeEvents` list.

- `plannedProductionMin` = shift (660) − buffers (20) = **640 min**
- `lostTimeMin` = merged/union duration of all downtime-causing events (overlapping windows across machines count once — a sequential line is only "down" once, even if two machines are down at once) = **175 min → 2.9h**
- `runTimeHours` = (640 − 175) / 60 = **7.75h**
- `availabilityPct` = runTime / plannedProductionMin = **73%**
- `performancePct` = bottleneck ideal / actual cycle time = 45/58 = **78%**
- `actualUph` (displayed "Average UPH") = 3600 / 58s = **62**
- `unitsProduced` (gross) = runTimeHours × actualUph ≈ **481**
- `defectPct` = kept as-is, **14%** (same story as before, now used as an input to derive counts instead of standing alone)
- `totalDefects` = round(481 × 0.14) = **67**
- `totalApprovedUnits` = 481 − 67 = **414**
- `qualityPct` = totalApprovedUnits / unitsProduced = **86%** (happens to land exactly on the old value)
- `oeePct` = availability × performance × quality = 0.73×0.78×0.86 ≈ **49%** (was 58% — now internally consistent, but a visibly different headline number)
- `planAchievePct` = availability × performance (time-and-rate utilization, deliberately excluding quality so it's a distinct number from OEE) = 0.73×0.78 ≈ **57%** (was 69%)
- Production vs Target: `dailyTarget` 130 → **1000**, six intervals rescaled to clean round numbers **150/200/200/150/150/150**, produced-so-far kept at the same % achievement per interval (100%/72%/40%) → **150/144/80**, cumulative shown **374/1000**.
- MTBF/MTTR numbers **stay exactly the same as today** (10.4h/15m, 4.9h/25m, 4.3h/60m, 10.4h/15m, 10.7h/0m) since the 6 downtime-causing events reuse the identical time windows already in `stageBreakdowns`.
- FPY-by-machine (98/95/89/97/99) and Machine Utilization stay unchanged — not part of this request, and not needed as inputs to the above chain.

## 1. Shared event model (Plan 2)

New type in `dashboard-app/src/types/errors.ts` (or a new `events.ts`):
```ts
export interface DowntimeEvent {
  machine: MachineId;
  start: string;         // "HH:MM"
  durationMin: number;
  category: ErrorCategory; // 'machine' | 'human' | 'other'
  description: string;
  status: LogStatus;       // 'active' | 'cleared'
  causesDowntime: boolean; // true = real stoppage (feeds MTBF + Lost Time); false = brief alarm only
}
```

`mockData.ts` defines one `downtimeEvents: DowntimeEvent[]` (15 events: the same 6 stoppages already in `stageBreakdowns` today, plus 9 brief alarms reusing most of today's `errLog` flavor text for continuity). Three pure derivation functions (new file `dashboard-app/src/utils/deriveFromEvents.ts`, reusing `toMin`/`totalBufferMinutes` from `utils/time.ts`):

- `deriveStageBreakdowns(events, machines)` → today's `StageBreakdowns` shape (groups `causesDowntime` events by machine).
- `deriveErrLog(events)` → today's `ErrLogEntry[]` shape, sorted newest-first.
- `deriveErrHours(events, intervalBoundaries)` → today's `ErrorHourBucket[]` shape, bucketing each event by its start time into one of the 6 shift intervals.
- `totalDowntimeMinutesUnion(events)` → merges overlapping `{start,end}` windows across all machines, returns total minutes (used for `lostTimeMin` above).

**Component files are untouched** — `mockData.ts` still exports `stageBreakdowns`, `errLog`, `errHours`, `planAchieve`, `oeeBreakdown`, `scorecardTotals`, `dailyTarget`, `hours` under the same names/shapes; only how they're computed changes (from derivation functions instead of hand-typed literals). This keeps the whole change low-risk to the already-verified UI.

One incidental real bug fix needed to support this: `HourlyErrorPatternChart.tsx` currently positions ticks via `(ev.min / 60) * 100%` — hardcoding a 60-minute-wide track regardless of the interval's actual length (some shift intervals are 120-160 min). Today's hand-picked events all happened to stay under 60 by luck; derived events won't reliably do that. Fix: add each bucket's real duration (from the shared interval-boundaries list) and divide by that instead of a hardcoded 60.

A shared `SHIFT_INTERVAL_BOUNDARIES = ['08:20','10:20','13:00','15:10','17:20','19:20','21:20']` constant gets added to `mockData.ts` (single source for bucketing events); `ScatterSplineChart.tsx`'s already-hardcoded `X_AXIS_TICKS` (same 7 boundary values) gets pointed at the same constant instead of a second hardcoded copy, since it's the same data and this whole exercise is about killing duplicate/divergent sources of truth.

## 2. Explanation docs (Plan 3 + keeping them accurate)

All 16 files in `each-component-explanation/`: condense each of the 3 sections (What is it / KPI value / What's needed to calculate it) to 1-2 sentences each, dropping bullet lists in favor of tight prose. While rewriting, update the ones whose formulas actually changed so the docs stay truthful:
- `04-plan-achieve-percentage.md` — formula becomes `Availability % × Performance %` (explicitly excluding quality, to explain why it differs from OEE).
- `05-oee-percentage-analysis.md` — same three sub-factors, now note Performance derives from the Bottleneck card's actual/ideal cycle time and Quality from Total Approved/Total Defects.
- `01-total-approved-units.md`, `02-total-defects.md`, `03-defect-percentage.md` — note these are now shift-scoped (derived from run time × rate), not a longer-period cumulative count.
- `14-mtbf-mttr-shift-timeline.md`, `16-live-error-alarm-log.md`, `13-hourly-error-pattern.md` — note all three now derive from the same shared downtime/alarm event list.
- The remaining 9 files: condense only, no formula changes needed.

## Verification

- `npm run build` in `dashboard-app/` must still produce a single `dist/index.html` with no TypeScript errors.
- Visually re-check (screenshot at 1920×1080 and 3440×1440) that: the top row's new smaller numbers (414/67/14%/57%/49%) render without layout regressions (shorter numbers than 43,927 should if anything have more room, but confirm no leftover formatting assuming large digit counts); Production vs Target shows 374/1000 with the same 3-bar color pattern as before; MTBF numbers are pixel-identical to before; the Hourly Error Pattern chart's tick positions look correct now that the divide-by-duration fix is in (no ticks jammed at the far right edge or past it).
- Grep for any remaining place that still hardcodes a number this chain now computes (`oeePct`, `planAchievePct`, `totalDefects`, `totalApprovedUnits`, `dailyTarget`) to confirm nothing was missed.

### Critical files
- `dashboard-app/src/data/mockData.ts` — where `downtimeEvents` + the whole calculation chain lives
- `dashboard-app/src/utils/deriveFromEvents.ts` (new) — the 4 derivation functions
- `dashboard-app/src/utils/time.ts` — reused `toMin`/`totalBufferMinutes`, possibly extended
- `dashboard-app/src/components/cards/HourlyErrorPatternChart.tsx` — tick-duration bug fix
- `dashboard-app/src/components/shared/ScatterSplineChart.tsx` — point at shared boundaries constant
- `each-component-explanation/*.md` — all 16 files trimmed, 6 of them formula-updated
