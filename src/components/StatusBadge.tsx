"use client";

import type { CaseStatus, ViabilityScore } from "@/lib/types";

const STATUS_STYLES: Record<CaseStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  reviewing: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  accepted: "Accepted",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const VIABILITY_STYLES: Record<string, string> = {
  Strong: "bg-green-50 text-green-700 border-green-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Weak: "bg-red-50 text-red-700 border-red-200",
};

export function ViabilityBadge({ score }: { score: ViabilityScore }) {
  if (!score) return null;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${VIABILITY_STYLES[score] || ""}`}
    >
      {score}
    </span>
  );
}
