import { AssignCoursePanel } from "@/components/assign-course-panel";
import { SectionHeader } from "@/components/ui/section-header";

export default function ManagerTrainingPage() {
  return (
    <div>
      <SectionHeader title="Обучение" subtitle="Программы обучения и прогресс прохождения" />
      <AssignCoursePanel />
    </div>
  );
}
