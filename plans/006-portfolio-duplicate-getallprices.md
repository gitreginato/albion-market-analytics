# Plan 006: Eliminate duplicate getAllPrices() call in portfolio route

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c931121..HEAD -- src/app/api/portfolio/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `c931121`, 2025-07-14

## Why this matters

The portfolio route calls `getAllPrices()` twice within a single request:
first at line 54 to extract distinct item IDs, then again at line 86 to build
price date maps for historical enrichment. Each call scans the entire
`prices` table and builds a large in-memory array. On a database with
thousands of price rows, this doubles the memory and query time for a single
portfolio request.

## Current state

### File: `src/app/api/portfolio/route.ts`

First call at line 54 (inside the `try` block):

```typescript
// line 54
let itemIds = Array.from(new Set(getAllPrices().map((r) => r.item_id)));
```

Second call at line 86:

```typescript
// line 86
const allPrices = getAllPrices();
const { buyPriceDates, bmPriceDates } = buildPriceDateMaps(allPrices);
```

Between these two calls, `allPrices` is not needed. The first call only
extracts `item_id` values. The second call needs the full price rows for
`buildPriceDateMaps`.

### File: `src/lib/db/repository.ts`

The `getAllPrices` function (around line 250) returns `PriceRow[]`:

```typescript
export function getAllPrices(): PriceRow[] {
  const db = getDb();
  return db.prepare("SELECT * FROM prices").all() as PriceRow[];
}
```

This is a full table scan with no filtering.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Test      | `npx vitest run`         | all pass            |
| Lint      | `npx next lint`          | exit 0              |

## Scope

**In-scope files:**
- `src/app/api/portfolio/route.ts` (call `getAllPrices()` once, reuse the
  result for both item ID extraction and price date maps)

**Out-of-scope files:**
- `src/lib/db/repository.ts` (no changes needed)
- `src/lib/albion/portfolio.ts` (no changes needed)
- `src/lib/api/params.ts` (no changes needed)
- Any other file

## Steps

### Step 1: Move getAllPrices() call before the item ID extraction

In `src/app/api/portfolio/route.ts`, inside the `try` block (starting at
line 52), add a single `getAllPrices()` call before line 54, then reuse it
at line 86.

Replace lines 52-54:

```typescript
// Old (lines 52-54):
  try {
    // Get all item IDs from DB.
    let itemIds = Array.from(new Set(getAllPrices().map((r) => r.item_id)));

// New:
  try {
    // Get all prices from DB once; reused for item IDs and date maps.
    const allPrices = getAllPrices();

    // Get all item IDs from the price rows.
    let itemIds = Array.from(new Set(allPrices.map((r) => r.item_id)));
```

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 2: Remove the second getAllPrices() call

Replace lines 86-87:

```typescript
// Old (lines 86-87):
    const allPrices = getAllPrices();
    const { buyPriceDates, bmPriceDates } = buildPriceDateMaps(allPrices);

// New:
    const { buyPriceDates, bmPriceDates } = buildPriceDateMaps(allPrices);
```

The `allPrices` variable is now in scope from Step 1.

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 3: Verify no other getAllPrices calls exist in the route

Run:
```bash
grep -n "getAllPrices" src/app/api/portfolio/route.ts
```

Expected output: exactly one match at the new line in the `try` block.

**Verify**: `grep -c "getAllPrices" src/app/api/portfolio/route.ts` -> `1`

## Test plan

- No existing tests for the portfolio route. The change is a pure
  refactor (same data, fewer calls), so behavior is identical.
- If tests exist in `src/app/api/portfolio/route.test.ts`, they should pass
  unchanged.
- Verification: `npx vitest run` -> all pass.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` exits 0 (no regressions)
- [ ] `grep -c "getAllPrices" src/app/api/portfolio/route.ts` returns exactly
      `1`
- [ ] No files outside `src/app/api/portfolio/route.ts` are modified
      (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase has drifted since this plan was written).
- `getAllPrices` has been renamed or its return type has changed.
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.

## Maintenance notes

- The `allPrices` array is now held in memory for the entire request
  lifecycle. This is the same total memory as before (two transient arrays
  are replaced by one persistent array), so there is no memory regression.
- If the `prices` table grows very large (100k+ rows), consider adding a
  dedicated `getDistinctItemIds()` query to `repository.ts` that returns
  only distinct `item_id` values via `SELECT DISTINCT item_id FROM prices`.
  This would avoid loading all price rows just for the ID extraction. That
  optimization is out of scope for this plan.
