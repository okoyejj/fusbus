import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { MediaType, UserRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sanitizeFileName } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { detectedImageType } from "@/lib/image-content";
import { compressImageBelowLimit } from "@/lib/image-compression";
import { requireSameOrigin, resolveInside, rateLimit } from "@/lib/security";

import { mediaStoragePath, sellerImageRoot } from "@/lib/media-storage";

const maxGalleryImages = 5;
const absoluteMaxInputImageMb = 5;

function mediaError(request: NextRequest, reason: string, status = 400) {
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("application/json")) {
    const url = new URL("/seller/application", request.url);
    url.searchParams.set("mediaError", reason);
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.json({ error: reason }, { status });
}

function wantsJson(request: NextRequest) {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

function serverError(request: NextRequest) {
  return mediaError(request, "server", 500);
}

async function deleteStoredFiles(items: Array<{ sellerProfileId: string; storedFileName: string; fileUrl: string; thumbnailUrl: string | null }>) {
  await Promise.all(items.flatMap((item) => [false, true].map(async (thumbnail) => {
    // Seeded assets are not user uploads and must never be deleted.
    if (!item.fileUrl.startsWith("/uploads/") && !item.fileUrl.startsWith("/api/media/")) return;
    await unlink(mediaStoragePath(item, thumbnail)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") console.error("Unable to remove stored image");
    });
  })));
}

async function deleteMedia(request: NextRequest, id: string, user: Awaited<ReturnType<typeof requireUser>>) {
  const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const items = await prisma.sellerMedia.findMany({ where: { id, sellerProfileId: profile.id }, select: { id: true, sellerProfileId: true, storedFileName: true, fileUrl: true, thumbnailUrl: true } });
  if (items.length === 0) return mediaError(request, "missing", 404);
  await prisma.sellerMedia.deleteMany({ where: { id, sellerProfileId: profile.id } });
  deleteStoredFiles(items).catch(console.error);
  audit(request, { actorUserId: user.id, action: "SELLER_MEDIA_DELETED", entityType: "SellerMedia", entityId: id }).catch(console.error);
  if (wantsJson(request)) return NextResponse.json({ ok: true, id });
  return NextResponse.redirect(new URL("/seller/application", request.url), 303);
}

