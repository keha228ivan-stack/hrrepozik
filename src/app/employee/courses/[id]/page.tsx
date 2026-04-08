import { courses } from "@/lib/mock-data";
import { ProgressBar } from "@/components/ui/progress-bar";

export default async function EmployeeCourseDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const course = courses.find((c) => c.id === id) ?? courses[0];

  return (
    <div className="space-y-4">
      <div className="h-48 rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-400 p-6 text-white">
        <h1 className="text-3xl font-semibold">{course.title}</h1>
        <p className="mt-2 max-w-2xl">{course.description}</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Видео-превью и материалы</h2>
        <p className="text-sm text-slate-600">Видео, файлы и тест после модулей доступны в блоке курса.</p>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Прогресс</h2>
        <ProgressBar value={64} />
        <button className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Пройти тест</button>
      </div>
    </div>
  );
}
