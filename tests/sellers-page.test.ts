import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ count: vi.fn(), findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { sellerProfile: mocks } }));
vi.mock("@/components/SellerCard", () => ({ SellerCard: () => null }));
import SellersPage from "@/app/sellers/page";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("React", React);
  mocks.count.mockResolvedValue(20);
  mocks.findMany.mockResolvedValue(Array.from({ length: 9 }, (_, id) => ({ id: String(id) })));
});

describe("public seller pagination", () => {
  it("queries nine approved sellers per page and preserves every filter in navigation", async () => {
    const html = renderToStaticMarkup(await SellersPage({ searchParams: Promise.resolve({ page: "2", q: "Ada", category: "Food", location: "Buea", stage: "Growth", support: "Funding" }) }));
    const where = mocks.count.mock.calls[0][0].where;
    expect(where).toMatchObject({ applicationStatus: "APPROVED", deletedAt: null, category: "Food", city: "Buea", businessStage: "Growth" });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where, take: 9, skip: 9 }));
    expect(html).toContain("Showing 10–18 of 20 entrepreneurs");
    expect(html).toContain("Page 2 of 3");
    expect(html).toContain("q=Ada&amp;category=Food&amp;location=Buea&amp;stage=Growth&amp;support=Funding&amp;page=3");
  });

  it("clamps out-of-range pages to the final page", async () => {
    mocks.findMany.mockResolvedValue([{ id: "19" }, { id: "20" }]);
    const html = renderToStaticMarkup(await SellersPage({ searchParams: Promise.resolve({ page: "999" }) }));
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 18, take: 9 }));
    expect(html).toContain("Showing 19–20 of 20 entrepreneurs");
    expect(html).toContain("Page 3 of 3");
    expect(html).not.toContain("page=4");
  });

  it("shows an empty state without pagination when no sellers match", async () => {
    mocks.count.mockResolvedValue(0);
    mocks.findMany.mockResolvedValue([]);
    const html = renderToStaticMarkup(await SellersPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("No approved entrepreneurs match");
    expect(html).not.toContain("Entrepreneur pagination");
  });
});
