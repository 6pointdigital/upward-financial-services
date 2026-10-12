import { STATUS_LABELS, type AssetStatus } from "@/lib/constants";

const COLORS: Record<AssetStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-brand-100 text-brand-600",
  rejected: "bg-red-100 text-red-700",
  sold: "bg-navy-900 text-white",
};

export function StatusBadge({ status }: { status: AssetStatus }) {
  return <span className={`badge ${COLORS[status]}`}>{STATUS_LABELS[status]}</span>;
}
