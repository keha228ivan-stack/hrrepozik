import { ProgressBar } from "@/components/ui/progress-bar";

type TopPerformer = {
  userId: string;
  fullName: string;
  progress: number;
  completed: number;
};

export function TopPerformersCard({ performers }: { performers: TopPerformer[] }) {
  const top = performers.slice(0, 3);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Лидеры месяца</h3>
      <div className="space-y-4">
        {top.map((item) => (
          <div key={item.userId}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-slate-800">{item.fullName}</span>
              <span className="text-slate-500">{item.progress}%</span>
            </div>
            <ProgressBar value={item.progress} />
            <p className="mt-1 text-xs text-slate-500">Завершено курсов: {item.completed}</p>
          </div>
        ))}
        {!top.length ? <p className="text-sm text-slate-500">Пока нет данных.</p> : null}
      </div>
    </div>
  );
}
