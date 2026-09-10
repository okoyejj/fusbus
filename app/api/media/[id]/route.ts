import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { detectedImageType } from "@/lib/image-content";
import { prisma } from "@/lib/prisma";
import { mediaStoragePath } from "@/lib/media-storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await prisma.sellerMedia.findUnique({ where: { id }, include: { sellerProfile: { include: { user: { select: { isActive: true, deletedAt: true } } } } } });
  const unavailable = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  if (!media || media.sellerProfile.deletedAt || media.sellerProfile.user.deletedAt || !media.sellerProfile.user.isActive) return unavailable();
  const profile = media.sellerProfile;
  const isPublic = media.isPublic && profile.applicationStatus === "APPROVED" && profile.consentPublish;
  if (!isPublic) {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.id !== profile.userId)) return unavailable();
  }
  try {
    const thumbnail = request.nextUrl.searchParams.get("thumbnail") === "1";
    let bytes: Buffer;
    try {
      bytes = await readFile(mediaStoragePath(media, thumbnail));
    } catch (error) {
      if (!thumbnail || (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      bytes = await readFile(mediaStoragePath(media));
    }
    const contentType = detectedImageType(bytes);
    if (!contentType) return unavailable();
    return new NextResponse(new Uint8Array(bytes), { headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error("Unable to read seller image");
    return unavailable();
  }
}
