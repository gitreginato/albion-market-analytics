# Plan 001: Fix projections panel filters being no-ops (fetch ignores all filter state)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c931121..HEAD -- src/components/dashboard/opportunities-panel.tsx src/app/api/projections/route.ts`
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

The projections panel has an elaborate filter UI (tiers, categories, qualities,
min margin, min volume, min consistency, mount, transport mode, premium, sort).
None of these filters are sent to the API. The `fetchProjections` callback only
sends `region` in the query string, so every "Calcular" click returns the same
unfiltered server-default results (tier 6, no category filter, no mount, fast
transport, non-premium, min margin 0, min volume 0, min consistency 0, limit
100). Users change filters, click "Calcular", and see no change in results.

## Current state

### File: `src/components/dashboard/opportunities-panel.tsx`

The filter state is declared at lines 129-137:

```typescript
// lines 129-137
const [projTiers, setProjTiers] = useState<Set<number>>(new Set([6]));
const [projCategories, setProjCategories] = useState<Set<ProjCategory>>(new Set());
const [projQualities, setProjQualities] = useState<Set<number>>(new Set());
const [projSortBy, setProjSortBy] = useState<ProjSortBy>("margin7d");
const [projTransportMode, setProjTransportMode] = useState<"fast" | "manual">("fast");
const [projMountId, setProjMountId] = useState<string>(DEFAULT_MOUNT_ID);
const [projMinMargin, setProjMinMargin] = useState(40);
const [projMinVolume, setProjMinVolume] = useState(10);
const [projMinConsistency, setProjMinConsistency] = useState(80);
```

But `fetchProjections` at lines 202-220 only sends `region`:

```typescript
// lines 202-220
const fetchProjections = useCallback(async () => {
  projectionsAbortRef.current?.abort();
  const controller = new AbortController();
  projectionsAbortRef.current = controller;
  setProjectionsLoading(true);
  setProjectionsError(null);
  try {
    const res = await fetch(`/api/projections?region=${region}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Projections failed: ${res.status}`);
    const json = (await res.json()) as { projections: BmProjection[] };
    setProjections(json.projections);
  } catch (err) {
    if (err instanceof Error && err.name !== "AbortError") {
      setProjectionsError(err.message);
    }
  } finally {
    setProjectionsLoading(false);
  }
}, [region]);
```

The `usePremium` state is at line 114:

```typescript
// line 114
const [usePremium, setUsePremium] = useState(true);
```

### File: `src/app/api/projections/route.ts`

The API route already accepts all the needed query params (lines 50-67):

```typescript
// lines 50-67
const tier = params.get("tier") ? parseInt(params.get("tier")!, 10) : 6;
const tiers = parseTiers(params);
const categoryParam = params.get("category");
const category = categoryParam as ItemCategory | null;
const categories = parseCategories(params);
const qualities = parseQualities(params);
const usePremium = params.get("use_premium") === "true";
const mountParam = params.get("mount");
const mount = mountParam ? getMountById(mountParam) : undefined;
const transportMode = (params.get("transport") as "fast" | "manual") ?? "fast";
const minMargin = params.get("min_margin") ? Number(params.get("min_margin")) : 0;
const minVolume = params.get("min_volume") ? Number(params.get("min_volume")) : 0;
const minConsistency = params.get("min_consistency") ? Number(params.get("min_consistency")) : 0;
const limit = params.get("limit") ? Math.min(Number(params.get("limit")), 200) : 100;
const region = (params.get("region") as ServerRegion | null) ?? "west";
```

### File: `src/components/dashboard/projections-panel.tsx`

The `ProjectionsPanel` component receives all filter props (lines 200-250) and
renders the filter UI, but the `onFetch` callback it calls is the one from the
parent `opportunities-panel.tsx` which does not pass the filters to the API.

### Convention

The `fetchPortfolio` callback in the same file (lines 222-251) shows the correct
pattern: it builds a `URLSearchParams` from the filter state and passes it to
the API. Follow that pattern.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Test      | `npx vitest run`         | all pass            |
| Lint      | `npx next lint`          | exit 0              |

## Scope

**In-scope files:**
- `src/components/dashboard/opportunities-panel.tsx` (modify `fetchProjections` callback)

**Out-of-scope files:**
- `src/app/api/projections/route.ts` (already accepts all params)
- `src/components/dashboard/projections-panel.tsx` (already renders filter UI)
- Any other file

## Steps

