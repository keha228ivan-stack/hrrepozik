import { EmployeeTable } from "@/components/employee-table";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SectionHeader } from "@/components/ui/section-header";

export default function ManagerEmployeesPage() {
  return (
    <div>
      <SectionHeader
        title="Сотрудники"
        subtitle="Управление персоналом, поиск и фильтрация"
      />
      <SearchFilterBar placeholder="Поиск по имени, должности, отделу" />
      <EmployeeTable />
    </div>
  );
}
