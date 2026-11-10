type MediaLocation = { id: string; fileUrl: string; thumbnailUrl: string | null };

export function mediaUrl(media: MediaLocation, thumbnail = false) {
  const url = thumbnail ? media.thumbnailUrl ?? media.fileUrl : media.fileUrl;
  return url.startsWith("/uploads/") || url.startsWith("/api/media/")
    ? `/api/media/${encodeURIComponent(media.id)}${thumbnail ? "?thumbnail=1" : ""}`
    : url;
}
