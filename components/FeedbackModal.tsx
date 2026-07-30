type FeedbackModalProps = {
  open: boolean;
  title: string;
  message: string;
  closeHref: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
};

export function FeedbackModal({ open, title, message, closeHref, primaryHref, primaryLabel, secondaryLabel = "Close" }: FeedbackModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
      <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-green-100 text-sm font-black text-forest" aria-hidden="true">OK</div>
        <h2 id="feedback-modal-title" className="mt-5 text-2xl font-black text-ink">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-700">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {primaryHref && primaryLabel && <a className="btn btn-primary" href={primaryHref}>{primaryLabel}</a>}
          <a className="btn btn-secondary" href={closeHref}>{secondaryLabel}</a>
        </div>
      </div>
    </div>
  );
}
