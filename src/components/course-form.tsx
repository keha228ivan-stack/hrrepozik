"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlayCircle, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { courseSchema, type CourseFormValues } from "@/lib/course-form-schema";
import { useAuth } from "@/contexts/auth-context";

function fileSizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CourseForm() {
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
    },
  });

  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [createdCourse, setCreatedCourse] = useState<{ id: string; title: string; status: string; category?: string; level?: string; duration?: string; instructor?: string } | null>(null);

  const [descriptionValue, titleValue, categoryValue, durationValue, levelValue, instructorValue] = useWatch({
    control: form.control,
    name: ["description", "title", "category", "duration", "level", "instructor"],
  });

  const sampleVideo = videoFiles[0] ?? null;
  const sampleVideoPreviewUrl = useMemo(() => (sampleVideo ? URL.createObjectURL(sampleVideo) : null), [sampleVideo]);
  const materialPreviews = useMemo(
    () => materialFiles.map((material) => ({ name: material.name, url: URL.createObjectURL(material) })),
    [materialFiles],
  );

  useEffect(() => () => {
    if (sampleVideoPreviewUrl) URL.revokeObjectURL(sampleVideoPreviewUrl);
  }, [sampleVideoPreviewUrl]);

  useEffect(() => () => {
    for (const preview of materialPreviews) {
      URL.revokeObjectURL(preview.url);
    }
  }, [materialPreviews]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    setCreatedCourse(null);

    if (videoFiles.length === 0) {
      setSubmitError("Добавьте хотя бы одно видео");
      return;
    }
    if (videoFiles.some((video) => !video.type.startsWith("video/"))) {
      setSubmitError("Разрешены только видео-файлы");
      return;
    }

    const payload = new FormData();
    payload.append("title", values.title);
    payload.append("category", values.category);
    payload.append("level", values.level);
    payload.append("duration", values.duration);
    payload.append("description", values.description);
    payload.append("instructor", values.instructor);
    for (const video of videoFiles) {
      payload.append("videos", video);
    }
    for (const material of materialFiles) {
      payload.append("materials", material);
    }

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
    setVideoFiles([]);
    setMaterialFiles([]);
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
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Уровень сложности" {...form.register("level")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.level?.message}</p>
          </div>
          <div>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Длительность" {...form.register("duration")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.duration?.message}</p>
          </div>
          <div>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Преподаватель" {...form.register("instructor")} />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.instructor?.message}</p>
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <span className="mb-2 flex items-center gap-2 font-medium"><PlayCircle className="h-4 w-4" />Видео-материалы</span>
            <input
              className="w-full text-sm"
              type="file"
              accept="video/*"
              multiple
              onChange={(event) => setVideoFiles(Array.from(event.target.files ?? []))}
            />
            {videoFiles.length ? <p className="mt-2 text-xs text-slate-500">Файлов: {videoFiles.length}</p> : null}
          </label>

          <label className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <span className="mb-2 flex items-center gap-2 font-medium"><Upload className="h-4 w-4" />Доп. материалы</span>
            <input
              className="w-full text-sm"
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              multiple
              onChange={(event) => setMaterialFiles(Array.from(event.target.files ?? []))}
            />
            {materialFiles.length ? (
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                {materialFiles.map((material) => (
                  <p key={material.name}>{material.name} · {fileSizeLabel(material.size)}</p>
                ))}
              </div>
            ) : null}
          </label>
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
            <p className="mt-2 text-sm text-slate-600">{categoryValue || "Категория"} · {durationValue || "Длительность"} · {levelValue || "Уровень"}</p>
            <p className="mt-1 text-sm text-slate-500">Преподаватель: {instructorValue || "Не указан"}</p>
            <div className="prose prose-sm mt-4 max-w-none rounded-xl border border-slate-100 bg-slate-50 p-4" dangerouslySetInnerHTML={{ __html: descriptionValue || "<p>Описание появится здесь</p>" }} />

            {sampleVideoPreviewUrl ? (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-slate-700">Пример видео</p>
                <video controls className="w-full rounded-xl" src={sampleVideoPreviewUrl} />
              </div>
            ) : null}

            {materialFiles.length ? (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-slate-700">Прикреплённые материалы</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {materialPreviews.map((preview) => (
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
