# Plan 007: Add Zod input validation to five API routes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c931121..HEAD -- src/app/api/item-details/route.ts src/app/api/opportunities/route.ts src/app/api/portfolio/route.ts src/app/api/projections/route.ts src/app/api/items/search/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: hardening
- **Planned at**: commit `c931121`, 2025-07-14

## Why this matters

Four API routes (`scan`, `gold`, `history`, `prices`) already use Zod schemas
to validate and coerce query parameters. Five routes do not: `item-details`,
`opportunities`, `portfolio`, `projections`, and `items/search`. These routes
parse query params with raw `Number()`, `parseInt()`, and unchecked type
casts (`as ServerRegion`, `as ItemCategory`). Invalid input (non-numeric
strings where numbers are expected, unknown enum values) produces `NaN`,
silent defaults, or unexpected behavior instead of a clean 400 response.

## Current state

### Already-validated routes (reference pattern)

`src/app/api/scan/route.ts` lines 35-41:
```typescript
const scanQuerySchema = z.object({
  mode: z.enum(["start", "status", "cancel"]).default("start"),
  region: z.enum(["west", "east", "europe"]).default("west"),
  items: z.string().optional(),
  batch_size: z.coerce.number().int().min(1).max(100).default(DEFAULT_BATCH_SIZE),
  resume: z.enum(["true", "false"]).default("false"),
});
```

Usage pattern (lines 43-50):
```typescript
const parsed = scanQuerySchema.safeParse(Object.fromEntries(searchParams));
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
const { mode, region, items, batch_size: batchSize, resume } = parsed.data;
```

### Unvalidated route 1: `src/app/api/item-details/route.ts`

Lines 20-23:
```typescript
const params = request.nextUrl.searchParams;
const itemId = params.get("item_id");
const quality = parseInt(params.get("quality") ?? "1", 10);
const region = (params.get("region") as ServerRegion | null) ?? "west";
```

`quality` can be `NaN` if the param is non-numeric. `region` accepts any
string cast to `ServerRegion`.

### Unvalidated route 2: `src/app/api/opportunities/route.ts`

Lines 22-53: raw `Number()`, `parseInt()`, and string comparisons throughout.
No schema. `min_profit` and `limit` use `Number()` which returns `NaN` for
bad input.

### Unvalidated route 3: `src/app/api/portfolio/route.ts`

Lines 25-43: raw `Number()` for `investment`, `bankroll`, `survival_prob`,
`target_profit`, `min_profit`, `limit`, `min_consistency`, `max_age_hours`,
`min_volume`, `min_margin`, `max_units_per_item`. All can silently produce
`NaN`.

### Unvalidated route 4: `src/app/api/projections/route.ts`

Lines 52-67: raw `parseInt()`, `Number()`, and unchecked `as` casts for
`region`, `transport`, `category`.

### Unvalidated route 5: `src/app/api/items/search/route.ts`

Lines 8-11:
```typescript
const params = request.nextUrl.searchParams;
const q = params.get("q") ?? "";
const limitParam = params.get("limit");
const limit = limitParam ? Math.min(Number(limitParam), 100) : 20;
```

`limit` can be `NaN` if `limitParam` is non-numeric, which would break
`searchFullCatalog`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0              |
| Test      | `npx vitest run`         | all pass            |
| Lint      | `npx next lint`          | exit 0              |

## Scope

**In-scope files:**
- `src/app/api/item-details/route.ts`
- `src/app/api/opportunities/route.ts`
- `src/app/api/portfolio/route.ts`
- `src/app/api/projections/route.ts`
- `src/app/api/items/search/route.ts`

**Out-of-scope files:**
- `src/lib/api/params.ts` (helper functions like `parseRegion` can stay; Zod
  replaces the need for them in these routes, but they are used by other
  callers too)
- `src/app/api/health/route.ts` (no query params, no validation needed)
- Any other file

## Steps

### Step 1: Add Zod schema to item-details route

In `src/app/api/item-details/route.ts`, add import and schema after line 17:

```typescript
import { z } from "zod";

const itemDetailsSchema = z.object({
  item_id: z.string().min(1),
  quality: z.coerce.number().int().min(1).max(5).default(1),
  region: z.enum(["west", "east", "europe"]).default("west"),
});
```

Then replace lines 20-27 with:

```typescript
const parsed = itemDetailsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
const { item_id: itemId, quality, region } = parsed.data;
```

Remove the `if (!itemId) { ... }` check since Zod already enforces `min(1)`.

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 2: Add Zod schema to items/search route

