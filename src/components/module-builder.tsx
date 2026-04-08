export function ModuleBuilder() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Программа курса / модули</h3>
      <div className="space-y-3">
        <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Название модуля" />
        <textarea className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={3} placeholder="Краткое описание модуля" />
        <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm">+ Добавить модуль</button>
      </div>
    </div>
  );
}
