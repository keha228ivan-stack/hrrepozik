"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { TopPerformersCard } from "@/components/top-performers-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAuth } from "@/contexts/auth-context";

const PerformanceChart = dynamic(
  () => import("@/components/performance-chart").then((mod) => mod.PerformanceChart),
  { ssr: false },
);

type ReportsData = {
  summary: {
    avgProgress: number;
    totalEmployees: number;
  };
  topEmployees: Array<{
    userId: string;
    fullName: string;
    progress: number;
    completed: number;
  }>;
};

export default function ManagerPerformancePage() {
  const { authFetch } = useAuth();
  const [data, setData] = useState<ReportsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setError(null);
      try {
        const response = await authFetch("/api/reports/summary");
        const payload = (await response.json()) as ReportsData & { error?: string };
        if (!response.ok) {
          setError(payload.error ?? "Не удалось загрузить данные эффективности.");
          return;
        }
        setData(payload);
      } catch {
        setError("Сетевая ошибка при загрузке данных эффективности.");
      }
    };

    void loadData();
  }, [authFetch]);

  const levelDistribution = useMemo(() => {
    const items = data?.topEmployees ?? [];
    if (!items.length) {
      return { excellent: 0, good: 0, fair: 0, low: 0 };
    }
    const total = items.length;
    const excellent = Math.round((items.filter((item) => item.progress >= 90).length / total) * 100);
    const good = Math.round((items.filter((item) => item.progress >= 80 && item.progress < 90).length / total) * 100);
    const fair = Math.round((items.filter((item) => item.progress >= 70 && item.progress < 80).length / total) * 100);
    const low = Math.max(0, 100 - excellent - good - fair);
    return { excellent, good, fair, low };
  }, [data?.topEmployees]);

  const chartData = useMemo(() => (data?.topEmployees ?? []).map((item) => ({
    name: item.fullName.split(" ")[0] ?? item.fullName,
    score: item.progress,
  })), [data?.topEmployees]);

  if (!data && !error) {
    return (
      <div className="inline-flex items-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Загрузка данных эффективности...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Оценка эффективности" subtitle="Распределение уровней, лидеры и зоны улучшения" />
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Распределение по уровням</h3>
          <div className="space-y-3 text-sm">
            <p>Отлично (90-100%) <ProgressBar value={levelDistribution.excellent} /></p>
            <p>Хорошо (80-89%) <ProgressBar value={levelDistribution.good} /></p>
            <p>Удовлетворительно (70-79%) <ProgressBar value={levelDistribution.fair} /></p>
            <p>Требует улучшения (&lt;70%) <ProgressBar value={levelDistribution.low} /></p>
          </div>
        </div>
        <TopPerformersCard performers={data?.topEmployees ?? []} />
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Средний балл по тестам</h3>
          <p className="text-4xl font-semibold text-slate-900">{data?.summary.avgProgress ?? 0}%</p>
          <p className="mt-2 text-sm text-slate-500">Сотрудников в выборке: {data?.summary.totalEmployees ?? 0}</p>
        </div>
      </div>
      <PerformanceChart data={chartData} />
    </div>
  );
}
