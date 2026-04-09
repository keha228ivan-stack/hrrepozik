"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { StatusBadge } from "@/components/ui/status-badge";

type EmployeeOption = {
  id: string;
  fullName: string;
  email: string;
};

type CourseOption = {
  id: string;
  title: string;
  category: string;
  status: string;
};

type EnrollmentView = {
  id: string;
  status: string;
  progress: number;
  createdAt: string;
  course: {
    id: string;
    title: string;
    category: string;
    duration: string;
  };
};

export function AssignCoursePanel() {
  const { authFetch } = useAuth();
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedCourses, setAssignedCourses] = useState<EnrollmentView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedEmployeeName = useMemo(
    () => employees.find((employee) => employee.id === employeeId)?.fullName ?? "",
    [employeeId, employees],
  );

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authFetch("/api/assign-course");
        const data = (await response.json()) as { error?: string; employees?: EmployeeOption[]; courses?: CourseOption[] };
        if (!response.ok) {
          if (response.status === 401) {
            setError("Сессия истекла. Выполните вход в аккаунт менеджера.");
            return;
          }
          if (response.status === 403) {
            setError("Раздел назначения обучения доступен только менеджерам.");
            return;
          }
          setError(data.error ?? "Не удалось загрузить сотрудников и курсы. Попробуйте снова.");
          return;
        }

        const nextEmployees = data.employees ?? [];
        const nextCourses = data.courses ?? [];
        setEmployees(nextEmployees);
        setCourses(nextCourses);
        setEmployeeId(nextEmployees[0]?.id ?? "");
        setCourseId(nextCourses[0]?.id ?? "");
      } catch {
        setError("Сетевая ошибка при загрузке данных. Проверьте интернет и попробуйте снова.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMetadata();
  }, [authFetch]);

  useEffect(() => {
    if (!employeeId) {
      setAssignedCourses([]);
      return;
    }

    const loadAssignedCourses = async () => {
      const response = await authFetch(`/api/assign-course?userId=${employeeId}`);
      const data = (await response.json()) as { enrollments?: EnrollmentView[]; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить назначенные курсы");
        return;
      }
      setAssignedCourses(data.enrollments ?? []);
    };

    void loadAssignedCourses();
  }, [authFetch, employeeId]);

  const assignCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId || !courseId) {
      setError("Выберите сотрудника и курс");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authFetch("/api/assign-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: employeeId, courseId, deadline: deadline || undefined }),
      });

      const data = (await response.json()) as { message?: string; error?: string; enrollment?: EnrollmentView };
      if (!response.ok) {
        if (response.status === 401) {
          setError("Сессия истекла. Выполните вход в аккаунт менеджера.");
          return;
        }
        if (response.status === 403) {
          setError("Назначение обучения доступно только менеджерам.");
          return;
        }
        setError(data.error ?? "Не удалось назначить курс. Проверьте данные и попробуйте снова.");
        return;
      }
      const selectedCourseTitle = courses.find((course) => course.id === courseId)?.title ?? "курс";
      const employeeName = employees.find((employee) => employee.id === employeeId)?.fullName ?? "сотруднику";
      setSuccess(data.message ?? `Курс «${selectedCourseTitle}» успешно назначен: ${employeeName}.`);
      if (data.enrollment) {
        setAssignedCourses((prev) => [data.enrollment, ...prev]);
      }
    } catch {
      setError("Сетевая ошибка при назначении курса. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Назначить курс сотруднику</h2>
      <p className="mt-1 text-sm text-slate-500">Выберите сотрудника, курс и крайний срок прохождения.</p>

      {isLoading ? (
        <div className="mt-4 inline-flex items-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : (
        <form onSubmit={assignCourse} className="mt-4 grid gap-3 md:grid-cols-4">
          <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName} ({employee.email})
              </option>
            ))}
          </select>

          <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} · {course.category}
              </option>
            ))}
          </select>

          <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />

          <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Назначить курс
          </button>
        </form>
      )}

      {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      {selectedEmployeeName ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-800">Назначенные курсы: {selectedEmployeeName}</h3>
          <div className="mt-2 space-y-2">
            {assignedCourses.length ? assignedCourses.map((assignment) => (
              <div key={assignment.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <p className="font-medium text-slate-800">{assignment.course.title}</p>
                <p className="mt-1 text-xs text-slate-500">Прогресс: {assignment.progress}% · Назначен: {new Date(assignment.createdAt).toLocaleDateString()}</p>
                <div className="mt-1">
                  <StatusBadge status={assignment.status} />
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">Курсы пока не назначены.</p>}
          </div>
        </div>
      ) : null}
    </section>
  );
}
