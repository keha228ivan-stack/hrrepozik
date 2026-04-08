import type { Course } from "@/lib/types";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";

export function CourseCard({ course }: { course: Course }) {
  const progress = course.enrolledCount ? Math.round((course.completedCount / course.enrolledCount) * 100) : 0;
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{course.title}</h3>
        <StatusBadge status={course.status} />
      </div>
      <p className="mb-4 text-sm text-slate-500">{course.description}</p>
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
        <p>Категория: {course.category}</p>
        <p>Уровень: {course.level}</p>
        <p>Длительность: {course.duration}</p>
        <p>Участников: {course.enrolledCount}</p>
      </div>
      <ProgressBar value={progress} />
      <button className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Открыть / редактировать</button>
    </article>
  );
}
