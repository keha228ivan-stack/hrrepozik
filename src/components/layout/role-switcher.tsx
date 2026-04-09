"use client";

import { useAuth } from "@/contexts/auth-context";

export function RoleSwitcher() {
  const { logout } = useAuth();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 p-1 text-sm">
      <span className="rounded-full bg-blue-600 px-4 py-1 text-white">Менеджер</span>
      <button onClick={logout} className="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100">
        Выйти
      </button>
    </div>
  );
}
