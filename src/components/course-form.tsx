"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { courseSchema, type CourseFormValues } from "@/lib/course-form-schema";
import { useAuth } from "@/contexts/auth-context";

export function CourseForm() {
  const [quizQuestions, setQuizQuestions] = useState([{ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" }]);
  const [lessons, setLessons] = useState([{ title: "", content: "", files: [] as File[] }]);
  const { authFetch } = useAuth();
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      category: "",
      level: "",
      duration: "",
      description: "",
      instructor: "",
      quizTitle: "",
      passingScore: 70,
      quizQuestionsJson: "",
      lessonsJson: "",
    },
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [createdCourse, setCreatedCourse] = useState<{ id: string; title: string; status: string; category?: string; level?: string; duration?: string; instructor?: string } | null>(null);

  const [descriptionValue, titleValue, categoryValue, durationValue] = useWatch({
    control: form.control,
    name: ["description", "title", "category", "duration"],
  });

  const lessonFilePreviews = useMemo(
    () => lessons.flatMap((lesson) => lesson.files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }))),
    [lessons],
  );
  useEffect(() => () => {
    for (const preview of lessonFilePreviews) {
      URL.revokeObjectURL(preview.url);
    }
  }, [lessonFilePreviews]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setCreatedCourse(null);

    const payload = new FormData();
    payload.append("title", values.title);
    payload.append("category", values.category);
    payload.append("level", values.level?.trim() || "Базовый");
    payload.append("duration", values.duration);
    payload.append("description", values.description);
    payload.append("instructor", values.instructor?.trim() || "Внутренний курс");
    payload.append("quizTitle", values.quizTitle ?? "");
    payload.append("passingScore", String(values.passingScore ?? ""));
    const normalizedQuizQuestions = quizQuestions
      .map((item) => ({
        question: item.question.trim(),
        options: [item.optionA.trim(), item.optionB.trim(), item.optionC.trim(), item.optionD.trim()].filter(Boolean),
        correctOption: item.correctOption,
      }))
      .filter((item) => item.question && item.options.length >= 2);
    payload.append("quizQuestionsJson", JSON.stringify(normalizedQuizQuestions));
    const normalizedLessons = lessons
        .map((lesson) => ({
          title: lesson.title.trim(),
          content: lesson.content.trim(),
          fileNames: lesson.files.map((file) => file.name),
        }))
        .filter((lesson) => lesson.title);
    payload.append("lessonsJson", JSON.stringify(normalizedLessons));
    lessons.forEach((lesson, lessonIndex) => {
      lesson.files.forEach((file) => payload.append(`lessonFiles:${lessonIndex}`, file));
    });

    const response = await authFetch("/api/courses", {
      method: "POST",
      body: payload,
    });

    const data = (await response.json()) as { error?: string; message?: string; course?: { id: string; title: string; status: string; category?: string; level?: string; duration?: string; instructor?: string } };

    if (!response.ok) {
      setSubmitError(data.error ?? "Не удалось создать курс");
      return;
    }

    setSubmitSuccess(data.message ?? "Курс успешно создан");
    setCreatedCourse(data.course ?? null);
    form.reset();
    setQuizQuestions([{ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" }]);
    setLessons([{ title: "", content: "", files: [] }]);
    setIsPreviewOpen(false);
  });

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-2">
          <div>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Название курса" {...form.register("title")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.title?.message}</p>
          </div>
          <div>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Категория" {...form.register("category")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.category?.message}</p>
          </div>
          <div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Длительность (число дней)"
              type="number"
              min={1}
              onChange={(event) => form.setValue("duration", formatDurationToDays(event.target.value), { shouldValidate: true })}
            />
            <p className="mt-1 text-xs text-slate-500">{durationValue || "Например: 5 дн."}</p>
            <input type="hidden" {...form.register("duration")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.duration?.message}</p>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Описание курса (rich text)</label>
            <div className="mb-2 flex gap-2">
              <button type="button" onClick={() => document.execCommand("bold")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">
                B
              </button>
              <button type="button" onClick={() => document.execCommand("italic")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">
                I
              </button>
              <button type="button" onClick={() => document.execCommand("insertUnorderedList")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50">
                • List
              </button>
            </div>
            <div
              contentEditable
              className="min-h-28 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              onInput={(event) => form.setValue("description", (event.target as HTMLDivElement).innerHTML, { shouldValidate: true })}
              suppressContentEditableWarning
            />
            <textarea className="hidden" {...form.register("description")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.description?.message}</p>
          </div>
          <div>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Тест: название (необязательно)" {...form.register("quizTitle")} />
          </div>
          <div>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" type="number" min={1} max={100} placeholder="Проходной балл % (по умолчанию 70)" {...form.register("passingScore", { valueAsNumber: true })} />
          </div>
          <div className="md:col-span-2 space-y-3 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-800">Тест с вариантами ответов</p>
            {quizQuestions.map((item, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Вопрос {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => setQuizQuestions((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))}
                    disabled={quizQuestions.length === 1}
                    className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Удалить вопрос
                  </button>
                </div>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder={`Вопрос ${index + 1}`}
                  value={item.question}
                  onChange={(event) => setQuizQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, question: event.target.value } : q)))}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  {(["optionA", "optionB", "optionC", "optionD"] as const).map((key, optionIndex) => (
                    <input
                      key={key}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder={`Вариант ${String.fromCharCode(65 + optionIndex)}`}
                      value={item[key]}
                      onChange={(event) => setQuizQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [key]: event.target.value } : q)))}
                    />
                  ))}
                </div>
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={item.correctOption}
                  onChange={(event) => setQuizQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, correctOption: event.target.value } : q)))}
                >
                  <option value="A">Правильный вариант: A</option>
                  <option value="B">Правильный вариант: B</option>
                  <option value="C">Правильный вариант: C</option>
                  <option value="D">Правильный вариант: D</option>
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setQuizQuestions((prev) => [...prev, { question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" }])}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              + Добавить вопрос
            </button>
          </div>
          <div className="md:col-span-2 space-y-3 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-800">Уроки курса</p>
            {lessons.map((lesson, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Урок {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => setLessons((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))}
                    disabled={lessons.length === 1}
                    className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Удалить урок
                  </button>
                </div>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder={`Урок ${index + 1}: название`} value={lesson.title} onChange={(event) => setLessons((prev) => prev.map((item, i) => (i === index ? { ...item, title: event.target.value } : item)))} />
                <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={2} placeholder="Содержание урока: текст, ссылки, описание материалов" value={lesson.content} onChange={(event) => setLessons((prev) => prev.map((item, i) => (i === index ? { ...item, content: event.target.value } : item)))} />
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  type="file"
                  accept=".pdf,.doc,.docx,image/*,video/*"
                  multiple
                  onChange={(event) => setLessons((prev) => prev.map((item, i) => (i === index ? { ...item, files: Array.from(event.target.files ?? []) } : item)))}
                />
                {lesson.files.length ? <p className="text-xs text-slate-500">Файлы урока: {lesson.files.map((file) => file.name).join(", ")}</p> : null}
              </div>
            ))}
            <button type="button" onClick={() => setLessons((prev) => [...prev, { title: "", content: "", files: [] }])} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              + Добавить урок
            </button>
          </div>
        </div>

        {submitError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{submitError}</p> : null}
        {submitSuccess ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{submitSuccess}</p> : null}
        {createdCourse ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold">Созданный курс: {createdCourse.title}</p>
            <p className="mt-1">Статус: {createdCourse.status}</p>
            <p className="mt-1">Преподаватель: {createdCourse.instructor ?? "—"}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={form.formState.isSubmitting} className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Создать курс
          </button>
          <button type="button" onClick={() => setIsPreviewOpen(true)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Предпросмотр
          </button>
        </div>
      </form>

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Предпросмотр курса</h3>
              <button type="button" onClick={() => setIsPreviewOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <h4 className="text-2xl font-semibold">{titleValue || "Название курса"}</h4>
            <p className="mt-2 text-sm text-slate-600">{categoryValue || "Категория"} · {durationValue || "Длительность"}</p>
            <div className="prose prose-sm mt-4 max-w-none rounded-xl border border-slate-100 bg-slate-50 p-4" dangerouslySetInnerHTML={{ __html: descriptionValue || "<p>Описание появится здесь</p>" }} />

            {lessonFilePreviews.length ? (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-slate-700">Материалы уроков</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {lessonFilePreviews.map((preview) => (
                    <li key={preview.name} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <a href={preview.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {preview.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
  const formatDurationToDays = (raw: string) => {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return "";
    return `${value} дн.`;
  };
