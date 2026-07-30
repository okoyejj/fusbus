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

const styles: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-700",
  SUBMITTED: "bg-blue-50 text-blue-800",
  UNDER_REVIEW: "bg-yellow-50 text-yellow-900",
  MORE_INFORMATION_REQUIRED: "bg-orange-50 text-orange-800",
  APPROVED: "bg-green-50 text-forest",
  REJECTED: "bg-red-50 text-red-800",
  SUSPENDED: "bg-stone-200 text-stone-800",
  ARCHIVED: "bg-stone-100 text-stone-500"
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${styles[status] ?? "bg-stone-100 text-ink"}`}>{labels[status] ?? status}</span>;
}
