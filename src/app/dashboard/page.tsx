"use client";

import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

const managerMenu = [
  { href: "/manager/employees", label: "Employee Management" },
  { href: "/manager/training", label: "Training Programs" },
  { href: "/manager/courses/new", label: "Create Course" },
  { href: "/manager/courses", label: "Course Library" },
  { href: "/manager/reports", label: "Reports" },
];

export default function DashboardPage() {
  const { user, authFetch } = useAuth();
  const [stats, setStats] = useState([
    { title: "Всего сотрудников", value: "0", trend: "" },
    { title: "Активных", value: "0", trend: "" },
    { title: "Средний прогресс", value: "0%", trend: "" },
    { title: "Пройдено курсов", value: "0", trend: "" },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      const response = await authFetch("/api/reports/summary");
      const data = (await response.json()) as {
        summary?: {
          totalEmployees: number;
          activeEmployees: number;
          avgProgress: number;
          completedCourses: number;
        };
      };
      if (!response.ok || !data.summary) return;

      setStats([
        { title: "Всего сотрудников", value: String(data.summary.totalEmployees), trend: "" },
        { title: "Активных", value: String(data.summary.activeEmployees), trend: "" },
        { title: "Средний прогресс", value: `${data.summary.avgProgress}%`, trend: "" },
        { title: "Пройдено курсов", value: String(data.summary.completedCourses), trend: "" },
      ]);
    };

    void loadStats();
  }, [authFetch]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Manager Dashboard" subtitle={`Управление сотрудниками, курсами и отчётами${user ? ` · ${user.fullName}` : ""}`} />
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
