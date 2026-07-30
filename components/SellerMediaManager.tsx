"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MediaType = "PROFILE" | "LOGO" | "GALLERY";

type MediaItem = {
  id: string;
  mediaType: MediaType;
  originalFileName: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  fileSize: number;
  isPublic: boolean;
};

type SelectedFile = {
  file: File;
  previewUrl: string;
};

const sections: Array<{ type: MediaType; title: string; empty: string; multiple: boolean }> = [
  { type: "PROFILE", title: "Profile picture", empty: "No profile picture uploaded yet.", multiple: false },
  { type: "LOGO", title: "Business logo", empty: "No business logo uploaded yet.", multiple: false },
  { type: "GALLERY", title: "Product images", empty: "No product images uploaded yet.", multiple: true }
];

const maxFileBytes = 6 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function readableSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function messageForError(error: string) {
  const messages: Record<string, string> = {
    type: "Upload JPG, PNG, or WebP images only.",
    size: "Each image must be 6 MB or smaller.",
    count: "Product image uploads are limited to 5 total.",
    single: "Choose one image for a profile picture or business logo.",
    invalid: "One or more images could not be processed.",
    missing: "The image could not be found. Refresh the page and try again.",
    "request-size": "The selected images are too large to upload together. Upload fewer or smaller images.",
    server: "The image request could not be completed. Please try again."
  };
  return messages[error] ?? "The image request could not be completed. Please try again.";
}

