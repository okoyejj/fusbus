import { describe, expect, it } from "vitest";
import { publicSellerSelect } from "@/lib/public-select";

describe("public seller field selection", () => {
  it("does not expose private seller contact fields", () => {
    expect(publicSellerSelect).not.toHaveProperty("phoneNumber");
    expect(publicSellerSelect).not.toHaveProperty("whatsappNumber");
    expect(publicSellerSelect).not.toHaveProperty("user");
  });
});
