import { createHmac, timingSafeEqual } from "node:crypto";

const resetTokenLifetimeMs = 60 * 60 * 1000;

type PasswordResetUser = {
  id: string;
  email: string;
  passwordHash: string;
};

type PasswordResetPayload = {
  sub: string;
  purpose: "password-reset";
  exp: number;
};

function signingSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return value;
}

function signature(encodedPayload: string, user: PasswordResetUser) {
  return createHmac("sha256", signingSecret())
    .update(`${encodedPayload}.${user.id}.${user.email.toLowerCase()}.${user.passwordHash}`)
    .digest("base64url");
}

function decodePayload(token: string): PasswordResetPayload | null {
  const [encodedPayload, tokenSignature, extra] = token.split(".");
  if (!encodedPayload || !tokenSignature || extra) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<PasswordResetPayload>;
    if (parsed.purpose !== "password-reset" || typeof parsed.sub !== "string" || typeof parsed.exp !== "number") return null;
    return parsed as PasswordResetPayload;
  } catch {
    return null;
  }
}

export function createPasswordResetToken(user: PasswordResetUser, now = Date.now()) {
  const payload: PasswordResetPayload = {
    sub: user.id,
    purpose: "password-reset",
    exp: now + resetTokenLifetimeMs
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signature(encodedPayload, user)}`;
}

export function passwordResetSubject(token: string) {
  return decodePayload(token)?.sub ?? null;
}

export function verifyPasswordResetToken(token: string, user: PasswordResetUser, now = Date.now()) {
  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  const payload = decodePayload(token);
  if (!encodedPayload || !suppliedSignature || extra || !payload || payload.sub !== user.id || payload.exp < now) return false;

  const expectedSignature = signature(encodedPayload, user);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
