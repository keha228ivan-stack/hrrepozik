"use client";

import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

const managerMenu = [
  { href: "/manager/employees", label: "Управление сотрудниками" },
  { href: "/manager/training", label: "Назначение обучения" },
  { href: "/manager/courses/new", label: "Создать курс" },
  { href: "/manager/courses", label: "Библиотека курсов" },
  { href: "/manager/reports", label: "Отчёты" },
];

export default function DashboardPage() {
  const { user, authFetch } = useAuth();
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState([
    { title: "Всего сотрудников", value: "0", trend: "" },
    { title: "Активных", value: "0", trend: "" },
    { title: "Средний прогресс", value: "0%", trend: "" },
    { title: "Пройдено курсов", value: "0", trend: "" },
  ]);
  const isEmptyAccount = stats.every((item) => item.value === "0" || item.value === "0%");

  useEffect(() => {
    const loadStats = async () => {
      setStatsError(null);
      try {
        const response = await authFetch("/api/reports/summary");
        const data = (await response.json()) as {
          summary?: {
            totalEmployees: number;
            activeEmployees: number;
            avgProgress: number;
            completedCourses: number;
          };
          error?: string;
        };
        if (!response.ok || !data.summary) {
          if (response.status === 401) {
            setStatsError("Сессия истекла. Выполните вход в аккаунт менеджера.");
          } else if (response.status === 403) {
            setStatsError("Раздел дашборда доступен только менеджерам.");
          } else {
            setStatsError(data.error ?? "Не удалось загрузить статистику. Попробуйте снова.");
          }
          return;
        }

        setStats([
          { title: "Всего сотрудников", value: String(data.summary.totalEmployees), trend: "" },
          { title: "Активных", value: String(data.summary.activeEmployees), trend: "" },
          { title: "Средний прогресс", value: `${data.summary.avgProgress}%`, trend: "" },
          { title: "Пройдено курсов", value: String(data.summary.completedCourses), trend: "" },
        ]);
      } catch {
        setStatsError("Сетевая ошибка при загрузке статистики. Проверьте интернет и попробуйте снова.");
      }
    };

    void loadStats();
  }, [authFetch]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Панель менеджера" subtitle={`Кабинет доступен только менеджерам${user ? ` · ${user.fullName}` : ""}`} />
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Здесь вы управляете сотрудниками, курсами, назначениями и отчётностью.
      </div>
      {isEmptyAccount ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Похоже, это новый аккаунт. С чего начать:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Добавьте первого сотрудника.</li>
            <li>Создайте первый курс.</li>
            <li>Назначьте обучение сотруднику и отслеживайте прогресс в отчётах.</li>
          </ol>
        </div>
      ) : null}
      {statsError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{statsError}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {managerMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-slate-100 bg-white p-5 text-lg font-semibold shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
