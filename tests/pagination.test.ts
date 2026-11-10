import { describe, expect, it } from "vitest";
import { paginationHref, paginationState, parsePage } from "@/lib/pagination";

describe("pagination helpers", () => {
  it("parses only positive integer page values", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("2.5")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });

  it("calculates skip and clamps pages to available results", () => {
    expect(paginationState({ page: 2, totalItems: 125, pageSize: 50 })).toMatchObject({
      page: 2,
      totalPages: 3,
      skip: 50,
      hasPreviousPage: true,
      hasNextPage: true
    });

    expect(paginationState({ page: 99, totalItems: 125, pageSize: 50 })).toMatchObject({
      page: 3,
      totalPages: 3,
      skip: 100,
      hasPreviousPage: true,
      hasNextPage: false
    });
  });

  it("builds filter-preserving hrefs and omits page one", () => {
    expect(paginationHref("/admin", { q: "Ada Textiles", status: "APPROVED" }, 2)).toBe("/admin?q=Ada+Textiles&status=APPROVED&page=2");
    expect(paginationHref("/admin", { q: undefined, status: "SUBMITTED" }, 1)).toBe("/admin?status=SUBMITTED");
  });
});
