import { CourseCard } from "@/components/course-card";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { courses } from "@/lib/mock-data";

export default function ManagerCoursesPage() {
  return (
    <div>
      <SectionHeader title="Библиотека курсов" subtitle="Черновики, опубликованные и архивные курсы" />
      <SearchFilterBar placeholder="Поиск курса по названию" />
      <div className="grid gap-4 xl:grid-cols-3">
        {courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </div>
  );
}
