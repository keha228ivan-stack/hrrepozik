import { CourseForm } from "@/components/course-form";
import { SectionHeader } from "@/components/ui/section-header";

export default function ManagerNewCoursePage() {
  return (
    <div>
      <SectionHeader title="Управление курсами" subtitle="Создание курса, загрузка материалов и тестов" />
      <CourseForm />
    </div>
  );
}
