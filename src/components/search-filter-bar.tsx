import { Search } from "lucide-react";

type DepartmentOption = {
  id: string;
  name: string;
};

interface SearchFilterBarProps {
  placeholder?: string;
  query: string;
  onQueryChange: (value: string) => void;
  departmentId: string;
  onDepartmentChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  departments: DepartmentOption[];
}

export function SearchFilterBar({
  placeholder = "Поиск...",
  query,
  onQueryChange,
  departmentId,
  onDepartmentChange,
  status,
  onStatusChange,
  departments = [],
}: SearchFilterBarProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <label className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          placeholder={placeholder}
        />
      </label>
      <select
        value={departmentId}
        onChange={(event) => onDepartmentChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
      >
        <option value="">Все отделы</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>{department.name}</option>
        ))}
      </select>
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
      >
        <option value="">Все статусы</option>
        <option value="active">active</option>
        <option value="onboarding">onboarding</option>
        <option value="vacation">vacation</option>
        <option value="inactive">inactive</option>
      </select>
    </div>
  );
}
