import { notifications } from "@/lib/mock-data";
import { SectionHeader } from "@/components/ui/section-header";

export default function EmployeeNotificationsPage() {
  const employeeNotifications = notifications.filter((item) => item.userId === "u-2");
  return (
    <div>
      <SectionHeader title="Уведомления" subtitle="Важные события по обучению и тестам" />
      <div className="space-y-3">
        {employeeNotifications.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
