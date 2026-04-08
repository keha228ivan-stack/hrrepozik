import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";

export default function EmployeeProfilePage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Личный кабинет" subtitle="Добро пожаловать, Иванов Иван!" />
      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-violet-500 text-3xl font-semibold text-white">ИИ</div>
          <p className="text-xl font-semibold">Иванов Иван</p>
          <p className="text-slate-500">Senior Developer</p>
        </div>
        <StatCard title="Моя эффективность" value="92%" />
        <StatCard title="Пройдено курсов" value="5" />
        <StatCard title="В процессе" value="2" />
      </div>
    </div>
  );
}
