"use client";

import { useState } from "react";
import { bankDetails } from "@/lib/payment";

export function BankDetails() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied((current) => current === label ? null : current), 1800);
  }

  return (
    <dl className="divide-y divide-stone-200" aria-label="Bank account details">
      {bankDetails.map(({ label, value }) => (
        <div key={label} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
          <dt className="text-sm font-bold text-stone-500">{label}</dt>
          <dd className="min-w-0 break-words font-semibold text-ink sm:font-mono">{value}</dd>
          <dd>
            <button
              type="button"
              className="inline-flex min-h-10 items-center rounded-md border border-stone-300 bg-white px-3 text-sm font-bold text-forest transition hover:border-forest hover:bg-green-50"
              onClick={() => copy(label, value)}
              aria-label={`Copy ${label}`}
            >
              {copied === label ? "Copied" : "Copy"}
            </button>
          </dd>
        </div>
      ))}
    </dl>
  );
}
