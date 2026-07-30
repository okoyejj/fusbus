import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { MediaType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { allowedImageTypes, sanitizeFileName } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { requireSameOrigin, resolveInside } from "@/lib/security";

const maxGalleryImages = 5;

function detectedImageType(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 && buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a) return "image/png";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

function mediaError(request: NextRequest, reason: string, status = 400) {
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("application/json")) {
    const url = new URL("/seller/application", request.url);
    url.searchParams.set("mediaError", reason);
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.json({ error: reason }, { status });
}

async function deleteStoredFiles(items: Array<{ fileUrl: string; thumbnailUrl: string | null }>) {
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? "./public/uploads");
  await Promise.all(items.flatMap((item) => [item.fileUrl, item.thumbnailUrl].filter(Boolean).map(async (url) => {
    const relativePath = String(url).replace(/^\/uploads\//, "");
    const filePath = resolveInside(uploadRoot, relativePath);
    await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") console.error(error);
    });
  })));
}

async function deleteMedia(request: NextRequest, id: string) {
  const user = await requireUser(UserRole.SELLER);
  const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const items = await prisma.sellerMedia.findMany({ where: { id, sellerProfileId: profile.id }, select: { id: true, fileUrl: true, thumbnailUrl: true } });
  if (items.length === 0) return NextResponse.redirect(new URL("/seller/application", request.url), 303);
  await prisma.sellerMedia.deleteMany({ where: { id, sellerProfileId: profile.id } });
  deleteStoredFiles(items).catch(console.error);
  audit(request, { actorUserId: user.id, action: "SELLER_MEDIA_DELETED", entityType: "SellerMedia", entityId: id }).catch(console.error);
  return NextResponse.redirect(new URL("/seller/application", request.url), 303);
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const user = await requireUser(UserRole.SELLER);
  const form = await request.formData();
  if (form.get("intent") === "delete") {
    const id = String(form.get("mediaId") ?? "");
    if (!id) return mediaError(request, "missing");
    return deleteMedia(request, id);
  }
  const files = [...form.getAll("files"), ...form.getAll("file")].filter((item): item is File => item instanceof File && item.size > 0);
  const mediaType = String(form.get("mediaType") ?? "GALLERY") as MediaType;
  if (!Object.values(MediaType).includes(mediaType)) return mediaError(request, "type");
  if (files.length === 0) return mediaError(request, "missing");
  if (mediaType !== MediaType.GALLERY && files.length > 1) return mediaError(request, "single");
  if (files.some((file) => file.type && !allowedImageTypes.includes(file.type as never))) return mediaError(request, "type");
  const maxBytes = Number(process.env.MAX_UPLOAD_MB ?? 6) * 1024 * 1024;
  if (files.some((file) => file.size > maxBytes)) return mediaError(request, "size");

  const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: user.id }, include: { media: true } });
  const galleryCount = profile.media.filter((item) => item.mediaType === MediaType.GALLERY).length;
  if (mediaType === MediaType.GALLERY && galleryCount + files.length > maxGalleryImages) {
    return mediaError(request, "count");
  }

  const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? "./public/uploads");
  const sellerDir = resolveInside(uploadRoot, profile.id);
  await mkdir(sellerDir, { recursive: true });

  const prepared: Array<{
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
    if (file.type && file.type !== detectedType) return mediaError(request, "type");
    const image = sharp(buffer);
    const metadata = await image.metadata().catch(() => null);
    if (!metadata?.width || !metadata.height) return mediaError(request, "invalid");

    const originalName = sanitizeFileName(file.name);
    const unique = `${crypto.randomUUID()}-${originalName.replace(/\.[^.]+$/, "")}.webp`;
    const thumb = `thumb-${unique}`;
    const storedPath = path.join(sellerDir, unique);
    const thumbPath = path.join(sellerDir, thumb);

    const storedInfo = await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(storedPath).catch(() => null);
    if (!storedInfo) return mediaError(request, "invalid");
    const thumbInfo = await sharp(buffer).resize({ width: 420, height: 320, fit: "cover" }).webp({ quality: 72 }).toFile(thumbPath).catch(() => null);
    if (!thumbInfo) return mediaError(request, "invalid");
    const fileUrl = `/uploads/${profile.id}/${unique}`;
    const thumbnailUrl = `/uploads/${profile.id}/${thumb}`;
    prepared.push({
      sellerProfileId: profile.id,
      mediaType,
      originalFileName: originalName,
      storedFileName: unique,
      fileUrl,
      thumbnailUrl,
      mimeType: "image/webp",
      fileSize: storedInfo.size,
      sortOrder: mediaType === MediaType.GALLERY ? galleryCount + index : 0,
      isPublic: false
    });
  }

  const replaced = mediaType === MediaType.GALLERY
    ? []
    : profile.media.filter((item) => item.mediaType === mediaType).map((item) => ({ fileUrl: item.fileUrl, thumbnailUrl: item.thumbnailUrl }));

  const uploaded = await prisma.$transaction(async (tx) => {
    if (mediaType !== MediaType.GALLERY) {
      await tx.sellerMedia.deleteMany({ where: { sellerProfileId: profile.id, mediaType } });
    }
    const records = [];
    for (const data of prepared) {
      records.push(await tx.sellerMedia.create({ data }));
    }
    return records;
  });
  if (replaced.length > 0) deleteStoredFiles(replaced).catch(console.error);
  audit(request, { actorUserId: user.id, action: "SELLER_MEDIA_UPLOADED", entityType: "SellerMedia", entityId: uploaded.map((media) => media.id).join(","), newValues: uploaded }).catch(console.error);
  return NextResponse.redirect(new URL("/seller/application?mediaUploaded=1", request.url), 303);
}

export async function DELETE(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const user = await requireUser(UserRole.SELLER);
  const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const items = await prisma.sellerMedia.findMany({ where: { id, sellerProfileId: profile.id }, select: { fileUrl: true, thumbnailUrl: true } });
  await prisma.sellerMedia.deleteMany({ where: { id, sellerProfileId: profile.id } });
  deleteStoredFiles(items).catch(console.error);
  audit(request, { actorUserId: user.id, action: "SELLER_MEDIA_DELETED", entityType: "SellerMedia", entityId: id }).catch(console.error);
  return NextResponse.json({ ok: true });
}
