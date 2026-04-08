import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";

export default function ManagerReportsPage() {
  return (
    <div>
      <SectionHeader
        title="Отчёты"
        subtitle="Статистика завершения курсов, тестов и активности"
        action={<div className="flex gap-2"><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Экспорт PDF</button><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Экспорт Excel</button></div>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Завершение курсов" value="74%" trend="+8%" />
        <StatCard title="Средний балл тестов" value="83%" trend="+4%" />
        <StatCard title="Активность сотрудников" value="91%" trend="+6%" />
        <StatCard title="Просроченные курсы" value="3" trend="-2%" />
      </div>
    </div>
  );
}
