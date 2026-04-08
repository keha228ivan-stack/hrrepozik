export function QuizBuilder() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Создание тестов</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Текст вопроса" />
        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option>single choice</option>
          <option>multiple choice</option>
          <option>text answer</option>
        </select>
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Варианты ответов через запятую" />
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Правильный ответ" />
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Баллы" />
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Лимит времени (мин)" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm">+ Добавить ещё вопрос</button>
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Проходной балл" />
      </div>
    </div>
  );
}
