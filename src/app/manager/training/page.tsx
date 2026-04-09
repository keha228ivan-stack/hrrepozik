import { AssignCoursePanel } from "@/components/assign-course-panel";
import { SectionHeader } from "@/components/ui/section-header";

export default function ManagerTrainingPage() {
  return (
    <div>
      <SectionHeader title="Обучение" subtitle="Раздел менеджера: назначение курсов и контроль прогресса" />
      <AssignCoursePanel />
    </div>
  );
}
