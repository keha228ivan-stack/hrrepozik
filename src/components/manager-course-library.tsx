"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { useAuth } from "@/contexts/auth-context";
import type { Course } from "@/lib/types";

type ApiCourse = {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  status: "draft" | "published" | "archived";
  instructor?: string;
};

function normalizeLevel(level: string): Course["level"] {
  if (level === "Базовый" || level === "Средний" || level === "Продвинутый") {
    return level;
  }
  return "Базовый";
}

export function ManagerCourseLibrary() {
  const { authFetch } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authFetch("/api/courses");
        const data = (await response.json()) as { courses?: ApiCourse[]; error?: string };
        if (!response.ok) {
          setError(data.error ?? "Не удалось загрузить курсы");
          return;
        }

        const mappedCourses: Course[] = (data.courses ?? []).map((course) => ({
          id: course.id,
          title: course.title,
          category: course.category,
          level: normalizeLevel(course.level),
          duration: course.duration,
          description: `Курс ${course.title} создан менеджером`,
          instructor: course.instructor ?? "Не указан",
          status: course.status,
          enrolledCount: 0,
          completedCount: 0,
          modules: [],
          attachments: [],
        }));
        setCourses(mappedCourses);
      } catch {
        setError("Ошибка при загрузке курсов");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCourses();
  }, [authFetch]);

  if (isLoading) {
    return <p className="inline-flex items-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Загрузка курсов...</p>;
  }

  if (error) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  }

  if (!courses.length) {
    return <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Курсы пока не созданы.</p>;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {courses.map((course) => <CourseCard key={course.id} course={course} />)}
    </div>
  );
}
