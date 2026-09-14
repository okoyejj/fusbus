import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const retentionMs = 7 * 24 * 60 * 60 * 1000;

function text(value: unknown, max: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function details(input: unknown) {
  return input == null ? undefined : JSON.parse(JSON.stringify(input));
}

export async function logFailedFormAttempt(input: {
  request: NextRequest;
  formType: string;
  errorCode: string;
  formData?: Record<string, unknown>;
  errorDetails?: unknown;
}) {
  try {
    await pruneFailedFormAttempts();
    await prisma.failedFormAttempt.create({
      data: {
        formType: input.formType,
        email: text(input.formData?.email, 320)?.toLowerCase() ?? null,
        fullName: text(input.formData?.fullName, 120),
        businessName: text(input.formData?.businessName, 140),
        errorCode: input.errorCode,
        errorDetails: details(input.errorDetails),
        origin: text(input.request.headers.get("origin"), 500),
        referer: text(input.request.headers.get("referer"), 500),
        host: text(input.request.headers.get("host"), 255)
      }
    });
  } catch (error) {
    console.error("Failed to log form attempt", error);
  }
}

export async function pruneFailedFormAttempts() {
  const cutoff = new Date(Date.now() - retentionMs);
  await prisma.failedFormAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
}
