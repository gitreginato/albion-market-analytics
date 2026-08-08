# Audit Plans: Albion Market Dashboard

> **Audit baseline**: commit `c93112139a84b75d67d52a34cc9f516ce518d7ac`
> **Audit date**: 2025-07-14
> **Project**: Albion Market Dashboard (Next.js 16, React 19, SQLite)

## How to use these plans

Each plan is a self-contained implementation document. An executor (human or
agent) can pick up any plan and implement it without additional context.

1. Run the drift check at the top of the plan first.
2. Follow the steps in order, running verification commands after each step.
3. Respect the STOP conditions. Do not improvise beyond the plan scope.
4. When done, update the status table below.

## Plan index

| # | Plan | Priority | Effort | Risk | Status | Depends on |
|---|------|----------|--------|------|--------|------------|
| 001 | [Projections panel filters are no-ops](001-projections-panel-filters-noop.md) | P1 | S | LOW | TODO | none |
| 002 | [Scan progress bar never updates](002-scan-progress-bar-stuck-at-zero.md) | P1 | S | LOW | TODO | none |
| 003 | [Scan resume creates duplicate job](003-scan-resume-creates-duplicate-job.md) | P1 | M | MED | TODO | none |
| 004 | [Scan cancel doesn't stop the scan](004-scan-cancel-doesnt-stop-scan.md) | P2 | S | LOW | TODO | none |
| 005 | [Item-details wrong fee formula](005-item-details-wrong-fee-formula.md) | P1 | S | LOW | TODO | none |
| 006 | [Portfolio duplicate getAllPrices()](006-portfolio-duplicate-getallprices.md) | P2 | S | LOW | TODO | none |
| 007 | [Five API routes lack Zod validation](007-five-api-routes-lack-zod-validation.md) | P2 | M | LOW | TODO | none |

## Status legend

- **TODO**: Not started
- **IN PROGRESS**: Being implemented
- **DONE**: Implemented and verified
- **BLOCKED**: Stopped due to a STOP condition

## Priority legend

- **P1**: User-visible bug or data correctness issue. Fix soon.
- **P2**: Hardening, performance, or minor UX issue. Fix when convenient.

## Effort legend

- **S**: Small (1 file, < 30 lines changed)
- **M**: Medium (2-5 files, 30-100 lines changed)
- **L**: Large (5+ files, 100+ lines changed)

## Summary of findings

### Bugs (P1)

1. **Plan 001**: The projections panel has an elaborate filter UI (tiers,
   categories, qualities, mount, transport, premium, min margin/volume/
   consistency) but `fetchProjections()` only sends `region` to the API.
   All filter changes are silently ignored.

2. **Plan 002**: The scan progress bar polls `/api/scan?mode=status` and
   reads a `percent` field that the API never returns. The progress bar
   stays at 0% until the scan completes.

3. **Plan 003**: When resuming a scan, the API marks the old job as
   "running" and returns its ID, but `scanItems()` creates a new job
   internally. The client polls the wrong (orphaned) job and sees no
   progress.

4. **Plan 005**: The item-details route computes arbitrage and BM profit
   with a phantom 4% fee on the buy side (`buyPrice * 1.04`) and misses the
   2.5% setup fee on city sell orders. The correct formulas already exist in
   `opportunities.ts` and `city-config.ts`.

### Bugs (P2)

5. **Plan 004**: The scan cancel handler sets the job status to "cancelled"
   in the DB, but the background `scanItems()` loop never checks for
   cancellation. The scan continues until all batches are processed.

### Performance (P2)

6. **Plan 006**: The portfolio route calls `getAllPrices()` twice per
   request (line 54 for item IDs, line 86 for price date maps). Each call
   is a full table scan.

### Hardening (P2)

7. **Plan 007**: Five API routes (`item-details`, `opportunities`,
   `portfolio`, `projections`, `items/search`) parse query params with raw
   `Number()`, `parseInt()`, and unchecked `as` casts instead of Zod
   schemas. Invalid input produces `NaN` or silent defaults instead of a
   clean 400 response.

## Findings considered but not planned

- **Array.includes vs Set in projections panel**: Investigated and dismissed.
  The projections panel already uses `Set` for all filter state
  (`tiers.has()`, `categories.has()`, `qualities.has()`). The only
  `.includes()` calls in dashboard components are on tiny arrays (3 elements
  in `gold-panel.tsx`) or string search in `items-list-panel.tsx`, neither of
  which is a performance concern.
- **Health route Zod validation**: Dismissed. The health endpoint takes no
  query parameters, so validation is not applicable.
