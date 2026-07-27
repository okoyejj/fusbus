import { mkdir, writeFile } from "node:fs/promises";
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

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const user = await requireUser(UserRole.SELLER);
  const form = await request.formData();
  const file = form.get("file");
  const mediaType = String(form.get("mediaType") ?? "GALLERY") as MediaType;
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!allowedImageTypes.includes(file.type as never)) return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  const maxBytes = Number(process.env.MAX_UPLOAD_MB ?? 6) * 1024 * 1024;
  if (file.size > maxBytes) return NextResponse.json({ error: "File too large" }, { status: 400 });

  const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: user.id }, include: { media: true } });
  if (mediaType === MediaType.GALLERY && profile.media.filter((item) => item.mediaType === MediaType.GALLERY).length >= 10) {
    return NextResponse.json({ error: "Maximum gallery image count reached" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) return NextResponse.json({ error: "Invalid image" }, { status: 400 });

  const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? "./public/uploads");
  const sellerDir = resolveInside(uploadRoot, profile.id);
  await mkdir(sellerDir, { recursive: true });
  const originalName = sanitizeFileName(file.name);
  const unique = `${crypto.randomUUID()}-${originalName.replace(/\.[^.]+$/, "")}.webp`;
  const thumb = `thumb-${unique}`;
  const storedPath = path.join(sellerDir, unique);
  const thumbPath = path.join(sellerDir, thumb);

  await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(storedPath);
  await sharp(buffer).resize({ width: 420, height: 320, fit: "cover" }).webp({ quality: 72 }).toFile(thumbPath);
  const fileUrl = `/uploads/${profile.id}/${unique}`;
  const thumbnailUrl = `/uploads/${profile.id}/${thumb}`;

  if (mediaType !== MediaType.GALLERY) {
    await prisma.sellerMedia.deleteMany({ where: { sellerProfileId: profile.id, mediaType } });
  }
  const media = await prisma.sellerMedia.create({
    data: {
      sellerProfileId: profile.id,
      mediaType,
      originalFileName: originalName,
      storedFileName: unique,
      fileUrl,
      thumbnailUrl,
      mimeType: "image/webp",
      fileSize: (await sharp(storedPath).metadata()).size ?? file.size,
      sortOrder: profile.media.length,
      isPublic: false
    }
  });
  await audit(request, { actorUserId: user.id, action: "SELLER_MEDIA_UPLOADED", entityType: "SellerMedia", entityId: media.id, newValues: media });
  return NextResponse.redirect(new URL("/seller/application", request.url), 303);
}

export async function DELETE(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const user = await requireUser(UserRole.SELLER);
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const profile = await prisma.sellerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  await prisma.sellerMedia.deleteMany({ where: { id, sellerProfileId: profile.id } });
  await audit(request, { actorUserId: user.id, action: "SELLER_MEDIA_DELETED", entityType: "SellerMedia", entityId: id });
  return NextResponse.json({ ok: true });
}
