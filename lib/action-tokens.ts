import { createHmac, timingSafeEqual } from "node:crypto";

type Account = { id: string; passwordHash: string };
type Purpose = "reset-password" | "verify-email";

function signature(account: Account, purpose: Purpose, expiresAt: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return createHmac("sha256", secret).update(JSON.stringify([purpose, account.id, account.passwordHash, expiresAt])).digest("base64url");
}

export function createActionToken(account: Account, purpose: Purpose, now = Date.now()) {
  const expiresAt = String(now + 30 * 60 * 1000);
  return `${expiresAt}.${signature(account, purpose, expiresAt)}`;
}

export function verifyActionToken(token: string, account: Account, purpose: Purpose, now = Date.now()) {
  const [expiresAt, value, extra] = token.split(".");
  if (!expiresAt || !value || extra !== undefined || !/^\d+$/.test(expiresAt)) return false;
  const expiry = Number(expiresAt);
  if (!Number.isSafeInteger(expiry) || expiry <= now || expiry > now + 30 * 60 * 1000) return false;
  const expected = Buffer.from(signature(account, purpose, expiresAt));
  const received = Buffer.from(value);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
