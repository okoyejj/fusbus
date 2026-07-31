"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ReviewStatus = "UNDER_REVIEW" | "MORE_INFORMATION_REQUIRED" | "APPROVED" | "REJECTED" | "SUSPENDED" | "ARCHIVED";

type AdminStatusFormProps = {
  sellerId: string;
  currentStatus: string;
  isFeatured: boolean;
  rejectionReason?: string | null;
  sellerFacingMessage?: string | null;
};

const statuses = [
  ["UNDER_REVIEW", "Under Review"],
  ["MORE_INFORMATION_REQUIRED", "More Information Required"],
  ["APPROVED", "Approved"],
  ["REJECTED", "Rejected"],
  ["SUSPENDED", "Suspended"],
  ["ARCHIVED", "Archived"]
] as const;

function initialReviewStatus(status: string): ReviewStatus {
  return statuses.some(([value]) => value === status) ? status as ReviewStatus : "UNDER_REVIEW";
}

export function AdminStatusForm({ sellerId, currentStatus, isFeatured, rejectionReason, sellerFacingMessage }: AdminStatusFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{ kind: "success" | "error" | "progress"; text: string } | null>(null);
  const [status, setStatus] = useState<ReviewStatus>(initialReviewStatus(currentStatus));
  const [featured, setFeatured] = useState(isFeatured);
  const [saving, setSaving] = useState(false);
  const messageStyles = message?.kind === "error"
    ? "border-red-200 bg-red-50 text-red-800"
    : message?.kind === "success"
      ? "border-green-200 bg-green-50 text-green-900"
      : "border-stone-200 bg-stone-50 text-stone-700";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setMessage({ kind: "progress", text: "Saving decision..." });
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          status,
          reason: String(formData.get("reason") ?? "").trim() || undefined,
          sellerFacingMessage: String(formData.get("sellerFacingMessage") ?? "").trim() || undefined,
          isFeatured: status === "APPROVED" ? featured : false
        })
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not update status. Please try again.");
      setMessage({ kind: "success", text: "Status updated successfully." });
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Could not update status. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-soft lg:sticky lg:top-36">
      <div>
        <p className="text-xs font-black uppercase tracking-normal text-forest">Admin decision</p>
        <h2 className="mt-1 text-xl font-black">Review Decision</h2>
      </div>
      <label className="field">
        <span className="label">Status</span>
        <select className="input" name="status" value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus)}>
          {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      {status === "REJECTED" && <label className="field">
        <span className="label">Rejection reason *</span>
        <textarea className="input min-h-24" name="reason" defaultValue={rejectionReason ?? ""} required minLength={3} maxLength={1000} placeholder="Explain why this application is being rejected" />
      </label>}
      <label className="field">
        <span className="label">Entrepreneur-facing explanation</span>
        <textarea className="input min-h-24" name="sellerFacingMessage" defaultValue={sellerFacingMessage ?? ""} maxLength={1000} />
      </label>
      <label className={`flex gap-3 rounded-md border p-3 text-sm font-semibold ${status === "APPROVED" ? "border-gold bg-yellow-50" : "border-stone-200 bg-stone-50 text-stone-500"}`}>
        <input type="checkbox" name="isFeatured" checked={featured && status === "APPROVED"} disabled={status !== "APPROVED"} onChange={(event) => setFeatured(event.target.checked)} />
        <span>Mark as featured on public pages</span>
      </label>
      <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Decision"}</button>
      {message && <p className={`rounded-md border p-3 text-sm font-semibold ${messageStyles}`} role={message.kind === "error" ? "alert" : "status"}>{message.text}</p>}
    </form>
  );
}
