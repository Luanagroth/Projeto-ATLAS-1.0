import {
  actionPlanPriorityLabels,
  actionPlanStatusLabels,
} from "../schemas/action-plan-schema";

type Status = keyof typeof actionPlanStatusLabels;
type Priority = keyof typeof actionPlanPriorityLabels;

const statusClasses: Record<Status, string> = {
  OPEN: "border-slate-300 bg-slate-50 text-slate-700",
  IN_PROGRESS: "border-blue-300 bg-blue-50 text-blue-700",
  AWAITING_REVIEW: "border-amber-300 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-300 bg-red-50 text-red-700",
};

const priorityClasses: Record<Priority, string> = {
  LOW: "border-emerald-300 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-300 bg-amber-50 text-amber-700",
  HIGH: "border-orange-300 bg-orange-50 text-orange-700",
  CRITICAL: "border-red-300 bg-red-50 text-red-700",
};

export function ActionPlanStatusBadge({ status }: { status: Status }) {
  return (
    <span className={`w-fit rounded-md border px-2 py-1 text-xs font-medium ${statusClasses[status]}`}>
      {actionPlanStatusLabels[status]}
    </span>
  );
}

export function ActionPlanPriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`w-fit rounded-md border px-2 py-1 text-xs font-medium ${priorityClasses[priority]}`}>
      {actionPlanPriorityLabels[priority]}
    </span>
  );
}
