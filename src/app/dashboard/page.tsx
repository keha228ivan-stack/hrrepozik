"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/contexts/auth-context";

const managerMenu = [
  { href: "/manager/employees", label: "Управление сотрудниками" },
  { href: "/manager/training", label: "Назначение обучения" },
  { href: "/manager/courses/new", label: "Создать курс" },
  { href: "/manager/courses", label: "Библиотека курсов" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <SectionHeader title="Панель менеджера" subtitle={`Кабинет доступен только менеджерам${user ? ` · ${user.fullName}` : ""}`} />
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Здесь вы управляете сотрудниками, курсами и назначениями обучения.
      </div>
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
    </div>
  );
}
