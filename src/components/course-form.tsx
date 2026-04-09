"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, PlayCircle, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().min(3, "Введите название курса"),
  category: z.string().min(2, "Выберите категорию"),
  level: z.string().min(2, "Выберите уровень"),
  duration: z.string().min(1, "Укажите длительность"),
  description: z.string().min(10, "Добавьте описание"),
  instructor: z.string().min(3, "Укажите преподавателя"),
});

type CourseFormValues = z.infer<typeof courseSchema>;

function fileSizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CourseForm() {
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

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const descriptionValue = form.watch("description");

  const coverPreviewUrl = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : null), [coverFile]);
  const sampleVideo = videoFiles[0] ?? null;

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!coverFile) {
      setSubmitError("Загрузите обложку курса");
      return;
    }

    if (videoFiles.length === 0) {
      setSubmitError("Добавьте хотя бы одно видео");
      return;
    }

    const payload = new FormData();
    payload.append("title", values.title);
    payload.append("category", values.category);
    payload.append("level", values.level);
    payload.append("duration", values.duration);
    payload.append("description", values.description);
    payload.append("instructor", values.instructor);
    payload.append("cover", coverFile);
    for (const video of videoFiles) {
      payload.append("videos", video);
    }
    for (const material of materialFiles) {
      payload.append("materials", material);
    }

    const response = await fetch("/api/manager/courses", {
      method: "POST",
      body: payload,
    });

    const data = (await response.json()) as { error?: string; message?: string };

    if (!response.ok) {
      setSubmitError(data.error ?? "Не удалось создать курс");
      return;
    }

    setSubmitSuccess(data.message ?? "Курс успешно создан");
    form.reset();
    setCoverFile(null);
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

        <div className="grid gap-4 md:grid-cols-3">
          <label className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <span className="mb-2 flex items-center gap-2 font-medium"><ImagePlus className="h-4 w-4" />Обложка курса</span>
            <input
              className="w-full text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
            />
            {coverFile ? <p className="mt-2 text-xs text-slate-500">{coverFile.name} · {fileSizeLabel(coverFile.size)}</p> : null}
          </label>

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
            {materialFiles.length ? <p className="mt-2 text-xs text-slate-500">Файлов: {materialFiles.length}</p> : null}
          </label>
        </div>

        {submitError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{submitError}</p> : null}
        {submitSuccess ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{submitSuccess}</p> : null}

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

            {coverPreviewUrl ? <img src={coverPreviewUrl} alt="Course cover preview" className="mb-4 h-52 w-full rounded-xl object-cover" /> : null}
            <h4 className="text-2xl font-semibold">{form.watch("title") || "Название курса"}</h4>
            <p className="mt-2 text-sm text-slate-600">{form.watch("category") || "Категория"} · {form.watch("duration") || "Длительность"} · {form.watch("level") || "Уровень"}</p>
            <p className="mt-1 text-sm text-slate-500">Преподаватель: {form.watch("instructor") || "Не указан"}</p>
            <div className="prose prose-sm mt-4 max-w-none rounded-xl border border-slate-100 bg-slate-50 p-4" dangerouslySetInnerHTML={{ __html: descriptionValue || "<p>Описание появится здесь</p>" }} />

            {sampleVideo ? (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-slate-700">Пример видео</p>
                <video controls className="w-full rounded-xl" src={URL.createObjectURL(sampleVideo)} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
