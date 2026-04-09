"use client";

import Link from "next/link";
import { managerStats } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/stat-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/contexts/auth-context";

const managerMenu = [
  { href: "/manager/employees", label: "Employee Management" },
  { href: "/manager/training", label: "Training Programs" },
  { href: "/manager/courses/new", label: "Create Course" },
  { href: "/manager/courses", label: "Course Library" },
  { href: "/manager/reports", label: "Reports" },
];

export default function DashboardPage() {
  const { user } = useAuth();

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
        {managerStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
