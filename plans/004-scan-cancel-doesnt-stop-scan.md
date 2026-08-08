# Plan 004: Fix scan cancel not stopping the running scan

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c931121..HEAD -- src/app/api/scan/route.ts src/lib/albion/scanner.ts src/lib/db/repository.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c931121`, 2025-07-14

## Why this matters

When a user cancels a scan, the API sets the job status to "cancelled" in the
database. But the background `scanItems()` loop never checks the job status
during iteration. The scan continues fetching batches from the Albion API and
writing prices to the DB until all batches are processed. The user sees
"cancelled" in the UI but the server is still busy, and the next scan attempt
may conflict with the still-running one (though `getRunningScanJob()` will
return null since the DB says "cancelled", so a new scan can start while the
old one is still writing).

## Current state

### File: `src/app/api/scan/route.ts`

The cancel handler at lines 101-107:

```typescript
// lines 101-107
if (mode === "cancel") {
  const runningJob = getRunningScanJob();
  if (runningJob) {
    updateScanJob(runningJob.id, { status: "cancelled", finishedAt: Date.now() });
  }
  return NextResponse.json({ cancelled: runningJob?.id ?? null });
}
```

This only updates the DB. The background scan continues.

### File: `src/lib/albion/scanner.ts`

The `scanItems` function loop at lines 154-174:

```typescript
// lines 154-174
for (let b = 0; b < batches.length; b++) {
  const batch = batches[b];

  onProgress?.(buildProgress(jobId, itemIds, itemsScanned, batch, 0, errors, start));

  const result = await scanBatch(batch, region);
  itemsScanned += batch.length;
  totalRows += result.rowsSaved;
  if (result.error) {
    errors.push(`${batch.join(",")}: ${result.error}`);
  }

  updateScanJob(jobId, {
    status: b === batches.length - 1 ? "done" : "running",
    itemsDone: itemsScanned,
    errors,
    finishedAt: b === batches.length - 1 ? Date.now() : null,
  });

  onProgress?.(buildProgress(jobId, itemIds, itemsScanned, batch, result.citiesScanned, errors, start));
}
```

There is no check for cancellation between batches. The loop always runs to
completion.

### File: `src/lib/db/repository.ts`

The `getScanJob` function at lines 328-332:

```typescript
// lines 328-332
export function getScanJob(id: number): ScanJobRow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM scan_jobs WHERE id = ?").get(id) as ScanJobRow | undefined;
  return row ?? null;
}
```

This can be used to check the current job status.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Test      | `npx vitest run`         | all pass            |
| Lint      | `npx next lint`          | exit 0              |

## Scope

**In-scope files:**
- `src/lib/albion/scanner.ts` (add cancellation check in the batch loop)

**Out-of-scope files:**
- `src/app/api/scan/route.ts` (cancel handler already sets DB status correctly)
- `src/lib/db/repository.ts` (already has `getScanJob`)
- `src/app/api/scan/route.test.ts` (existing cancel test should still pass)
- Any other file

## Steps

### Step 1: Add cancellation check in the scanItems batch loop

In `src/lib/albion/scanner.ts`, import `getScanJob` (it is already imported
on line 14 alongside other repository functions, but `getScanJob` is NOT in
the import list). Add `getScanJob` to the import from `../db/repository`:

```typescript
// line 12-22 (existing import)
import {
  createScanJob,
  getDistinctItemCount,
  getPriceCount,
  getPricesForItems,
  logScan,
  updateScanJob,
  upsertPrices,
  type PriceRow,
  type ScanJobRow,
} from "../db/repository";
```

Add `getScanJob` to this import:

```typescript
import {
  createScanJob,
  getDistinctItemCount,
  getPriceCount,
  getPricesForItems,
  getScanJob,
  logScan,
  updateScanJob,
  upsertPrices,
  type PriceRow,
  type ScanJobRow,
} from "../db/repository";
```

Then, inside the batch loop (after line 154, at the start of each iteration),
add a cancellation check:

```typescript
for (let b = 0; b < batches.length; b++) {
  const batch = batches[b];

  // Check if the job was cancelled externally.
  const currentJob = getScanJob(jobId);
  if (currentJob && currentJob.status === "cancelled") {
    errors.push("Scan cancelled by user");
    break;
  }

  onProgress?.(buildProgress(jobId, itemIds, itemsScanned, batch, 0, errors, start));
  // ... rest of loop body unchanged
}
```

This check runs before each batch. If the job was cancelled, the loop breaks
and the function returns with the items scanned so far. The `updateScanJob`
call at the end of the loop body will NOT run for the cancelled batch, so the
job stays in "cancelled" status (set by the cancel handler).

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 2: Ensure the scan result reflects cancellation

After the loop (before the return at line 176), the function already returns
a `ScanResult`. The cancellation just means fewer items were scanned. The
existing return at lines 176-183 is fine:

```typescript
return {
  itemsScanned,
  citiesPerItem: CITIES.length,
  totalRowsSaved: totalRows,
  errors,
  durationMs: Date.now() - start,
  jobId,
};
```

No changes needed here. The errors array will contain "Scan cancelled by user"
which is informative.

**Verify**: `npx tsc --noEmit` -> exit 0

## Test plan

- The existing cancel test in `src/app/api/scan/route.test.ts` (lines 116-125)
  should still pass. It starts a scan, cancels it, and verifies the cancel
  response. It does not verify that the scan actually stops, but that is the
  behavior this plan fixes.
- Optional: add a test that verifies the scan job status is "cancelled" (not
  "done") after cancellation and a short wait. Model after the existing cancel
  test.
- Verification: `npx vitest run` -> all pass.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` exits 0 (no regressions)
- [ ] `grep -n "cancelled" src/lib/albion/scanner.ts` returns a match showing
      the cancellation check in the batch loop
- [ ] `getScanJob` is imported in `src/lib/albion/scanner.ts`
- [ ] No files outside `src/lib/albion/scanner.ts` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase has drifted since this plan was written).
- The `scanItems` function or the batch loop has been restructured.
- `getScanJob` is not available in `src/lib/db/repository.ts` (it should be
  at line 328).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.

## Maintenance notes

- The cancellation check is per-batch, not per-item. A batch of 20 items
  takes a few seconds to fetch, so there is a delay of up to one batch before
  the scan stops. This is acceptable for the current batch sizes.
- If a more responsive cancellation is needed in the future, the `scanBatch`
  function could also check for cancellation, but that would require passing
  the job ID down, which adds complexity.
- The `getScanJob` call adds one DB read per batch. This is negligible
  compared to the API fetch time per batch.
