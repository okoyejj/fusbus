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
  mocks.count.mockResolvedValue(30);
  mocks.findMany.mockResolvedValue(Array.from({ length: 12 }, (_, id) => ({ id: String(id) })));
});

describe("public seller pagination", () => {
  it("queries twelve approved sellers per page and preserves every filter in navigation", async () => {
    const html = renderToStaticMarkup(await SellersPage({ searchParams: Promise.resolve({ page: "2", q: "Ada", category: "Food", location: "Buea", stage: "Growth", support: "Funding" }) }));
    const where = mocks.count.mock.calls[0][0].where;
    expect(where).toMatchObject({ applicationStatus: "APPROVED", deletedAt: null, category: "Food", city: "Buea", businessStage: "Growth" });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where, take: 12, skip: 12 }));
    expect(html).toContain("Showing 13–24 of 30 entrepreneurs");
    expect(html).toContain("Page 2 of 3");
    expect(html).toContain("q=Ada&amp;category=Food&amp;location=Buea&amp;stage=Growth&amp;support=Funding&amp;page=3");
  });

  it("clamps out-of-range pages to the final page", async () => {
    mocks.findMany.mockResolvedValue(Array.from({ length: 6 }, (_, id) => ({ id: String(id + 25) })));
    const html = renderToStaticMarkup(await SellersPage({ searchParams: Promise.resolve({ page: "999" }) }));
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 24, take: 12 }));
    expect(html).toContain("Showing 25–30 of 30 entrepreneurs");
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
