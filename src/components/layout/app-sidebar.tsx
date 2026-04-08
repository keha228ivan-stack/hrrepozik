"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Briefcase, ClipboardList, FileBarChart2, Home, LibraryBig, Medal, UserCircle, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const managerNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/manager/employees", label: "Сотрудники", icon: Users },
  { href: "/manager/training", label: "Обучение", icon: BookOpen },
  { href: "/manager/performance", label: "Оценка эффективности", icon: Medal },
  { href: "/manager/courses/new", label: "Создать курс", icon: ClipboardList },
  { href: "/manager/courses", label: "Библиотека курсов", icon: LibraryBig },
  { href: "/manager/reports", label: "Отчёты", icon: FileBarChart2 },
  { href: "/manager/notifications", label: "Уведомления", icon: Bell },
];

const employeeNav = [
  { href: "/employee/profile", label: "Личный кабинет", icon: UserCircle },
  { href: "/employee/courses", label: "Доступные курсы", icon: LibraryBig },
  { href: "/employee/my-courses", label: "Мои курсы", icon: Briefcase },
  { href: "/employee/tests", label: "Тесты и результаты", icon: ClipboardList },
  { href: "/employee/certificates", label: "Сертификаты", icon: Medal },
  { href: "/employee/notifications", label: "Уведомления", icon: Bell },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const links = role === "employee" ? employeeNav : managerNav;

  return (
    <aside className="min-h-screen w-72 border-r border-slate-200 bg-slate-50 px-4 py-6">
      <nav className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
