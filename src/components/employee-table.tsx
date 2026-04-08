import { departments, employeeProfiles, users } from "@/lib/mock-data";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";

export function EmployeeTable() {
  const rows = employeeProfiles.map((profile) => {
    const user = users.find((u) => u.id === profile.userId);
    const department = departments.find((dep) => dep.id === user?.departmentId);
    return { profile, user, department };
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-sm text-slate-500">
          <tr>
            {["ФИО", "Должность", "Отдел", "Статус", "Эффективность", "Курсы"].map((head) => (
              <th key={head} className="px-4 py-3 font-medium">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ profile, user, department }) => (
            <tr key={profile.userId} className="border-t border-slate-100 text-sm">
              <td className="px-4 py-3 font-medium text-slate-900">{user?.fullName}</td>
              <td className="px-4 py-3 text-slate-600">{profile.position}</td>
              <td className="px-4 py-3 text-slate-600">{department?.name}</td>
              <td className="px-4 py-3"><StatusBadge status={profile.status} /></td>
              <td className="px-4 py-3">
                <div className="max-w-28">
                  <ProgressBar value={profile.performance} />
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{profile.completedCourses + profile.inProgressCourses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