export function SellerMediaManager({ initialMedia }: { initialMedia: MediaItem[] }) {
  const router = useRouter();
  const inputRefs = useRef<Partial<Record<MediaType, HTMLInputElement | null>>>({});
  const previewUrls = useRef(new Set<string>());
  const [media, setMedia] = useState(initialMedia);
  const [selected, setSelected] = useState<Partial<Record<MediaType, SelectedFile[]>>>({});
  const [busy, setBusy] = useState<MediaType | string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => setMedia(initialMedia), [initialMedia]);
  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const galleryCount = useMemo(() => media.filter((item) => item.mediaType === "GALLERY").length, [media]);

  function chooseFiles(type: MediaType, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setFeedback(null);
    if (files.some((file) => file.type ? !allowedTypes.has(file.type) : !/\.(jpe?g|png|webp)$/i.test(file.name))) {
      setFeedback({ kind: "error", message: messageForError("type") });
      event.target.value = "";
      return;
    }
    if (files.some((file) => file.size > maxFileBytes)) {
      setFeedback({ kind: "error", message: messageForError("size") });
      event.target.value = "";
      return;
    }
    if (type === "GALLERY" && galleryCount + files.length > 5) {
      setFeedback({ kind: "error", message: messageForError("count") });
      event.target.value = "";
      return;
    }
    setSelected((current) => {
      (current[type] ?? []).forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrls.current.delete(item.previewUrl);
      });
      return { ...current, [type]: files.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrls.current.add(previewUrl);
        return { file, previewUrl };
      }) };
    });
  }

  function removeSelection(type: MediaType, index: number) {
    setSelected((current) => {
      const next = [...(current[type] ?? [])];
      const [removed] = next.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
        previewUrls.current.delete(removed.previewUrl);
      }
      if (inputRefs.current[type]) inputRefs.current[type]!.value = "";
      return { ...current, [type]: next };
    });
  }

  async function upload(type: MediaType, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const files = selected[type] ?? [];
    if (files.length === 0) {
      setFeedback({ kind: "error", message: "Choose an image before uploading." });
      return;
    }
    setBusy(type);
    setUploadProgress(0);
    setFeedback(null);
    let completed = 0;
    try {
      for (const { file } of files) {
        const body = new FormData();
        body.set("mediaType", type);
        body.set("files", file);
        const response = await fetch("/api/seller/media", { method: "POST", headers: { Accept: "application/json" }, body });
        const result = await response.json().catch(() => ({})) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "server");
        completed += 1;
        setUploadProgress(completed);
      }
      files.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrls.current.delete(item.previewUrl);
      });
      setSelected((current) => ({ ...current, [type]: [] }));
      if (inputRefs.current[type]) inputRefs.current[type]!.value = "";
      setFeedback({ kind: "success", message: "Image upload complete. Your images are shown below." });
      router.refresh();
    } catch (error) {
      const uploaded = files.slice(0, completed);
      uploaded.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrls.current.delete(item.previewUrl);
      });
      setSelected((current) => ({ ...current, [type]: files.slice(completed) }));
      if (completed > 0) router.refresh();
      const detail = messageForError(error instanceof Error ? error.message : "server");
      setFeedback({ kind: "error", message: completed > 0 ? `${completed} image${completed === 1 ? "" : "s"} uploaded. ${detail}` : detail });
    } finally {
      setBusy(null);
      setUploadProgress(0);
    }
  }

  async function remove(item: MediaItem) {
    setBusy(item.id);
    setFeedback(null);
    try {
      const response = await fetch(`/api/seller/media?id=${encodeURIComponent(item.id)}`, { method: "DELETE", headers: { Accept: "application/json" } });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "server");
      setMedia((current) => current.filter((entry) => entry.id !== item.id));
      setFeedback({ kind: "success", message: "Image removed." });
      router.refresh();
    } catch (error) {
      setFeedback({ kind: "error", message: messageForError(error instanceof Error ? error.message : "server") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5">
      <h2 className="text-xl font-black">Upload Images</h2>
      {feedback && <p className={`rounded-lg border p-3 text-sm font-semibold ${feedback.kind === "success" ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"}`} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.message}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => {
          const files = selected[section.type] ?? [];
          return (
            <form className="grid content-start gap-3" key={section.type} onSubmit={(event) => upload(section.type, event)}>
              <label className="field">
                <span className="label">{section.title}</span>
                <input ref={(element) => { inputRefs.current[section.type] = element; }} className="input" type="file" accept="image/jpeg,image/png,image/webp" multiple={section.multiple} onChange={(event) => chooseFiles(section.type, event)} disabled={busy !== null} />
              </label>
              {files.length > 0 && <div className="grid grid-cols-2 gap-2" aria-label={`Selected ${section.title}`}>
                {files.map((item, index) => <div className="relative overflow-hidden rounded-md border border-stone-200" key={`${item.file.name}-${item.file.lastModified}`}>
                  <img className="aspect-[4/3] w-full object-cover" src={item.previewUrl} alt={`Selected ${item.file.name}`} />
                  <button className="absolute right-1 top-1 rounded bg-white px-2 py-1 text-xs font-black text-red-700 shadow" type="button" onClick={() => removeSelection(section.type, index)} disabled={busy !== null}>Remove</button>
                  <p className="truncate px-2 py-1 text-xs">{item.file.name}</p>
                </div>)}
              </div>}
              <button className="btn btn-primary" type="submit" disabled={busy !== null || files.length === 0}>{busy === section.type ? `Uploading ${Math.min(uploadProgress + 1, files.length)} of ${files.length}...` : `Upload ${section.title}`}</button>
            </form>
          );
        })}
      </div>
      <div className="grid gap-5">
        {sections.map((section) => {
          const items = media.filter((item) => item.mediaType === section.type);
          return <div className="grid gap-3" key={section.type}>
            <h3 className="font-black">{section.title}{section.type === "GALLERY" ? ` (${items.length}/5)` : ""}</h3>
            {items.length === 0 ? <p className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-600">{section.empty}</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50" key={item.id}>
                <img className="aspect-[4/3] w-full object-cover" src={item.thumbnailUrl ?? item.fileUrl} alt={item.originalFileName} />
                <div className="grid gap-3 p-3">
                  <div className="min-w-0"><p className="truncate text-sm font-black text-stone-900">{item.originalFileName}</p><p className="text-xs text-stone-600">{readableSize(item.fileSize)} - {item.isPublic ? "Public" : "Private until approved"}</p></div>
                  <button className="btn btn-secondary w-full" type="button" onClick={() => remove(item)} disabled={busy !== null}>{busy === item.id ? "Removing..." : "Remove"}</button>
                </div>
              </div>)}
            </div>}
          </div>;
        })}
      </div>
    </div>
  );
}
