// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/banking/qr-code/route";
import { bankDetails, bankingPageUrl, paypalPaymentUrl } from "@/lib/payment";

afterEach(() => vi.unstubAllEnvs());

describe("banking payment details", () => {
  it("matches the approved beneficiary account", () => {
    expect(Object.fromEntries(bankDetails.map(({ label, value }) => [label, value]))).toEqual({
      Beneficiary: "LADIES IN THE BOARDROOM",
      Bank: "AFG BANK CAMEROON",
      "IBAN / RIB": "CM2110034110140007003720134",
      "SWIFT / BIC": "ATCRCMCMXXX",
      Account: "CM21 / 10034 / 11014 / 00070037201 / 34"
    });
  });

  it("only accepts secure PayPal recipient URLs", () => {
    expect(paypalPaymentUrl("https://www.paypal.com/donate/example")).toBe("https://www.paypal.com/donate/example");
    expect(paypalPaymentUrl("https://paypal.me/ladiesboardroom")).toBe("https://paypal.me/ladiesboardroom");
    expect(paypalPaymentUrl("http://paypal.com/insecure")).toBeNull();
    expect(paypalPaymentUrl("https://paypal.com.evil.test/pay")).toBeNull();
    expect(paypalPaymentUrl("not a url")).toBeNull();
  });

  it("builds the public banking URL from APP_URL with a request-origin fallback", () => {
    expect(bankingPageUrl("http://localhost:3000", "https://fusbus.example/root")).toBe("https://fusbus.example/banking");
    expect(bankingPageUrl("http://localhost:3000", "not a url")).toBe("http://localhost:3000/banking");
  });
});

it("serves a replacement QR code for the public banking page", async () => {
  vi.stubEnv("APP_URL", "https://fusbus.example");
  const response = await GET(new NextRequest("http://app:3000/banking/qr-code"));
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("image/svg+xml");
  expect(response.headers.get("content-disposition")).toContain("fusbus-banking-qr.svg");
  expect(body).toContain("<svg");
  expect(body).toContain("#163d2a");
});
