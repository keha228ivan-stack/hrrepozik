import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().trim().min(3, "Введите название курса"),
  category: z.string().trim().min(2, "Выберите категорию"),
  level: z.string().trim().min(2, "Выберите уровень"),
  duration: z.string().trim().min(1, "Укажите длительность"),
  description: z.string().trim().min(10, "Добавьте описание"),
  instructor: z.string().trim().min(3, "Укажите преподавателя"),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
