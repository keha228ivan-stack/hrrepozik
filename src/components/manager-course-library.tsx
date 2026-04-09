"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";

type ApiCourse = {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string;
  instructor: string;
  createdBy?: string;
  lastEditedBy?: string;
  status: "draft" | "published" | "archived";
  enrolledCount?: number;
  completedCount?: number;
};

type EditDraft = {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string;
  instructor: string;
};

export function ManagerCourseLibrary() {
  const { authFetch } = useAuth();
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch("/api/courses");
      const data = (await response.json()) as { courses?: ApiCourse[]; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить курсы");
        return;
      }
      setCourses(data.courses ?? []);
    } catch {
      setError("Ошибка при загрузке курсов");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const openEdit = (course: ApiCourse) => {
    setEditDraft({
      id: course.id,
      title: course.title,
      category: course.category,
      level: course.level,
      duration: course.duration,
      description: course.description,
      instructor: course.instructor,
    });
  };

  const saveCourse = async () => {
    if (!editDraft) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await authFetch(`/api/courses/${editDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editDraft.title,
          category: editDraft.category,
          level: editDraft.level,
          duration: editDraft.duration,
          description: editDraft.description,
          instructor: editDraft.instructor,
        }),
      });
      const data = (await response.json()) as { error?: string; message?: string; course?: ApiCourse };
      if (!response.ok) {
        setError(data.error ?? "Не удалось обновить курс");
        return;
      }
      setSuccess(data.message ?? "Курс обновлён");
      setEditDraft(null);
      void loadCourses();
    } catch {
      setError("Ошибка при сохранении курса");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const response = await authFetch(`/api/courses/${courseId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(data.error ?? "Не удалось удалить курс");
        return;
      }
      setSuccess(data.message ?? "Курс удалён");
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
    } catch {
      setError("Ошибка при удалении курса");
    }
  };

  const sortedCourses = useMemo(() => [...courses].sort((a, b) => a.title.localeCompare(b.title)), [courses]);

  if (isLoading) {
    return <p className="inline-flex items-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Загрузка курсов...</p>;
  }

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      {!sortedCourses.length ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Курсы пока не созданы.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {sortedCourses.map((course) => {
            const enrolled = course.enrolledCount ?? 0;
            const completed = course.completedCount ?? 0;
            const progress = enrolled ? Math.round((completed / enrolled) * 100) : 0;
            return (
              <article key={course.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{course.title}</h3>
                  <StatusBadge status={course.status} />
                </div>
                <p className="mb-4 text-sm text-slate-500">{course.description}</p>
                <div className="mb-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <p>Категория: {course.category}</p>
                  <p>Уровень: {course.level}</p>
                  <p>Длительность: {course.duration}</p>
                  <p>Участников: {enrolled}</p>
                </div>
                <p className="mb-2 text-xs text-slate-500">Создал: {course.createdBy ?? "manager"} · Последний редактор: {course.lastEditedBy ?? course.createdBy ?? "manager"}</p>
                <ProgressBar value={progress} />

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href={`/manager/courses/${course.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Открыть
                  </Link>
                  <button type="button" onClick={() => openEdit(course)} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Pencil className="mr-1 h-4 w-4" /> Редактировать
                  </button>
                  <button type="button" onClick={() => void deleteCourse(course.id)} className="col-span-2 inline-flex items-center justify-center rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                    <Trash2 className="mr-1 h-4 w-4" /> Удалить курс
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Редактировать курс</h3>
              <button type="button" onClick={() => setEditDraft(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3">
              <input value={editDraft.title} onChange={(event) => setEditDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Название" />
              <input value={editDraft.category} onChange={(event) => setEditDraft((prev) => (prev ? { ...prev, category: event.target.value } : prev))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Категория" />
              <input value={editDraft.level} onChange={(event) => setEditDraft((prev) => (prev ? { ...prev, level: event.target.value } : prev))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Уровень" />
              <input value={editDraft.duration} onChange={(event) => setEditDraft((prev) => (prev ? { ...prev, duration: event.target.value } : prev))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Длительность" />
              <input value={editDraft.instructor} onChange={(event) => setEditDraft((prev) => (prev ? { ...prev, instructor: event.target.value } : prev))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Инструктор" />
              <textarea value={editDraft.description} onChange={(event) => setEditDraft((prev) => (prev ? { ...prev, description: event.target.value } : prev))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={4} placeholder="Описание" />
              <button type="button" disabled={isSaving} onClick={() => void saveCourse()} className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
