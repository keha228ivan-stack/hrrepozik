import Link from "next/link";

export default function Home() {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold">Платформа HR + LMS</h1>
      <p className="mt-2 text-slate-600">Выберите точку входа в интерфейс:</p>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard" className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white">Открыть Dashboard</Link>
        <Link href="/login" className="rounded-xl border border-slate-200 px-4 py-2 font-medium text-slate-700">Страница входа</Link>
      </div>
    </div>
  );
}
