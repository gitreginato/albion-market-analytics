# Plan 005: Fix item-details route using wrong fee formula for profit calculation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c931121..HEAD -- src/app/api/item-details/route.ts`
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

The item-details endpoint computes arbitrage and Black Market profit using a
formula that applies a phantom 4% fee on the buy side (`buyPrice * 1.04`) and
misses the 2.5% setup fee on city sell orders (`sellPrice * 0.96` only deducts
4% sales tax, not the setup fee). This produces incorrect profit numbers in
the item detail modal. The correct formulas are already implemented in
`src/lib/albion/opportunities.ts` and `src/lib/albion/city-config.ts`, so this
is a matter of using the right constants and structure.

## Current state

### File: `src/app/api/item-details/route.ts`

The arbitrage calculation at lines 107-123:

```typescript
// lines 107-123
const arbitrageOps = validBuyCities.length > 0
  ? cityPrices
      .filter((p) => p.city !== "Black Market" && p.buyPriceMax > 0 && p.city !== bestBuy?.city)
      .map((p) => {
        const profit = p.buyPriceMax * 0.96 - bestBuy!.sellPriceMin * 1.04;
        const margin = bestBuy!.sellPriceMin > 0 ? (profit / bestBuy!.sellPriceMin) * 100 : 0;
        return {
          sellCity: p.city,
          sellPrice: p.buyPriceMax,
          buyPrice: bestBuy!.sellPriceMin,
          profit: Math.round(profit),
          margin: Math.round(margin),
        };
      })
      .filter((op) => op.profit > 0)
      .sort((a, b) => b.profit - a.profit)
  : [];
```

The formula `p.buyPriceMax * 0.96 - bestBuy!.sellPriceMin * 1.04` is wrong:
- `p.buyPriceMax * 0.96`: only deducts 4% sales tax, missing the 2.5% setup
  fee for placing a sell order. Should be `p.buyPriceMax * (1 - SETUP_FEE - SALES_TAX)`.
- `bestBuy!.sellPriceMin * 1.04`: adds 4% to the buy price. There is no fee
  when buying instantly from a sell order. Should be just `bestBuy!.sellPriceMin`.

The BM opportunity calculation at lines 126-136:

```typescript
// lines 126-136
const bmOpportunity = bmPrice && bmPrice.buyPriceMax > 0 && bestBuy
  ? {
      buyCity: bestBuy.city,
      buyPrice: bestBuy.sellPriceMin,
      bmPrice: bmPrice.buyPriceMax,
      profit: Math.round(bmPrice.buyPriceMax * 0.96 - bestBuy.sellPriceMin * 1.04),
      margin: bestBuy.sellPriceMin > 0
        ? Math.round(((bmPrice.buyPriceMax * 0.96 - bestBuy.sellPriceMin * 1.04) / bestBuy.sellPriceMin) * 100)
        : 0,
    }
  : null;
```

Same issue: `* 1.04` on the buy price is wrong. For BM, there is no setup fee
(instant sell to buy order), only 4% sales tax. So `bmPrice * 0.96` is correct
for the sell side, but `buyPrice * 1.04` is wrong.

### Correct formulas (reference)

From `src/lib/albion/city-config.ts`:

```typescript
// line 79
export const SELL_ORDER_SETUP_FEE = 0.025; // 2.5%
// line 86
export const SALES_TAX_PREMIUM = 0.04;
// line 94
export const BLACK_MARKET_SALES_TAX = SALES_TAX_PREMIUM; // 4%
```

From `src/lib/albion/opportunities.ts` (the correct implementation):

Arbitrage (lines 311-316):
```typescript
const transportCost = getTransportCost(cheapest.sellPrice, cheapest.city, mostExpensive.city);
const setupFee = Math.round(mostExpensive.sellPrice * SELL_ORDER_SETUP_FEE);
const salesTaxRate = usePremium ? SALES_TAX_PREMIUM : SALES_TAX_NON_PREMIUM;
const salesTax = Math.round(mostExpensive.sellPrice * salesTaxRate);
const revenue = mostExpensive.sellPrice * (1 - sellFees) - transportCost;
const profit = revenue - cheapest.sellPrice;
```

Black Market (lines 396-399):
```typescript
const transportCost = getTransportCost(bestSell.price, city, "Black Market");
const salesTax = Math.round(bmBuy.price * BLACK_MARKET_SALES_TAX);
const revenue = bmBuy.price * (1 - BLACK_MARKET_SALES_TAX) - transportCost;
const profit = revenue - bestSell.price;
```

### File: `src/components/dashboard/arbitrage-panel.tsx`

The arbitrage panel also computes profit (lines 273-278) with the correct
formula including setup fee:

