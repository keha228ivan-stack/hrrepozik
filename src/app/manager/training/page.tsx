import { CourseCard } from "@/components/course-card";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { courses } from "@/lib/mock-data";

export default function ManagerTrainingPage() {
  return (
    <div>
      <SectionHeader title="Обучение" subtitle="Программы обучения и прогресс прохождения" />
      <SearchFilterBar placeholder="Поиск по курсам и категориям" />
      <div className="grid gap-4 xl:grid-cols-3">
        {courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </div>
  );
}
