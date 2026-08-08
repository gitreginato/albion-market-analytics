# Plan 003: Fix scan resume creating a duplicate job instead of resuming

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c931121..HEAD -- src/app/api/scan/route.ts src/lib/albion/scanner.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `c931121`, 2025-07-14

## Why this matters

When a user requests `resume=true`, the API marks the latest unfinished job as
"running" and then calls `scanItems()`. But `scanItems()` always creates a NEW
scan job via `createScanJob()`. The result is two jobs: the old one marked
"running" (but never updated again) and a new one that actually runs. The
response returns the old job's ID, so the client polls the wrong job and sees
no progress. The old job is orphaned with status "running" forever, which also
blocks future scans because `getRunningScanJob()` returns it.

## Current state

### File: `src/app/api/scan/route.ts`

The resume logic at lines 135-150:

```typescript
// lines 135-150
if (resume === "true") {
  const latest = getLatestScanJob();
  if (latest && latest.status !== "done" && latest.items_done < latest.items_total) {
    updateScanJob(latest.id, { status: "running", finishedAt: null });
    scanItems(itemIds, region, undefined, latest.batch_size).catch(() => undefined);
    return NextResponse.json({
      message: "Scan resumed",
      jobId: latest.id,
      totalItems: itemIds.length,
      batchSize: latest.batch_size,
      region,
      source,
      pollUrl: `/api/scan?mode=status`,
    });
  }
}
```

The response says `jobId: latest.id` but `scanItems()` creates a new job
internally. The client polls `latest.id` which is the orphaned old job.

### File: `src/lib/albion/scanner.ts`

The `scanItems` function at lines 133-197 always creates a new job:

```typescript
// lines 143-145
const jobId = createScanJob(region, itemIds.length, batchSize);
updateScanJob(jobId, { status: "running" });
```

There is no way to pass an existing job ID to `scanItems()`.

### File: `src/lib/db/repository.ts`

The `createScanJob` function at lines 275-294 inserts a new row:

```typescript
// lines 275-294
export function createScanJob(
  region: string,
  itemsTotal: number,
  batchSize: number,
): number {
  const db = getDb();
  const now = Date.now();
  const result = db.prepare(INSERT_SCAN_JOB).run({
    status: "pending",
    region,
    items_total: itemsTotal,
    items_done: 0,
    batch_size: batchSize,
    errors_json: null,
    started_at: now,
    finished_at: null,
    updated_at: now,
  });
  return Number(result.lastInsertRowid);
}
```

### Existing tests

`src/app/api/scan/route.test.ts` has a resume test (lines 127-150) that
manually marks a job as "failed" then calls resume. The test checks that the
response says "Scan resumed" and the job ID matches, but it does NOT verify
that the same job ID is updated during the scan (it sleeps 500ms then checks
`recentJobs[0].status === "done"`, which passes because the NEW job completes,
not the resumed one).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Test      | `npx vitest run`         | all pass            |
| Lint      | `npx next lint`          | exit 0              |

## Scope

**In-scope files:**
- `src/lib/albion/scanner.ts` (add optional `jobId` parameter to `scanItems`)
- `src/app/api/scan/route.ts` (pass the existing job ID to `scanItems` on resume)

**Out-of-scope files:**
- `src/lib/db/repository.ts` (no changes needed, `updateScanJob` already works)
- `src/app/api/scan/route.test.ts` (may need updating if test assertions change)
- Any other file

## Steps

### Step 1: Add optional `jobId` parameter to `scanItems`

In `src/lib/albion/scanner.ts`, modify the `scanItems` function signature
(line 133) to accept an optional `existingJobId` parameter:

```typescript
export async function scanItems(
  itemIds: string[],
  region: ServerRegion,
  onProgress?: (progress: ScanProgress) => void,
  batchSize: number = DEFAULT_BATCH_SIZE,
  existingJobId?: number,
): Promise<ScanResult> {
```

Then replace lines 143-145:

```typescript
// Old:
const jobId = createScanJob(region, itemIds.length, batchSize);
updateScanJob(jobId, { status: "running" });

// New:
const jobId = existingJobId ?? createScanJob(region, itemIds.length, batchSize);
if (existingJobId) {
  updateScanJob(existingJobId, { status: "running", finishedAt: null });
} else {
  updateScanJob(jobId, { status: "running" });
}
```

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 2: Pass the existing job ID in the resume path

In `src/app/api/scan/route.ts`, update the resume block (line 139) to pass
`latest.id` as the `existingJobId`:

```typescript
// Old (line 139):
scanItems(itemIds, region, undefined, latest.batch_size).catch(() => undefined);

// New:
scanItems(itemIds, region, undefined, latest.batch_size, latest.id).catch(() => undefined);
```

Also remove the redundant `updateScanJob(latest.id, { status: "running", finishedAt: null })`
call at line 138 since `scanItems` now handles that when `existingJobId` is
provided. Or keep it for safety (it is idempotent).

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 3: Update the resume test to verify the correct job is updated

In `src/app/api/scan/route.test.ts`, the resume test (lines 127-150) should
verify that after resume, the SAME job ID (not a new one) ends up with status
"done". Update the final status check to verify `statusAfter.recentJobs`
contains the original job ID with status "done":

After the existing `expect(statusAfter.recentJobs[0].status).toBe("done")`
add:

```typescript
expect(statusAfter.recentJobs.some((j: { id: number; status: string }) => j.id === latest!.id && j.status === "done")).toBe(true);
```

**Verify**: `npx vitest run src/app/api/scan/route.test.ts` -> all pass

## Test plan

- Update `src/app/api/scan/route.test.ts` resume test to verify the same job
  ID is completed (not a new job).
- Existing test pattern: the resume test at lines 127-150 is the structural
  model.
- Verification: `npx vitest run` -> all pass, including the updated resume test.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` exits 0; updated resume test passes
- [ ] `grep -n "createScanJob" src/lib/albion/scanner.ts` shows
      `existingJobId` guard before `createScanJob` (not unconditional)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase has drifted since this plan was written).
- The `scanItems` function signature has changed significantly or other
  callers depend on the current signature in a way that breaks.
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.

## Maintenance notes

- The `existingJobId` parameter is optional, so all existing callers of
  `scanItems` that do not pass it will continue to create new jobs as before.
- If scan resumption is extended in the future to resume from the last
  scanned batch (rather than restarting from scratch), the `items_done` field
  in the job row should be used to skip already-scanned batches. This plan
  only fixes the job duplication bug, not the restart-from-zero behavior.
- The redundant `updateScanJob` call in the route can be kept or removed;
  it is idempotent. Keeping it provides a faster "running" status update
  before the async scan starts.
