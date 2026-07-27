import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { clientIp } from "@/lib/auth";

type RateRecord = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateRecord>();

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function publicOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto.split(",")[0]}://${forwardedHost.split(",")[0]}`;
  return request.nextUrl.origin;
}

export function wantsHtml(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) return false;
  return accept.includes("text/html") || accept.includes("*/*");
}

export function formRedirect(request: NextRequest, path: string, params: Record<string, string>) {
  const url = new URL(path, publicOrigin(request));
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, 303);
}

export function formError(
  request: NextRequest,
  path: string,
  reason: string,
  message: string,
  status = 400
) {
  if (wantsHtml(request)) return formRedirect(request, path, { error: reason });
  return NextResponse.json({ error: message }, { status });
}

export function requireSameOrigin(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const requestOrigins = new Set([request.nextUrl.origin, publicOrigin(request)]);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (origin && requestOrigins.has(origin)) return null;
  if (!origin && (fetchSite === "same-origin" || fetchSite === "none")) return null;
  if (!origin && referer) {
    try {
      if (requestOrigins.has(new URL(referer).origin)) return null;
    } catch {
      return forbidden();
    }
  }

  return forbidden("Cross-site request blocked");
}

export function rateLimit(request: NextRequest, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const id = `${clientIp(request)}:${key}`;
  const current = rateStore.get(id);

  if (!current || current.resetAt <= now) {
    rateStore.set(id, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;
  if (current.count > limit) {
    return NextResponse.json({ error: "Too many attempts. Please wait and try again." }, { status: 429 });
  }

  return null;
}

export function resolveInside(root: string, ...segments: string[]) {
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, ...segments);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Resolved path escapes storage root");
  }
  return resolvedPath;
}

export function privateStorageRoot() {
  return path.resolve(process.env.PRIVATE_UPLOAD_DIR ?? "./storage/private");
}
