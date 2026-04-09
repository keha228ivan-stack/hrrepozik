import { CourseCard } from "@/components/course-card";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { courses } from "@/lib/mock-data";
import Link from "next/link";

export default function ManagerCoursesPage() {
  return (
    <div>
      <SectionHeader
        title="Библиотека курсов"
        subtitle="Черновики, опубликованные и архивные курсы"
        action={(
          <Link href="/manager/courses/new" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Создать курс
          </Link>
        )}
      />
      <SearchFilterBar placeholder="Поиск курса по названию" />
      <div className="grid gap-4 xl:grid-cols-3">
        {courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </div>
  );
}