In `src/app/api/items/search/route.ts`, add import and schema:

```typescript
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().default(""),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

Then replace lines 8-11 with:

```typescript
const parsed = searchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
const { q, limit } = parsed.data;
```

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 3: Add Zod schema to projections route

In `src/app/api/projections/route.ts`, add import and schema after line 23:

```typescript
import { z } from "zod";

const projectionsSchema = z.object({
  tier: z.coerce.number().int().min(1).max(8).default(6),
  tiers: z.string().optional(),
  category: z.enum(["raw", "refined", "gear"]).optional(),
  categories: z.string().optional(),
  qualities: z.string().optional(),
  use_premium: z.enum(["true", "false"]).default("false"),
  mount: z.string().optional(),
  transport: z.enum(["fast", "manual"]).default("fast"),
  min_margin: z.coerce.number().min(0).default(0),
  min_volume: z.coerce.number().min(0).default(0),
  min_consistency: z.coerce.number().min(0).max(100).default(0),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  region: z.enum(["west", "east", "europe"]).default("west"),
});
```

Then replace lines 52-67 with parsed values. Keep the existing `parseTiers`,
`parseCategories`, `parseQualities` helper functions but pass them the parsed
string values instead of raw `params.get()`.

```typescript
const parsed = projectionsSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
const { tier, tiers: tiersParam, category, categories: catsParam, qualities: qParam, use_premium, mount: mountParam, transport: transportMode, min_margin: minMargin, min_volume: minVolume, min_consistency: minConsistency, limit, region } = parsed.data;

const usePremium = use_premium === "true";
const mount = mountParam ? getMountById(mountParam) : undefined;
// Keep using the existing parseTiers/parseCategories/parseQualities helpers
// by constructing a mini URLSearchParams or refactoring them to accept strings.
```

Note: the existing `parseTiers`, `parseCategories`, `parseQualities` functions
take `URLSearchParams`. You can either:
(a) Refactor them to accept `string | null` instead of `URLSearchParams`, or
(b) Keep them and pass `new URLSearchParams({ tiers: tiersParam })`.

Option (a) is cleaner. Change each helper to accept `string | undefined`:

```typescript
function parseTiers(param: string | undefined): number[] | undefined {
  if (param) {
    return param.split(",").map((t) => parseInt(t.trim(), 10)).filter((t) => !isNaN(t) && t >= 1 && t <= 8);
  }
  return undefined;
}
```

Apply the same pattern to `parseCategories` and `parseQualities`.

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 4: Add Zod schema to opportunities route

In `src/app/api/opportunities/route.ts`, add import and schema after line 18:

```typescript
import { z } from "zod";

const opportunitiesSchema = z.object({
  region: z.enum(["west", "east", "europe"]).default("west"),
  items: z.string().optional(),
  min_profit: z.coerce.number().default(0),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  use_focus: z.enum(["true", "false"]).default("false"),
  use_premium: z.enum(["true", "false"]).default("true"),
  mount: z.string().optional(),
  tiers: z.string().optional(),
  buy_city: z.string().optional(),
  sell_city: z.string().optional(),
  qualities: z.string().optional(),
  category: z.string().optional(),
  enrich_bm: z.enum(["true", "false"]).default("false"),
});
```

Then replace lines 22-53 with parsed values. Keep `parseRegion`,
`parseTierFilter`, `parseCategoryFilter`, `parseMount` calls but pass the
parsed string values.

```typescript
const parsed = opportunitiesSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
const { region, items: itemsParam, min_profit: minProfit, limit, use_focus, use_premium, mount: mountParam, tiers: tiersParam, buy_city: buyCityFilter, sell_city: sellCityFilter, qualities: qualityParam, category: categoryParam, enrich_bm } = parsed.data;

const useFocus = use_focus === "true";
const usePremium = use_premium === "true";
const enrichBm = enrich_bm === "true";
const useAllItems = itemsParam === "all";
const { maxLoadKg: mountMaxLoadKg } = parseMount(mountParam);
const tierFilter = parseTierFilter(tiersParam);
const categoryFilter = parseCategoryFilter(categoryParam);
const itemIds = useAllItems
  ? []
  : itemsParam
    ? itemsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SCAN_ITEMS;
const qualityFilter = qualityParam
  ? new Set(qualityParam.split(",").map((q) => parseInt(q.trim(), 10)).filter((q) => q >= 1 && q <= 5))
  : null;
