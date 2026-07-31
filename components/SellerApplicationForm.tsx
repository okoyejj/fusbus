"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const fieldLabels: Record<string, string> = {
  fullName: "Full name",
  businessName: "Business or trading name",
  city: "Town or city",
  region: "Region",
  category: "Business category",
  productsOrServices: "Products or services offered",
  businessStage: "Current business stage",
  websiteUrl: "Website link",
  supportNeeded: "Type of support needed",
  consentReview: "Consent to store and review information",
  consentPublish: "Consent to publish approved profile information"
};

type Result = {
  error?: string;
  fields?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
  draftSaved?: boolean;
  submitted?: boolean;
};

export function SellerApplicationForm({ children }: { children: ReactNode }) {
  const router = useRouter();
  const feedbackRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (feedback) feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [feedback]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value === "submit" ? "submit" : "draft";
    const body = new FormData(form);
    body.set("intent", intent);
    form.querySelectorAll<HTMLElement>("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
    setBusy(intent);
    setFeedback(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch("/api/seller/profile", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({})) as Result;
      if (!response.ok) {
        if (result.error === "validation") {
          const invalidFields = result.fields ?? [];
          const fields = invalidFields.map((field) => fieldLabels[field] ?? field).join(", ");
          const details = invalidFields
            .flatMap((field) => result.fieldErrors?.[field] ?? [])
            .filter((message, index, messages) => messages.indexOf(message) === index)
            .join(" ");
          setFeedback(`${result.draftSaved ? "Your entries were saved as a draft. " : "Your entries remain in the form. "}Please check: ${fields || "the required fields"}.${details ? ` ${details}` : ""}`);
          invalidFields.forEach((field) => {
            const control = form.elements.namedItem(field);
            if (control instanceof HTMLElement) control.setAttribute("aria-invalid", "true");
          });
        } else {
          setFeedback("Your application could not be saved. Your entries remain in the form; please try again.");
        }
        return;
      }
      router.push(result.submitted ? "/seller/application?submitted=1" : "/seller/dashboard");
    } catch (error) {
      setFeedback(error instanceof DOMException && error.name === "AbortError"
        ? "Saving took too long. Your entries remain in the form; please try again."
        : "Your application could not be saved. Your entries remain in the form; please try again.");
    } finally {
      window.clearTimeout(timeout);
      setBusy(null);
    }
  }

  return (
    <form action="/api/seller/profile" method="post" onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
      <fieldset className="contents" disabled={busy !== null}>{children}</fieldset>
      {busy && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-900" role="status">{busy === "submit" ? "Submitting your application..." : "Saving your draft..."}</p>}
      {feedback && <div ref={feedbackRef} className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">{feedback}</div>}
    </form>
  );
}
