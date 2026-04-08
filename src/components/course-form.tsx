"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FileUploadField } from "@/components/file-upload-field";
import { ModuleBuilder } from "@/components/module-builder";
import { QuizBuilder } from "@/components/quiz-builder";

const courseSchema = z.object({
  title: z.string().min(3, "Введите название курса"),
  category: z.string().min(2, "Выберите категорию"),
  level: z.string().min(2, "Выберите уровень"),
  duration: z.string().min(1, "Укажите длительность"),
  description: z.string().min(10, "Добавьте описание"),
  instructor: z.string().min(3, "Укажите преподавателя"),
});

type CourseFormValues = z.infer<typeof courseSchema>;

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

  return (
    <form onSubmit={form.handleSubmit(() => undefined)} className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-2">
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Название курса" {...form.register("title")} />
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Категория" {...form.register("category")} />
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Уровень сложности" {...form.register("level")} />
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Длительность" {...form.register("duration")} />
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Преподаватель" {...form.register("instructor")} />
        <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Дедлайн прохождения" type="date" />
        <textarea className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={4} placeholder="Описание курса" {...form.register("description")} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FileUploadField label="Обложка курса" accept="image/*" />
        <FileUploadField label="Видео-материалы" accept="video/*" />
        <FileUploadField label="Дополнительные материалы" accept=".pdf,.doc,.docx,image/*" />
      </div>

      <ModuleBuilder />
      <QuizBuilder />

      <div className="flex flex-wrap gap-3">
        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Сохранить курс</button>
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Опубликовать курс</button>
        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Предпросмотр</button>
      </div>
    </form>
  );
}
