"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/contexts/auth-context";

type EmployeeRow = {
  id: string;
  fullName: string;
  email: string;
  departmentId: string | null;
  employeeProfile: {
    position: string;
    status: "active" | "onboarding" | "vacation" | "inactive";
    performance: number;
    completedCourses: number;
    inProgressCourses: number;
  } | null;
};

type DepartmentOption = {
  id: string;
  name: string;
};

type EmployeeTableProps = {
  query: string;
  departmentId: string;
  status: string;
  onDepartmentsChange: (departments: DepartmentOption[]) => void;
};

export function EmployeeTable({ query, departmentId, status, onDepartmentsChange }: EmployeeTableProps) {
  const { authFetch } = useAuth();
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    position: "",
    departmentId: "",
    status: "onboarding",
  });

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch("/api/manager/employees");
      const data = (await response.json()) as { employees?: EmployeeRow[]; departments?: DepartmentOption[]; error?: string };
      if (!response.ok) {
        if (response.status === 401) {
          setError("Сессия истекла. Выполните вход в аккаунт менеджера.");
        } else if (response.status === 403) {
          setError("Раздел сотрудников доступен только менеджерам.");
        } else {
          setError(data.error ?? "Не удалось загрузить список сотрудников. Попробуйте снова.");
        }
        return;
      }
      setRows(data.employees ?? []);
      const receivedDepartments = data.departments ?? [];
      setDepartments(receivedDepartments);
      onDepartmentsChange(receivedDepartments);
    } catch {
      setError("Сетевая ошибка при загрузке сотрудников. Проверьте интернет и попробуйте снова.");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, onDepartmentsChange]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!formState.fullName || !formState.email || !formState.position) {
      setError("Заполните обязательные поля");
      return;
    }

    setIsAdding(true);
    try {
      const response = await authFetch("/api/manager/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = (await response.json()) as { error?: string; message?: string; employee?: EmployeeRow };
      if (!response.ok) {
        if (response.status === 401) {
          setError("Сессия истекла. Выполните вход в аккаунт менеджера.");
          return;
        }
        if (response.status === 403) {
          setError("Добавление сотрудников доступно только менеджерам.");
          return;
        }
        setError(data.error ?? "Не удалось добавить сотрудника. Проверьте данные и попробуйте снова.");
        return;
      }

      setSuccess(data.message ?? `Сотрудник «${formState.fullName}» успешно добавлен.`);
      setFormState({
        fullName: "",
        email: "",
        position: "",
        departmentId: "",
        status: "onboarding",
      });
      if (data.employee) {
        setRows((prev) => [...prev, data.employee]);
      } else {
        await loadEmployees();
      }
    } catch {
      setError("Сетевая ошибка при добавлении сотрудника. Попробуйте снова.");
    } finally {
      setIsAdding(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const renderedRows = useMemo(() => rows
    .filter((row) => {
      if (departmentId && row.departmentId !== departmentId) {
        return false;
      }

      const rowStatus = row.employeeProfile?.status ?? "inactive";
      if (status && rowStatus !== status) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [row.fullName, row.email, row.employeeProfile?.position ?? ""].join(" ").toLowerCase();
      return searchable.includes(normalizedQuery);
    })
    .map((row) => {
      const department = departments.find((dep) => dep.id === row.departmentId);
      return { row, department };
    }), [departmentId, departments, normalizedQuery, rows, status]);

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-5">
        <input value={formState.fullName} onChange={(event) => setFormState((prev) => ({ ...prev, fullName: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="ФИО *" />
        <input value={formState.email} onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Email *" type="email" />
        <input value={formState.position} onChange={(event) => setFormState((prev) => ({ ...prev, position: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Должность *" />
        <select value={formState.departmentId} onChange={(event) => setFormState((prev) => ({ ...prev, departmentId: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="">Без отдела</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
        <button type="submit" disabled={isAdding} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
          {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Добавить сотрудника
        </button>
      </form>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      {isLoading ? (
        <div className="inline-flex items-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Загрузка сотрудников...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                {["ФИО", "Email", "Должность", "Отдел", "Статус", "Эффективность", "Курсы"].map((head) => (
                  <th key={head} className="px-4 py-3 font-medium">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderedRows.map(({ row, department }) => (
                <tr key={row.id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{row.email}</td>
                  <td className="px-4 py-3 text-slate-600">{row.employeeProfile?.position ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{department?.name ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.employeeProfile?.status ?? "inactive"} /></td>
                  <td className="px-4 py-3">
                    <div className="max-w-28">
                      <ProgressBar value={row.employeeProfile?.performance ?? 0} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{(row.employeeProfile?.completedCourses ?? 0) + (row.employeeProfile?.inProgressCourses ?? 0)}</td>
                </tr>
              ))}
              {!renderedRows.length ? (
                <tr className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>Сотрудники по выбранным фильтрам не найдены.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
