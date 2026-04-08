import { TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
}

export function StatCard({ title, value, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-slate-50 p-2 text-slate-500">
          <TrendingUp className="h-4 w-4" />
        </div>
        {trend ? <span className="text-sm font-medium text-emerald-600">{trend}</span> : null}
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
