import { ManagerCourseLibrary } from "@/components/manager-course-library";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SectionHeader } from "@/components/ui/section-header";
import Link from "next/link";

export default function ManagerCoursesPage() {
  return (
    <div>
      <SectionHeader
        title="Библиотека курсов"
        subtitle="Раздел менеджера: черновики, опубликованные и архивные курсы"
        action={(
          <Link href="/manager/courses/new" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Создать курс
          </Link>
        )}
      />
      <SearchFilterBar placeholder="Поиск курса по названию" />
      <ManagerCourseLibrary />
    </div>
  );
}
