import { certificates, courses } from "@/lib/mock-data";
import { SectionHeader } from "@/components/ui/section-header";

export default function EmployeeCertificatesPage() {
  return (
    <div>
      <SectionHeader title="Сертификаты" subtitle="Полученные сертификаты и скачивание" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {certificates.map((certificate) => {
          const course = courses.find((item) => item.id === certificate.courseId);
          return (
            <div key={certificate.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-lg font-semibold">{course?.title}</p>
              <p className="mt-2 text-sm text-slate-500">Дата выдачи: {certificate.issueDate}</p>
              <div className="mt-4 flex gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Предпросмотр</button>
                <button className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white">Скачать</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
