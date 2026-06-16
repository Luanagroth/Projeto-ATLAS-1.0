import { cn } from "@/lib/utils";

import { severityLabels } from "../schemas/non-conformity-schema";

type SeverityBadgeProps = {
  severity: keyof typeof severityLabels;
};

const severityClasses = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "w-fit rounded-full border px-2.5 py-1 text-xs font-medium",
        severityClasses[severity],
      )}
    >
      {severityLabels[severity]}
    </span>
  );
}
