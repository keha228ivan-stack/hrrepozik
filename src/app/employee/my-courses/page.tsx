import { enrollments, courses } from "@/lib/mock-data";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionHeader } from "@/components/ui/section-header";

export default function EmployeeMyCoursesPage() {
  return (
    <div>
      <SectionHeader title="Мои курсы" subtitle="Текущие курсы, дедлайны и прогресс" />
      <div className="space-y-3">
        {enrollments.map((enrollment) => {
          const course = courses.find((item) => item.id === enrollment.courseId);
          return (
            <div key={enrollment.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-semibold">{course?.title}</p>
                  <p className="text-sm text-slate-500">Дедлайн: {enrollment.deadline}</p>
                </div>
                <StatusBadge status={enrollment.status} />
              </div>
              <ProgressBar value={enrollment.progress} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
