import { employeeProfiles, users } from "@/lib/mock-data";
import { ProgressBar } from "@/components/ui/progress-bar";

export function TopPerformersCard() {
  const top = employeeProfiles
    .map((p) => ({ ...p, user: users.find((u) => u.id === p.userId) }))
    .sort((a, b) => b.performance - a.performance)
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Лидеры месяца</h3>
      <div className="space-y-4">
        {top.map((item) => (
          <div key={item.userId}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-slate-800">{item.user?.fullName}</span>
              <span className="text-slate-500">{item.performance}%</span>
            </div>
            <ProgressBar value={item.performance} />
          </div>
        ))}
      </div>
    </div>
  );
}
