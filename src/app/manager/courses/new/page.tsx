import { CourseForm } from "@/components/course-form";
import { SectionHeader } from "@/components/ui/section-header";

export default function ManagerNewCoursePage() {
  return (
    <div className="page-enter-from-left">
      <SectionHeader title="Создание курса" subtitle="Заполните данные курса, загрузите материалы и проверьте предпросмотр" />
      <CourseForm />
    </div>
  );
}
