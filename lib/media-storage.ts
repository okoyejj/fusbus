import path from "node:path";
import { privateStorageRoot, resolveInside } from "@/lib/security";

// Uploads are runtime storage, never assets to include in the server bundle.
export function sellerImageRoot() {
  return resolveInside(privateStorageRoot(), "seller-images");
}

export function mediaStoragePath(media: { sellerProfileId: string; storedFileName: string; fileUrl: string; thumbnailUrl: string | null }, thumbnail = false) {
  if (media.fileUrl.startsWith("/api/media/")) {
    return resolveInside(sellerImageRoot(), media.sellerProfileId, `${thumbnail && media.thumbnailUrl ? "thumb-" : ""}${media.storedFileName}`);
  }
  const url = thumbnail ? media.thumbnailUrl ?? media.fileUrl : media.fileUrl;
  if (!url.startsWith("/uploads/")) throw new Error("Not a stored upload");
  return resolveInside(path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./public/uploads"), url.slice("/uploads/".length));
}
