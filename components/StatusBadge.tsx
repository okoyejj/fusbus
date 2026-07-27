const labels: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  MORE_INFORMATION_REQUIRED: "More Information Required",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived"
};

export function StatusBadge({ status }: { status: string }) {
  return <span className="badge bg-stone-100 text-ink">{labels[status] ?? status}</span>;
}
