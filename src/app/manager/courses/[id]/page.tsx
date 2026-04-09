"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProgressBar } from "@/components/ui/progress-bar";

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  enrolledCount?: number;
  completedCount?: number;
};

export default function ManagerCourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params?.id;
  const { authFetch } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!courseId) return;
      const response = await authFetch(`/api/courses/${courseId}`);
      const data = (await response.json()) as { course?: CourseDetail; error?: string };
      if (!response.ok || !data.course) {
        setError(data.error ?? "Курс не найден");
        return;
      }
      setCourse(data.course);
    };
    void load();
  }, [authFetch, courseId]);

  if (error) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  }

  if (!course) {
    return <p className="inline-flex items-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Загрузка курса...</p>;
  }

  const enrolled = course.enrolledCount ?? 0;
  const completed = course.completedCount ?? 0;
  const progress = enrolled ? Math.round((completed / enrolled) * 100) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{course.title}</h1>
      <p className="text-slate-500">{course.description}</p>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Прогресс курса</h2>
        <p className="mb-2 text-sm text-slate-600">Категория: {course.category} · Уровень: {course.level} · Длительность: {course.duration}</p>
        <p className="mb-4 text-sm text-slate-500">Инструктор: {course.instructor}</p>
        <ProgressBar value={progress} />
      </div>
    </div>
  );
}
