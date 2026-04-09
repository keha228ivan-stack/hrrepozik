import { cn } from "@/lib/utils";

const statusMap: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  onboarding: "bg-blue-50 text-blue-700",
  vacation: "bg-amber-50 text-amber-700",
  inactive: "bg-slate-100 text-slate-600",
  CREATED: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-violet-50 text-violet-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  draft: "bg-slate-100 text-slate-600",
  published: "bg-emerald-50 text-emerald-700",
  archived: "bg-rose-50 text-rose-700",
};

const statusLabelMap: Record<string, string> = {
  active: "активен",
  onboarding: "в адаптации",
  vacation: "в отпуске",
  inactive: "неактивен",
  CREATED: "создан",
  ACTIVE: "активен",
  COMPLETED: "завершён",
  CANCELLED: "отменён",
  draft: "черновик",
  published: "опубликован",
  archived: "архив",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", statusMap[status] ?? "bg-slate-100 text-slate-600")}>
      {statusLabelMap[status] ?? status}
    </span>
  );
}