```

Note: `parseRegion` currently takes `URLSearchParams`. If it does, either
refactor it to accept a string, or use the Zod-parsed `region` directly (it
is already validated as `ServerRegion`). Since Zod handles the enum
validation, you can use `region` directly and drop the `parseRegion` call.

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 5: Add Zod schema to portfolio route

In `src/app/api/portfolio/route.ts`, add import and schema after line 22:

```typescript
import { z } from "zod";

const portfolioSchema = z.object({
  region: z.enum(["west", "east", "europe"]).default("west"),
  investment: z.coerce.number().positive().default(10_000_000),
  bankroll: z.coerce.number().positive().optional(),
  survival_prob: z.coerce.number().min(0.01).max(0.99).default(0.90),
  mount: z.string().optional(),
  target_profit: z.coerce.number().positive().default(33_000_000),
  min_profit: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  min_consistency: z.coerce.number().min(0).max(100).default(50),
  max_age_hours: z.coerce.number().positive().default(24),
  min_volume: z.coerce.number().min(0).default(1),
  min_margin: z.coerce.number().default(0),
  city: z.string().optional(),
  use_full_budget: z.enum(["true", "false"]).default("false"),
  max_units_per_item: z.coerce.number().int().min(1).default(20),
  tiers: z.string().optional(),
  category: z.string().optional(),
});
```

Then replace lines 25-43 with parsed values:

```typescript
const parsed = portfolioSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
const { region, investment, bankroll: bankrollParam, survival_prob, mount: mountParam, target_profit: targetProfit, min_profit: minProfit, limit, min_consistency: minConsistency, max_age_hours: maxAgeHours, min_volume: minVolume, min_margin: minMargin, city: cityFilter, use_full_budget, max_units_per_item: maxUnitsPerItem, tiers: tiersParam, category: categoryParam } = parsed.data;

const bankroll = bankrollParam ?? investment;
const useFullBudget = use_full_budget === "true";
const { mount, maxLoadKg: mountMaxLoadKg } = parseMount(mountParam);
const tierFilter = parseTierFilter(tiersParam);
const categoryFilter = parseCategoryFilter(categoryParam);
```

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 6: Verify all five routes now use Zod

Run:
```bash
grep -l "from \"zod\"" src/app/api/item-details/route.ts src/app/api/opportunities/route.ts src/app/api/portfolio/route.ts src/app/api/projections/route.ts src/app/api/items/search/route.ts
```

Expected: all 5 files listed.

Run:
```bash
grep -c "safeParse" src/app/api/item-details/route.ts src/app/api/opportunities/route.ts src/app/api/portfolio/route.ts src/app/api/projections/route.ts src/app/api/items/search/route.ts
```

Expected: each file shows `1`.

## Test plan

- Add a test for each route that sends an invalid query param (e.g.,
  `?quality=abc` for item-details) and verifies a 400 response with error
  details.
- Add a test that sends valid params and verifies the response is unchanged.
- Model after `src/app/api/scan/route.test.ts` for structure.
- Verification: `npx vitest run` -> all pass.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` exits 0 (no regressions)
- [ ] All 5 in-scope routes import `zod` and call `safeParse`
- [ ] `grep -rn "as ServerRegion\|as ItemCategory" src/app/api/` returns no
      matches in the 5 in-scope files (no more unchecked type casts)
- [ ] No files outside the in-scope list are modified (`git status`), except
      for new test files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase has drifted since this plan was written).
- Adding Zod validation changes the default values or behavior in a way that
  breaks existing tests or the frontend.
- `parseRegion`, `parseTierFilter`, `parseCategoryFilter`, or `parseMount` in
  `src/lib/api/params.ts` have signatures that make refactoring the call
  sites difficult (they may need to be updated, which is out of scope).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.

## Maintenance notes

- The `parseRegion`, `parseTierFilter`, `parseCategoryFilter`, and
  `parseMount` helpers in `src/lib/api/params.ts` become partially redundant
  once Zod handles enum validation and numeric coercion. They are kept for
  backward compatibility with other callers. Consider deprecating them in a
  future refactor.
- The `z.coerce.number()` transform accepts both strings and numbers. If a
  query param is omitted entirely, the `.default()` value is used. If it is
  present but empty (`?limit=`), `z.coerce.number()` will produce `0`, which
  may fail `.min(1)` and return a 400. This is the desired behavior.
- For routes that use `parseTiers`/`parseCategories`/`parseQualities` helper
  functions that take `URLSearchParams`, the cleanest approach is to
  refactor them to accept `string | undefined`. This is a small change within
  the same file (projections route) and does not violate the out-of-scope
  constraint since those helpers are defined in the route file itself, not in
  `src/lib/api/params.ts`.
