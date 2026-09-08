import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const cookieName = "fusbus_session";
const maxAgeSeconds = 60 * 60 * 8;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return value;
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Buffer.from(signature).toString("base64url");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(userId: string) {
  const expiresAt = Date.now() + maxAgeSeconds * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString("base64url");
  const token = `${payload}.${await sign(payload)}`;
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(await sign(payload));
  const received = Buffer.from(signature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  let parsed: { userId: string; expiresAt: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!parsed || typeof parsed.userId !== "string" || !parsed.userId || !Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= Date.now()) return null;
  } catch {
    return null;
  }
  return prisma.user.findFirst({
    where: { id: parsed.userId, isActive: true, deletedAt: null },
    select: { id: true, email: true, role: true, emailVerified: true }
  });
}

export async function requireUser(role?: UserRole) {
  const user = await getSessionUser();
  if (!user || (role && user.role !== role)) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return user;
}

export function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
