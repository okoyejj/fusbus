"use client";

import { useState } from "react";

export function AdminEnquiryForm({ enquiryId }: { enquiryId: string }) {
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    setMessage("Saving...");
    const response = await fetch("/api/admin/investor-enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: enquiryId, status: formData.get("status"), note: formData.get("note") })
    });
    setMessage(response.ok ? "Enquiry updated." : "Could not update enquiry.");
    if (response.ok) window.location.reload();
  }
  return (
    <form action={submit} className="grid gap-3">
      <select className="input" name="status">
        <option value="REVIEWING">Reviewing</option>
        <option value="CONTACTED">Contacted</option>
        <option value="AWAITING_RESPONSE">Awaiting Response</option>
        <option value="INTRODUCTION_ARRANGED">Introduction Arranged</option>
        <option value="COMPLETED">Completed</option>
        <option value="DECLINED">Declined</option>
        <option value="CLOSED">Closed</option>
      </select>
      <textarea className="input min-h-20" name="note" placeholder="Internal communication note" />
      <button className="btn btn-secondary" type="submit">Update</button>
      {message && <p className="text-sm font-semibold text-forest">{message}</p>}
    </form>
  );
}