```typescript
// lines 273-278
const gross = sellCity.buyMax - buyCity.sellMin;
const transportCost = transportMode === "fast" ? Math.round(buyCity.sellMin * 0.1) : 0;
const sellFee = Math.round(sellCity.buyMax * (taxRate + setupFee));
const net = gross - transportCost - sellFee;
const margin = (net / buyCity.sellMin) * 100;
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
- `src/app/api/item-details/route.ts` (fix the two profit formulas)

**Out-of-scope files:**
- `src/lib/albion/city-config.ts` (constants are correct)
- `src/lib/albion/opportunities.ts` (correct reference implementation)
- `src/components/dashboard/arbitrage-panel.tsx` (already correct)
- Any other file

## Steps

### Step 1: Import the correct fee constants

At the top of `src/app/api/item-details/route.ts`, add imports for the fee
constants from `city-config`:

```typescript
import {
  SELL_ORDER_SETUP_FEE,
  SALES_TAX_PREMIUM,
  BLACK_MARKET_SALES_TAX,
  getTransportCost,
} from "@/lib/albion/city-config";
```

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 2: Fix the arbitrage profit formula

Replace the arbitrage calculation (lines 107-123) with the correct formula.

The correct arbitrage formula for city-to-city sell orders:
- Revenue = `sellPrice * (1 - SETUP_FEE - SALES_TAX)` (setup + sales tax)
- Cost = `buyPrice` (no fee on instant buy from sell order)
- Profit = Revenue - Cost

```typescript
const arbitrageOps = validBuyCities.length > 0
  ? cityPrices
      .filter((p) => p.city !== "Black Market" && p.buyPriceMax > 0 && p.city !== bestBuy?.city)
      .map((p) => {
        const sellFees = SELL_ORDER_SETUP_FEE + SALES_TAX_PREMIUM;
        const revenue = p.buyPriceMax * (1 - sellFees);
        const profit = revenue - bestBuy!.sellPriceMin;
        const margin = bestBuy!.sellPriceMin > 0 ? (profit / bestBuy!.sellPriceMin) * 100 : 0;
        return {
          sellCity: p.city,
          sellPrice: p.buyPriceMax,
          buyPrice: bestBuy!.sellPriceMin,
          profit: Math.round(profit),
          margin: Math.round(margin),
        };
      })
      .filter((op) => op.profit > 0)
      .sort((a, b) => b.profit - a.profit)
  : [];
```

Note: transport cost is not included here because the original code did not
include it either. Adding transport cost would change the API response shape
and is out of scope for this bug fix. The fix is limited to correcting the fee
formula.

**Verify**: `npx tsc --noEmit` -> exit 0

### Step 3: Fix the BM opportunity profit formula

Replace the BM opportunity calculation (lines 126-136) with the correct
formula. For Black Market: no setup fee, only 4% sales tax. No fee on buy
side.

```typescript
const bmOpportunity = bmPrice && bmPrice.buyPriceMax > 0 && bestBuy
  ? {
      buyCity: bestBuy.city,
      buyPrice: bestBuy.sellPriceMin,
      bmPrice: bmPrice.buyPriceMax,
      profit: Math.round(bmPrice.buyPriceMax * (1 - BLACK_MARKET_SALES_TAX) - bestBuy.sellPriceMin),
      margin: bestBuy.sellPriceMin > 0
        ? Math.round(((bmPrice.buyPriceMax * (1 - BLACK_MARKET_SALES_TAX) - bestBuy.sellPriceMin) / bestBuy.sellPriceMin) * 100)
        : 0,
    }
  : null;
```

**Verify**: `npx tsc --noEmit` -> exit 0

## Test plan

- No existing tests for the item-details route. Add a simple test file
  `src/app/api/item-details/route.test.ts` that verifies:
  1. Returns 400 when `item_id` is missing.
  2. Returns correct profit for a known price scenario (buy=1000, BM sell=1500,
     expected profit = 1500 * 0.96 - 1000 = 440, not the old 1500*0.96 - 1000*1.04 = 380).
  3. Returns correct arbitrage profit (buy=1000, sell=1500, expected profit =
     1500 * (1 - 0.025 - 0.04) - 1000 = 1500 * 0.935 - 1000 = 402.5 -> 403).
- Model after `src/app/api/scan/route.test.ts` for structure.
- Verification: `npx vitest run` -> all pass, including new tests.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` exits 0; new tests for item-details profit calculation
      exist and pass
- [ ] `grep -n "\* 1.04" src/app/api/item-details/route.ts` returns no matches
      (the phantom buy-side fee is gone)
- [ ] `grep -n "SELL_ORDER_SETUP_FEE\|BLACK_MARKET_SALES_TAX" src/app/api/item-details/route.ts`
      returns matches (the correct constants are used)
- [ ] No files outside `src/app/api/item-details/route.ts` (and the new test
      file) are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase has drifted since this plan was written).
- The fee constants in `src/lib/albion/city-config.ts` have changed or been
  renamed.
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.

## Maintenance notes

- The item-details route does not currently include transport costs in the
  profit calculation. This is a known limitation. If transport costs are added
  later, use `getTransportCost` from `city-config.ts` (already imported in
  Step 1).
- The route hardcodes premium rates (4% sales tax, 2.5% setup). If non-premium
  support is needed, add a `use_premium` query param and use
  `getSellOrderFees()` from `city-config.ts`.
- The `getTransportCost` import added in Step 1 is not used in this fix but is
  available for future use. Remove it if lint complains about unused imports.
