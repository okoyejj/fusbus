"use client";

import { useState } from "react";

export function AdminStatusForm({ sellerId }: { sellerId: string }) {
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    setMessage("Saving...");
    const response = await fetch(`/api/admin/sellers/${sellerId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: formData.get("status"),
        reason: formData.get("reason"),
        sellerFacingMessage: formData.get("sellerFacingMessage"),
        isFeatured: formData.get("isFeatured") === "on"
      })
    });
    setMessage(response.ok ? "Status updated." : "Could not update status.");
    if (response.ok) window.location.reload();
  }
  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5">
      <h2 className="text-xl font-black">Review Decision</h2>
      <label className="field"><span className="label">Status</span><select className="input" name="status"><option value="UNDER_REVIEW">Under Review</option><option value="MORE_INFORMATION_REQUIRED">More Information Required</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="SUSPENDED">Suspended</option><option value="ARCHIVED">Archived</option></select></label>
      <label className="field"><span className="label">Internal reason</span><textarea className="input min-h-24" name="reason" /></label>
      <label className="field"><span className="label">Entrepreneur-facing explanation</span><textarea className="input min-h-24" name="sellerFacingMessage" /></label>
      <label className="flex gap-3 text-sm font-semibold"><input type="checkbox" name="isFeatured" /> Mark as featured</label>
      <button className="btn btn-primary" type="submit">Save Decision</button>
      {message && <p className="text-sm font-semibold text-forest">{message}</p>}
    </form>
  );
}