### Step 1: Update `fetchProjections` to send all filter params

Replace the `fetchProjections` callback (lines 202-220 in
`src/components/dashboard/opportunities-panel.tsx`) with a version that builds
a `URLSearchParams` from all proj* state variables and `usePremium`.

The new callback should:

1. Build `URLSearchParams` with:
   - `region` (already present)
   - `tiers`: comma-separated values from `projTiers` (if set has entries)
   - `categories`: comma-separated values from `projCategories` (if non-empty)
   - `qualities`: comma-separated values from `projQualities` (if non-empty)
   - `use_premium`: `String(usePremium)`
   - `mount`: `projMountId`
   - `transport`: `projTransportMode`
   - `min_margin`: `String(projMinMargin)`
   - `min_volume`: `String(projMinVolume)`
   - `min_consistency`: `String(projMinConsistency)`
2. Fetch from `/api/projections?${params.toString()}`
3. Keep the AbortController logic unchanged.

Model the URLSearchParams construction after `fetchPortfolio` (lines 229-239):

```typescript
const params = new URLSearchParams({ region });
if (projTiers.size > 0) params.set("tiers", Array.from(projTiers).join(","));
if (projCategories.size > 0) params.set("categories", Array.from(projCategories).join(","));
if (projQualities.size > 0) params.set("qualities", Array.from(projQualities).join(","));
params.set("use_premium", String(usePremium));
params.set("mount", projMountId);
params.set("transport", projTransportMode);
params.set("min_margin", String(projMinMargin));
params.set("min_volume", String(projMinVolume));
params.set("min_consistency", String(projMinConsistency));
```

Update the `useCallback` dependency array to include all the proj* state
variables and `usePremium`:

```typescript
}, [region, projTiers, projCategories, projQualities, usePremium, projMountId,
    projTransportMode, projMinMargin, projMinVolume, projMinConsistency]);
```

**Verify**: `npx tsc --noEmit` -> exit 0 (no type errors)

### Step 2: Add client-side sort for `projSortBy`

The API returns projections sorted by `margin7d` descending. The `projSortBy`
state lets the user pick a different sort, but it is never applied. After
setting projections from the API response, sort them client-side based on
`projSortBy`.

In the `fetchProjections` callback, after `setProjections(json.projections)`,
add a sort before setting state. Alternatively, apply the sort in a `useMemo`
derived from `projections` and `projSortBy`:

```typescript
const sortedProjections = useMemo(() => {
  const sorted = [...projections];
  switch (projSortBy) {
    case "margin7d": sorted.sort((a, b) => b.margin7d - a.margin7d); break;
    case "consistency": sorted.sort((a, b) => b.consistency - a.consistency); break;
    case "volume7d": sorted.sort((a, b) => b.volume7d - a.volume7d); break;
    case "profitPerLoad": sorted.sort((a, b) => b.profitPerLoad - a.profitPerLoad); break;
    case "profitPerUnit": sorted.sort((a, b) => b.profitPerUnit - a.profitPerUnit); break;
  }
  return sorted;
}, [projections, projSortBy]);
```

Then pass `sortedProjections` instead of `projections` to `LazyProjectionsPanel`
(line 391).

**Verify**: `npx tsc --noEmit` -> exit 0

## Test plan

- No new test files needed for this fix (UI wiring fix).
- Existing tests should still pass: `npx vitest run` -> all pass.
- Manual verification: run `npm run dev`, open the opportunities panel, switch
  to "Projeções BM" sub-tab, change tier/category/margin filters, click
  "Calcular", and confirm the results change.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` exits 0 (no regressions)
- [ ] `grep -n "region=\${region}" src/components/dashboard/opportunities-panel.tsx`
      does NOT match a fetch URL with only `region` (the new code builds
      URLSearchParams with all filters)
- [ ] No files outside `src/components/dashboard/opportunities-panel.tsx` are
      modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase has drifted since this plan was written).
- The `fetchProjections` callback signature or location has changed
  significantly.
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.

## Maintenance notes

- If new filter state is added to the projections panel in the future, it must
  also be added to the `URLSearchParams` in `fetchProjections` and to the
  `useCallback` dependency array.
- The API route at `src/app/api/projections/route.ts` already accepts all
  params, so no server changes are needed for future filter additions.
- The client-side sort is a fallback because the API does not support a `sort`
  query param. If server-side sorting is added later, the client sort can be
  removed.
