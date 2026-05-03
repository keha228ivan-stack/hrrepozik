"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProgressBar } from "@/components/ui/progress-bar";

type Lesson = { id?: string; title: string; duration: string; description: string };
type QuizQuestion = { id?: string; question: string; options: string[]; correctOption: string };

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  createdBy?: string;
  lastEditedBy?: string;
  enrolledCount?: number;
  completedCount?: number;
  lessons?: Lesson[];
  quizTitle?: string;
  passingScore?: number;
  quizQuestions?: QuizQuestion[];
  attachments?: Array<{ id: string; name: string; type: string; url: string }>;
};

export default function ManagerCourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params?.id;
  const { authFetch } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const saveCourse = async () => {
    if (!course) return;
    setIsSaving(true);
    setError(null);
    const response = await authFetch(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(course),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) setError(data.error ?? "Не удалось сохранить курс");
    setIsSaving(false);
  };

  if (error) return <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  if (!course) return <p className="inline-flex items-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Загрузка курса...</p>;

  const enrolled = course.enrolledCount ?? 0;
  const completed = course.completedCount ?? 0;
  const progress = enrolled ? Math.round((completed / enrolled) * 100) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Редактирование курса</h1>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={course.title} onChange={(e) => setCourse((prev) => prev ? { ...prev, title: e.target.value } : prev)} />
        <textarea className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={3} value={course.description} onChange={(e) => setCourse((prev) => prev ? { ...prev, description: e.target.value } : prev)} />
        <p className="text-sm text-slate-600">Категория: {course.category} · Уровень: {course.level} · Длительность: {course.duration}</p>
        <p className="text-sm text-slate-500">Инструктор: {course.instructor}</p>
        <p className="text-sm text-slate-500">Создал: {course.createdBy ?? "manager"} · Последний редактор: {course.lastEditedBy ?? course.createdBy ?? "manager"}</p>
        <ProgressBar value={progress} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        <p className="text-lg font-semibold">Уроки</p>
        {(course.lessons ?? []).map((lesson, i) => (
          <div key={lesson.id ?? i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={lesson.title} onChange={(e) => setCourse((prev) => prev ? { ...prev, lessons: (prev.lessons ?? []).map((x, idx) => idx === i ? { ...x, title: e.target.value } : x) } : prev)} />
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={lesson.duration} onChange={(e) => setCourse((prev) => prev ? { ...prev, lessons: (prev.lessons ?? []).map((x, idx) => idx === i ? { ...x, duration: e.target.value } : x) } : prev)} />
            <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={lesson.description} onChange={(e) => setCourse((prev) => prev ? { ...prev, lessons: (prev.lessons ?? []).map((x, idx) => idx === i ? { ...x, description: e.target.value } : x) } : prev)} />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        <p className="text-lg font-semibold">Тест</p>
        {(course.quizQuestions ?? []).map((q, i) => (
          <div key={q.id ?? i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={q.question} onChange={(e) => setCourse((prev) => prev ? { ...prev, quizQuestions: (prev.quizQuestions ?? []).map((x, idx) => idx === i ? { ...x, question: e.target.value } : x) } : prev)} />
          </div>
        ))}
      </div>

      <button type="button" onClick={() => void saveCourse()} disabled={isSaving} className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Сохранить изменения
      </button>
    </div>
  );
}
