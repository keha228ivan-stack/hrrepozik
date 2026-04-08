"use client";

import dynamic from "next/dynamic";
import { SectionHeader } from "@/components/ui/section-header";
import { TopPerformersCard } from "@/components/top-performers-card";
import { ProgressBar } from "@/components/ui/progress-bar";

const PerformanceChart = dynamic(
  () => import("@/components/performance-chart").then((mod) => mod.PerformanceChart),
  { ssr: false },
);

export default function ManagerPerformancePage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Оценка эффективности" subtitle="Распределение уровней, лидеры и зоны улучшения" />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Распределение по уровням</h3>
          <div className="space-y-3 text-sm">
            <p>Отлично (90-100%) <ProgressBar value={35} /></p>
            <p>Хорошо (80-89%) <ProgressBar value={40} /></p>
            <p>Удовлетворительно (70-79%) <ProgressBar value={18} /></p>
            <p>Требует улучшения (&lt;70%) <ProgressBar value={7} /></p>
          </div>
        </div>
        <TopPerformersCard />
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Средний балл по тестам</h3>
          <p className="text-4xl font-semibold text-slate-900">83%</p>
          <p className="mt-2 text-sm text-slate-500">2 сотрудника требуют улучшения</p>
        </div>
      </div>
      <PerformanceChart />
    </div>
  );
}
