import { Bell, Settings } from "lucide-react";
import { RoleSwitcher } from "@/components/layout/role-switcher";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
      <div>
        <p className="text-3xl font-semibold text-slate-900">Система управления персоналом</p>
        <p className="text-sm text-slate-500">Учёт персонала, обучения и оценки эффективности</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><Bell className="h-5 w-5" /></button>
        <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><Settings className="h-5 w-5" /></button>
        <RoleSwitcher />
      </div>
    </header>
  );
}
