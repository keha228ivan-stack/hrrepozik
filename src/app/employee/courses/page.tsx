import { courses } from "@/lib/mock-data";
import { CourseCard } from "@/components/course-card";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SectionHeader } from "@/components/ui/section-header";

export default function EmployeeCoursesPage() {
  return (
    <div>
      <SectionHeader title="Доступные курсы" subtitle="Выберите программу и запишитесь" />
      <SearchFilterBar placeholder="Поиск по названию курса" />
      <div className="grid gap-4 xl:grid-cols-3">
        {courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </div>
  );
}
