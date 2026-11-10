import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  sellerCount: vi.fn(),
  sellerFindMany: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  requireUser: mocks.requireUser
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sellerProfile: {
      count: mocks.sellerCount,
      findMany: mocks.sellerFindMany
    }
  }
}));

import { GET } from "@/app/api/admin/sellers/route";

describe("admin sellers route pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "admin-1" });
    mocks.sellerCount.mockResolvedValue(125);
    mocks.sellerFindMany.mockResolvedValue([{ id: "seller-101" }]);
  });

  it("applies page-based skip and returns pagination metadata", async () => {
    const response = await GET(new NextRequest("http://localhost/api/admin/sellers?page=3&status=APPROVED&q=Ada"));
    const body = await response.json();

    expect(mocks.sellerFindMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 50,
      skip: 100
    }));
    expect(body.pagination).toMatchObject({
      page: 3,
      pageSize: 50,
      totalItems: 125,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: false
    });
  });
});
