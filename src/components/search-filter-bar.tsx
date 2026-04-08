import { Search } from "lucide-react";

interface SearchFilterBarProps {
  placeholder?: string;
}

export function SearchFilterBar({ placeholder = "Поиск..." }: SearchFilterBarProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <label className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500" placeholder={placeholder} />
      </label>
      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
        <option>Все отделы</option>
        <option>Разработка</option>
        <option>Маркетинг</option>
      </select>
      <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
        <option>Все статусы</option>
        <option>active</option>
        <option>in_progress</option>
      </select>
      <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Применить</button>
    </div>
  );
}
