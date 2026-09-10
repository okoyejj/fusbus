export const bankingPath = "/banking";

export const bankDetails = [
  { label: "Beneficiary", value: "LADIES IN THE BOARDROOM" },
  { label: "Bank", value: "AFG BANK CAMEROON" },
  { label: "IBAN / RIB", value: "CM2110034110140007003720134" },
  { label: "SWIFT / BIC", value: "ATCRCMCMXXX" },
  { label: "Account", value: "CM21 / 10034 / 11014 / 00070037201 / 34" }
] as const;

export function paypalPaymentUrl(value = process.env.PAYPAL_PAYMENT_URL): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isPaypal = hostname === "paypal.com" || hostname.endsWith(".paypal.com") || hostname === "paypal.me" || hostname.endsWith(".paypal.me");
    return url.protocol === "https:" && isPaypal ? url.toString() : null;
  } catch {
    return null;
  }
}

export function bankingPageUrl(requestOrigin: string, configuredAppUrl = process.env.APP_URL): string {
  try {
    return new URL(bankingPath, configuredAppUrl || requestOrigin).toString();
  } catch {
    return new URL(bankingPath, requestOrigin).toString();
  }
}
