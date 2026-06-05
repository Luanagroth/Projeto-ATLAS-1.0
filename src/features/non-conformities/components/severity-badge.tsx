import { cn } from "@/lib/utils";

import { severityLabels } from "../schemas/non-conformity-schema";

type SeverityBadgeProps = {
  severity: keyof typeof severityLabels;
};

const severityClasses = {
  LOW: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-700",
  CRITICAL: "border-red-500/30 bg-red-500/10 text-red-700",
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "w-fit rounded-md border px-2 py-1 text-xs font-medium",
        severityClasses[severity],
      )}
    >
      {severityLabels[severity]}
    </span>
  );
}
