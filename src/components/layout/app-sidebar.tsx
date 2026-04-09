"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, FileBarChart2, Home, LibraryBig, Users } from "lucide-react";
import { isNavLinkActive } from "@/components/layout/sidebar-utils";

const managerNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/manager/employees", label: "Сотрудники", icon: Users },
  { href: "/manager/training", label: "Обучение", icon: BookOpen },
  { href: "/manager/courses", label: "Библиотека курсов", icon: LibraryBig },
  { href: "/manager/reports", label: "Отчёты", icon: FileBarChart2 },
  { href: "/manager/notifications", label: "Уведомления", icon: Bell },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-h-screen w-72 border-r border-slate-200 bg-slate-50 px-4 py-6">
      <nav className="space-y-2">
        {managerNav.map(({ href, label, icon: Icon }) => {
          const active = isNavLinkActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
