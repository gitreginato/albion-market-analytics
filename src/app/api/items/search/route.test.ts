import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { __resetCatalogForTests } from "@/lib/albion/catalog";
import { GET as itemsSearchGET } from "@/app/api/items/search/route";

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

async function callSearch(path: string) {
  const res = await itemsSearchGET(makeRequest(path));
  return { status: res.status, body: await res.json() };
}

describe("GET /api/items/search", () => {
  beforeEach(() => {
    __resetCatalogForTests();
    vi.mocked(globalThis.fetch).mockClear();
  });

  it("returns items matching the query from the full catalog", async () => {
    // Mock the items.json fetch from GitHub.
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          UniqueName: "T4_BAG",
          LocalizedNames: { "EN-US": "Adept's Bag" },
          Index: "100",
        },
        {
          UniqueName: "T5_BAG",
          LocalizedNames: { "EN-US": "Expert's Bag" },
          Index: "101",
        },
        {
          UniqueName: "T4_MAIN_SWORD",
          LocalizedNames: { "EN-US": "Adept's Broadsword" },
          Index: "102",
        },
      ],
    } as Response);

    const { status, body } = await callSearch("/api/items/search?q=bag&limit=10");
    expect(status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe("T4_BAG");
    expect(body[0].name).toBe("Adept's Bag");
  });

  it("returns the first N items when query is empty", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { UniqueName: "T4_BAG", LocalizedNames: { "EN-US": "Bag" } },
        { UniqueName: "T5_BAG", LocalizedNames: { "EN-US": "Bag2" } },
      ],
    } as Response);

    const { status, body } = await callSearch("/api/items/search?q=&limit=1");
    expect(status).toBe(200);
    expect(body).toHaveLength(1);
  });

  it("filters out non-tradable items (tools, journals, hideouts)", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        { UniqueName: "T4_BAG", LocalizedNames: { "EN-US": "Bag" } },
        { UniqueName: "T4_2H_TOOL_TRACKING", LocalizedNames: { "EN-US": "Tool" } },
        { UniqueName: "UNIQUE_HIDEOUT", LocalizedNames: { "EN-US": "Hideout" } },
        { UniqueName: "T4_JOURNAL", LocalizedNames: { "EN-US": "Journal" } },
      ],
    } as Response);

    const { body } = await callSearch("/api/items/search?q=&limit=10");
    const ids = (body as { id: string }[]).map((b) => b.id);
    expect(ids).toContain("T4_BAG");
    expect(ids).not.toContain("T4_2H_TOOL_TRACKING");
    expect(ids).not.toContain("UNIQUE_HIDEOUT");
    expect(ids).not.toContain("T4_JOURNAL");
  });

  it("respects the limit parameter (max 100)", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => Array.from({ length: 5 }, (_, i) => ({
        UniqueName: `T4_ITEM_${i}`,
        LocalizedNames: { "EN-US": `Item ${i}` },
      })),
    } as Response);

    const { body } = await callSearch("/api/items/search?q=item&limit=3");
    expect(body).toHaveLength(3);
  });
});
