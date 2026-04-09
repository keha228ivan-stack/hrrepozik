import { courses } from "@/lib/mock-data";
import { ProgressBar } from "@/components/ui/progress-bar";

export default async function ManagerCourseDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const course = courses.find((c) => c.id === id) ?? courses[0];
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{course.title}</h1>
      <p className="text-slate-500">{course.description}</p>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Прогресс курса</h2>
        <ProgressBar value={Math.round((course.completedCount / course.enrolledCount) * 100)} />
      </div>
    </div>
  );
}
