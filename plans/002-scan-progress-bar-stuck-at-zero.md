# Plan 002: Fix scan progress bar never updating (percent field mismatch)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c931121..HEAD -- src/components/dashboard/opportunities-panel.tsx src/lib/albion/scanner.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c931121`, 2025-07-14

## Why this matters

When a user clicks "Escanear mercado", the UI polls `/api/scan?mode=status`
every second and reads `json.progress.percent` to update a progress bar. But
the server never returns a `percent` field in the progress object. It returns
`itemIndex` and `totalItems`. The progress bar is permanently stuck at 0%
during the entire scan, making it look like the scan is frozen.

## Current state

### File: `src/components/dashboard/opportunities-panel.tsx`

The polling function at lines 253-263:

```typescript
// lines 253-263
const pollScanProgress = useCallback(async () => {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch(`/api/scan?region=${region}&mode=status`);
    if (!res.ok) continue;
    const json = (await res.json()) as { isScanning?: boolean; progress?: { percent?: number } | null; lastResult?: { durationMs?: number } | null };
    const percent = json.progress?.percent ?? 0;
    setProgress(percent);
    if (!json.isScanning && json.lastResult) break;
  }
}, [region]);
```

It reads `json.progress?.percent` which is always `undefined` because the
server does not produce a `percent` field.

### File: `src/lib/albion/scanner.ts`

The `ScanProgress` interface at lines 26-34:

```typescript
// lines 26-34
export interface ScanProgress {
  currentItem: string;
  itemIndex: number;
  totalItems: number;
  citiesScanned: number;
  errors: string[];
  startedAt: number;
  jobId: number;
}
```

No `percent` field exists. The `scanJobToProgress` function (lines 200-213)
builds this object from a `ScanJobRow`:

```typescript
// lines 200-213
export function scanJobToProgress(job: ScanJobRow): ScanProgress {
  const errors: string[] = job.errors_json ? JSON.parse(job.errors_json) : [];
  return {
    jobId: job.id,
    currentItem: job.status === "done" || job.status === "failed" || job.status === "cancelled"
      ? "Concluído"
      : `Lote ${job.items_done}/${job.items_total}`,
    itemIndex: job.items_done,
    totalItems: job.items_total,
    citiesScanned: 0,
    errors,
    startedAt: job.started_at,
  };
}
```

### File: `src/app/api/scan/route.ts`

The status response at lines 55-84 returns `progress` as a `ScanProgress`
object (which has `itemIndex` and `totalItems`, not `percent`):

```typescript
// lines 55-84
function buildStatusResponse(runningJob: ScanJobRow | null, latestJob: ScanJobRow | null) {
  const progress: ScanProgress | null = runningJob
    ? scanJobToProgress(runningJob)
    : latestJob && latestJob.status !== "done"
      ? scanJobToProgress(latestJob)
      : null;
  // ...
  return {
    isScanning: runningJob !== null,
    progress,
    lastResult,
    dbStats: getDbStats(),
    lastScanTimestamp: getLastScanTimestamp(),
    recentLogs: getRecentScanLogs(10),
    recentJobs: getRecentScanJobs(5),
  };
}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Test      | `npx vitest run`         | all pass            |
| Lint      | `npx next lint`          | exit 0              |

## Scope

**In-scope files:**
- `src/components/dashboard/opportunities-panel.tsx` (fix `pollScanProgress` to compute percent from `itemIndex` and `totalItems`)

**Out-of-scope files:**
- `src/lib/albion/scanner.ts` (no need to add `percent` to the server response; computing it client-side is simpler and less invasive)
- `src/app/api/scan/route.ts`
- Any other file

## Steps

### Step 1: Fix the polling function to compute percent from itemIndex/totalItems

Replace the type cast and percent extraction in `pollScanProgress` (lines 253-263)
to read `itemIndex` and `totalItems` from the progress object and compute
percent:

```typescript
const pollScanProgress = useCallback(async () => {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch(`/api/scan?region=${region}&mode=status`);
    if (!res.ok) continue;
    const json = (await res.json()) as {
      isScanning?: boolean;
      progress?: { itemIndex?: number; totalItems?: number } | null;
      lastResult?: { durationMs?: number } | null;
    };
    const itemIndex = json.progress?.itemIndex ?? 0;
    const totalItems = json.progress?.totalItems ?? 0;
    const percent = totalItems > 0 ? Math.round((itemIndex / totalItems) * 100) : 0;
    setProgress(percent);
    if (!json.isScanning && json.lastResult) break;
  }
}, [region]);
```

**Verify**: `npx tsc --noEmit` -> exit 0

## Test plan

- No new test files needed (UI polling fix, verified manually).
- Existing tests should still pass: `npx vitest run` -> all pass.
- Manual verification: run `npm run dev`, click "Escanear mercado", observe
  the progress percentage increasing from 0 to 100 during the scan.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` exits 0 (no regressions)
- [ ] `grep -n "progress?.percent" src/components/dashboard/opportunities-panel.tsx`
      returns no matches (the old broken field access is gone)
- [ ] No files outside `src/components/dashboard/opportunities-panel.tsx` are
      modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase has drifted since this plan was written).
- The `pollScanProgress` function has been removed or restructured.
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.

## Maintenance notes

- If a `percent` field is later added to the server `ScanProgress` type, the
  client-side computation can be simplified to read it directly. But the
  client-side fallback is harmless and more resilient.
- The polling loop runs for a maximum of 60 iterations (60 seconds). If scans
  take longer than 60 seconds, the loop exits early and progress stops updating.
  This is a separate issue not addressed by this plan.
