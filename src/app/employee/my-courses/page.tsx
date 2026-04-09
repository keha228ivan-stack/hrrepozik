import { EmployeeAssignedCourses } from "@/components/employee-assigned-courses";
import { SectionHeader } from "@/components/ui/section-header";

export default async function EmployeeMyCoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ userId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const userId = params.userId ?? "";

  return (
    <div>
      <SectionHeader
        title="Назначенные курсы"
        subtitle="Список назначений сотруднику с датой, статусом и прогрессом"
      />
      {userId ? (
        <EmployeeAssignedCourses userId={userId} />
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Выберите сотрудника, передав параметр <code>userId</code> в URL.
        </p>
      )}
    </div>
  );
}
