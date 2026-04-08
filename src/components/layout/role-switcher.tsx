"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export function RoleSwitcher() {
  const { role, logout } = useAuth();
  const isEmployee = role === "employee";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 p-1 text-sm">
      <Link href="/manager/employees" className={`rounded-full px-4 py-1 ${!isEmployee ? "bg-blue-600 text-white" : "text-slate-600"}`}>
        Менеджер
      </Link>
      <Link href="/employee/profile" className={`rounded-full px-4 py-1 ${isEmployee ? "bg-blue-600 text-white" : "text-slate-600"}`}>
        Сотрудник
      </Link>
      <button onClick={logout} className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100">
        Выйти
      </button>
    </div>
  );
}
