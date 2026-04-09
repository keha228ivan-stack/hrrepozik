"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAuth } from "@/contexts/auth-context";

type ReportsData = {
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    avgProgress: number;
    completedCourses: number;
    overdueCourses: number;
  };
  topEmployees: Array<{
    userId: string;
    fullName: string;
    progress: number;
    completed: number;
  }>;
};

export default function ManagerReportsPage() {
  const { authFetch } = useAuth();
  const [data, setData] = useState<ReportsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      const response = await authFetch("/api/reports/summary");
      const payload = (await response.json()) as ReportsData & { error?: string };
      if (!response.ok) {
        if (response.status === 401) {
          setError("Сессия истекла. Выполните вход в аккаунт менеджера.");
          return;
        }
        if (response.status === 403) {
          setError("Раздел отчётов доступен только менеджерам.");
          return;
        }
        setError(payload.error ?? "Не удалось загрузить отчёты. Попробуйте снова.");
        return;
      }
      setData(payload);
    };
    void load();
  }, [authFetch]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Отчёты"
        subtitle="Статистика завершения курсов, активности и общего прогресса сотрудников"
      />

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {!data ? (
        <p className="inline-flex items-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Загрузка отчёта...</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Всего сотрудников" value={String(data.summary.totalEmployees)} trend="" />
            <StatCard title="Активных сотрудников" value={String(data.summary.activeEmployees)} trend="" />
            <StatCard title="Средний прогресс" value={`${data.summary.avgProgress}%`} trend="" />
            <StatCard title="Завершённых курсов" value={String(data.summary.completedCourses)} trend="" />
            <StatCard title="Просроченные курсы" value={String(data.summary.overdueCourses)} trend="" />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Топ сотрудников по обучению</h3>
            <p className="mb-3 text-xs text-slate-500">Просроченные курсы = дедлайн в прошлом и статус не «завершён/отменён».</p>
            <div className="space-y-4">
              {data.topEmployees.map((employee) => (
                <div key={employee.userId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{employee.fullName}</span>
                    <span className="text-slate-500">Прогресс: {employee.progress}% · Завершено: {employee.completed}</span>
                  </div>
                  <ProgressBar value={employee.progress} />
                </div>
              ))}
              {!data.topEmployees.length ? <p className="text-sm text-slate-500">Пока нет данных по сотрудникам.</p> : null}
            </div>
          </div>
          {!data.summary.totalEmployees ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Это новый аккаунт без сотрудников. Добавьте сотрудников, создайте курс и назначьте обучение — после этого отчёты заполнятся автоматически.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
