import { notifications } from "@/lib/mock-data";
import { SectionHeader } from "@/components/ui/section-header";

export default function ManagerNotificationsPage() {
  const managerNotifications = notifications.filter((item) => item.userId === "u-1");
  return (
    <div>
      <SectionHeader title="Уведомления" subtitle="Системные и операционные события" />
      <div className="space-y-3">
        {managerNotifications.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
