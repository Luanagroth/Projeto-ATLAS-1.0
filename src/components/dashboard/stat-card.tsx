import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: number;
};

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-[color:rgba(245,158,11,0.24)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}
