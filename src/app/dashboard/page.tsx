"use client";

import Link from "next/link";
import { managerStats } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/stat-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/contexts/auth-context";

const managerMenu = [
  { href: "/manager/employees", label: "Employee Management" },
  { href: "/manager/training", label: "Training Programs" },
  { href: "/manager/performance", label: "Performance Analytics" },
  { href: "/manager/courses", label: "Course Management" },
];

const employeeMenu = [
  { href: "/employee/my-courses", label: "My Courses" },
  { href: "/employee/courses", label: "Course Catalog" },
  { href: "/employee/tests", label: "Progress Tracker" },
  { href: "/employee/certificates", label: "Certificates" },
];

export default function DashboardPage() {
  const { role, user } = useAuth();
  const menu = role === "manager" ? managerMenu : employeeMenu;
  const title = role === "manager" ? "Manager Dashboard" : "Employee Dashboard";
  const subtitle =
    role === "manager"
      ? "Управление сотрудниками, курсами и показателями эффективности"
      : "Ваши курсы, прогресс, тесты и сертификаты";

  return (
    <div className="space-y-6">
      <SectionHeader title={title} subtitle={`${subtitle}${user ? ` · ${user.fullName}` : ""}`} />
      <div className="grid gap-4 md:grid-cols-2">
        {menu.map((item) => (
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
