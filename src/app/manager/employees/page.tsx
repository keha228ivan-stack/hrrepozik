"use client";

import { useState } from "react";
import { EmployeeTable } from "@/components/employee-table";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SectionHeader } from "@/components/ui/section-header";

export default function ManagerEmployeesPage() {
  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  return (
    <div>
      <SectionHeader
        title="Сотрудники"
        subtitle="Управление персоналом, поиск и фильтрация"
      />
      <SearchFilterBar
        placeholder="Поиск по имени, должности, email"
        query={query}
        onQueryChange={setQuery}
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        status={status}
        onStatusChange={setStatus}
        departments={departments}
      />
      <EmployeeTable
        query={query}
        departmentId={departmentId}
        status={status}
        onDepartmentsChange={setDepartments}
      />
    </div>
  );
}
