"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ProgressBar } from "@/components/ui/progress-bar";

type AssignedCourse = {
  id: string;
  status: string;
  progress: number;
  createdAt: string;
  course: {
    id: string;
    title: string;
  };
};

export function EmployeeAssignedCourses({ userId }: { userId: string }) {
  const { authFetch } = useAuth();
  const [courses, setCourses] = useState<AssignedCourse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await authFetch(`/api/assign-course?userId=${userId}`);
      const data = (await response.json()) as { enrollments?: AssignedCourse[]; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить назначенные курсы");
        return;
      }
      setCourses(data.enrollments ?? []);
    };

    void load();
  }, [authFetch, userId]);

  if (error) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  }

  if (!courses.length) {
    return <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Курсы пока не назначены.</p>;
  }

  return (
    <div className="space-y-3">
      {courses.map((enrollment) => (
        <article key={enrollment.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="font-semibold text-slate-900">{enrollment.course.title}</p>
          <p className="mt-1 text-xs text-slate-500">Назначено: {new Date(enrollment.createdAt).toLocaleDateString()} · Статус: {enrollment.status}</p>
          <div className="mt-3">
            <ProgressBar value={enrollment.progress} />
          </div>
        </article>
      ))}
    </div>
  );
}