export async function POST(request: NextRequest) {
  const createdPaths: string[] = [];
  let committed = false;
  try {
    const csrf = requireSameOrigin(request);
    if (csrf) return csrf;
    const user = await requireUser(UserRole.SELLER);
    const limited = rateLimit(request, `media:${user.id}`, 30, 60_000);
    if (limited) return limited;
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    const maxRequestBytes = Number(process.env.MAX_UPLOAD_REQUEST_MB ?? 32) * 1024 * 1024;
    if (contentLength > maxRequestBytes) return mediaError(request, "request-size", 413);
    // Count streamed bytes as well: Content-Length can be absent or dishonest.
    if (!request.body) return mediaError(request, "missing");
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxRequestBytes) {
        await reader.cancel();
        return mediaError(request, "request-size", 413);
      }
      chunks.push(value);
    }
    let form: FormData;
    try {
      form = await new Response(Buffer.concat(chunks), { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
    } catch {
      return mediaError(request, "invalid");
    }
    if (form.get("intent") === "delete") {
      const id = String(form.get("mediaId") ?? "");
      if (!id) return mediaError(request, "missing");
      return await deleteMedia(request, id, user);
    }
    const files = [...form.getAll("files"), ...form.getAll("file")].filter((item): item is File => item instanceof File && item.size > 0);
    const mediaType = String(form.get("mediaType") ?? "GALLERY") as MediaType;
    if (!Object.values(MediaType).includes(mediaType)) return mediaError(request, "type");
    if (files.length === 0) return mediaError(request, "missing");
    if (mediaType !== MediaType.GALLERY && files.length > 1) return mediaError(request, "single");
    const configuredMaxInputMb = Number(process.env.MAX_UPLOAD_MB ?? absoluteMaxInputImageMb);
    const maxInputImageBytes = Math.min(Number.isFinite(configuredMaxInputMb) && configuredMaxInputMb > 0 ? configuredMaxInputMb : absoluteMaxInputImageMb, absoluteMaxInputImageMb) * 1024 * 1024;
    if (files.some((file) => file.size > maxInputImageBytes)) return mediaError(request, "size", 413);

    const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: user.id }, include: { media: true } });
    const galleryCount = profile.media.filter((item) => item.mediaType === MediaType.GALLERY).length;
    if (mediaType === MediaType.GALLERY && galleryCount + files.length > maxGalleryImages) {
      return mediaError(request, "count");
    }

    const uploadRoot = sellerImageRoot();
    const sellerDir = resolveInside(uploadRoot, profile.id);
    await mkdir(sellerDir, { recursive: true });

    const prepared: Array<{
      id: string;
      sellerProfileId: string;
      mediaType: MediaType;
      originalFileName: string;
      storedFileName: string;
      fileUrl: string;
      thumbnailUrl: string;
      mimeType: string;
      fileSize: number;
      sortOrder: number;
      isPublic: boolean;
    }> = [];
    for (const [index, file] of files.entries()) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const detectedType = detectedImageType(buffer);
      if (!detectedType) return mediaError(request, "type");
      const image = sharp(buffer, { limitInputPixels: 40_000_000, animated: false });
      const metadata = await image.metadata().catch(() => null);
      if (!metadata?.width || !metadata.height) return mediaError(request, "invalid");

      const originalName = sanitizeFileName(file.name);
      const unique = `${crypto.randomUUID()}-${originalName.replace(/\.[^.]+$/, "")}.webp`;
      const thumb = `thumb-${unique}`;
      const storedPath = path.join(sellerDir, unique);
      const thumbPath = path.join(sellerDir, thumb);
      createdPaths.push(storedPath, thumbPath);

      const storedBuffer = await compressImageBelowLimit(buffer).catch(() => null);
      if (!storedBuffer) return mediaError(request, "invalid");
      await writeFile(storedPath, storedBuffer);
      const thumbInfo = await sharp(buffer, { limitInputPixels: 40_000_000, animated: false }).rotate().resize({ width: 420, height: 320, fit: "cover" }).webp({ quality: 72 }).toFile(thumbPath).catch(() => null);
      if (!thumbInfo) return mediaError(request, "invalid");
      const id = crypto.randomUUID();
      const fileUrl = `/api/media/${id}`;
      const thumbnailUrl = `${fileUrl}?thumbnail=1`;
      prepared.push({
        id,
        sellerProfileId: profile.id,
        mediaType,
        originalFileName: originalName,
        storedFileName: unique,
        fileUrl,
        thumbnailUrl,
        mimeType: "image/webp",
        fileSize: storedBuffer.byteLength,
        sortOrder: mediaType === MediaType.GALLERY ? galleryCount + index : 0,
        isPublic: false
      });
    }

    const { uploaded, replaced } = await prisma.$transaction(async (tx) => {
      const currentCount = await tx.sellerMedia.count({ where: { sellerProfileId: profile.id, mediaType: MediaType.GALLERY } });
      if (mediaType === MediaType.GALLERY && currentCount + prepared.length > maxGalleryImages) {
        throw Object.assign(new Error("Gallery limit reached"), { mediaError: "count" });
      }
      const replaced = mediaType === MediaType.GALLERY ? [] : await tx.sellerMedia.findMany({ where: { sellerProfileId: profile.id, mediaType } });
      if (mediaType !== MediaType.GALLERY) {
        await tx.sellerMedia.deleteMany({ where: { sellerProfileId: profile.id, mediaType } });
      }
      const records = [];
      for (const data of prepared) {
        records.push(await tx.sellerMedia.create({ data }));
      }
      return { uploaded: records, replaced };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    committed = true;
    if (replaced.length > 0) deleteStoredFiles(replaced).catch(console.error);
    audit(request, { actorUserId: user.id, action: "SELLER_MEDIA_UPLOADED", entityType: "SellerMedia", entityId: uploaded.map((media) => media.id).join(","), newValues: uploaded }).catch(console.error);
    if (wantsJson(request)) return NextResponse.json({ ok: true });
    return NextResponse.redirect(new URL("/seller/application?mediaUploaded=1", request.url), 303);
  } catch (error) {
    if ((error as { status?: number }).status === 401) return mediaError(request, "unauthorized", 401);
    if ((error as { mediaError?: string }).mediaError === "count") return mediaError(request, "count");
    if ((error as { code?: string }).code === "P2034") return mediaError(request, "conflict", 409);
    console.error("Seller image upload failed");
    return serverError(request);
  } finally {
    if (!committed) await Promise.all(createdPaths.map((file) => unlink(file).catch(() => undefined)));
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const csrf = requireSameOrigin(request);
    if (csrf) return csrf;
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return mediaError(request, "missing");
    const user = await requireUser(UserRole.SELLER);
    return await deleteMedia(request, id, user);
  } catch (error) {
    if ((error as { status?: number }).status === 401) return mediaError(request, "unauthorized", 401);
    console.error("Seller image deletion failed");
    return serverError(request);
  }
}
