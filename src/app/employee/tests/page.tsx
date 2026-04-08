import { quizAttempts } from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionHeader } from "@/components/ui/section-header";

export default function EmployeeTestsPage() {
  return (
    <div>
      <SectionHeader title="Тесты и результаты" subtitle="История прохождений и рекомендации" />
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="px-4 py-3">Баллы</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Дата</th><th className="px-4 py-3">Попытки</th></tr>
          </thead>
          <tbody>
            {quizAttempts.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{item.score}%</td>
                <td className="px-4 py-3"><StatusBadge status={item.passed ? "completed" : "inactive"} /></td>
                <td className="px-4 py-3">{item.completedAt}</td>
                <td className="px-4 py-3">{item.attemptCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
