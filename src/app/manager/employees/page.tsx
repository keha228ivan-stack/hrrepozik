import { EmployeeTable } from "@/components/employee-table";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SectionHeader } from "@/components/ui/section-header";

export default function ManagerEmployeesPage() {
  return (
    <div>
      <SectionHeader
        title="Сотрудники"
        subtitle="Управление персоналом, поиск и фильтрация"
        action={<button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Добавить сотрудника</button>}
      />
      <SearchFilterBar placeholder="Поиск по имени, должности, отделу" />
      <EmployeeTable />
    </div>
  );
}
