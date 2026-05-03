import { CourseStatus } from "@prisma/client";
import { db } from "@/server/db";
import { HttpError } from "@/server/http-error";
import { getCourseAuditMap } from "@/server/fallback-store";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function asFile(value: FormDataEntryValue) {
  return value instanceof File ? value : null;
}

export async function createCourseFromFormData(formData: FormData) {
  const title = readString(formData, "title");
  const category = readString(formData, "category");
  const level = readString(formData, "level");
  const duration = readString(formData, "duration");
  const description = readString(formData, "description");
  const instructor = readString(formData, "instructor");
  const quizTitle = readString(formData, "quizTitle");
  const quizQuestionsJson = readString(formData, "quizQuestionsJson");
  const lessonsJson = readString(formData, "lessonsJson");
  const passingScoreRaw = readString(formData, "passingScore");

  if (!title || !category || !duration || !description) {
    throw new HttpError(400, "All course fields are required");
  }

  const existing = await db.course.findFirst({
    where: { title },
    select: { id: true },
  });
  if (existing) {
    throw new HttpError(409, "Course with this title already exists");
  }

  const createdCourse = await db.course.create({
    data: {
      title,
      category,
      level: level || "Базовый",
      duration,
      description,
      instructor: instructor || "Внутренний курс",
      status: CourseStatus.draft,
    },
    select: {
      id: true,
      title: true,
      category: true,
      level: true,
      duration: true,
      instructor: true,
      status: true,
    },
  });

  const lessons = (() => {
    if (!lessonsJson) return [];
    try {
      const parsed = JSON.parse(lessonsJson) as Array<{ title?: string; content?: string; fileNames?: string[] }>;
      return parsed
        .map((item, index) => ({
          title: String(item.title ?? "").trim(),
          content: String(item.content ?? "").trim(),
          fileNames: Array.isArray(item.fileNames) ? item.fileNames.map((name) => String(name).trim()).filter(Boolean) : [],
          index,
        }))
        .filter((item) => item.title);
    } catch {
      return [];
    }
  })();
  if (lessons.length) {
    const canCreateAttachment = typeof (db as Record<string, unknown>).courseAttachment === "object"
      && typeof (db as { courseAttachment?: { createMany?: (args: Record<string, unknown>) => Promise<unknown> } }).courseAttachment?.createMany === "function";
    const canCreateCourseModule = typeof (db as Record<string, unknown>).courseModule === "object"
      && typeof (db as { courseModule?: { createMany?: (args: Record<string, unknown>) => Promise<unknown> } }).courseModule?.createMany === "function";
    const lessonAttachments = lessons.flatMap((lesson) =>
      formData.getAll(`lessonFiles:${lesson.index}`).map(asFile).filter(Boolean).map((file) => ({
        courseId: createdCourse.id,
        name: file.name,
        type: file.type || "application/octet-stream",
        url: `uploads/lesson-materials/${Date.now()}-${file.name}`,
        lessonIndex: lesson.index,
      })),
    );
    if (lessonAttachments.length && canCreateAttachment) {
      await db.courseAttachment.createMany({
        data: lessonAttachments.map(({ courseId, name, type, url }) => ({ courseId, name, type, url })),
      });
    }
    if (canCreateCourseModule) {
      await db.courseModule.createMany({
        data: lessons.map((lesson) => ({
          courseId: createdCourse.id,
          title: lesson.title,
          description: `${lesson.content || "Содержание урока не указано"}${lesson.fileNames.length ? `\nФайлы: ${lesson.fileNames.join(", ")}` : ""}`,
          duration: "—",
        })),
      });
    }
  }
  const structuredQuestions = (() => {
    if (!quizQuestionsJson) return [];
    try {
      const parsed = JSON.parse(quizQuestionsJson) as Array<{ question?: string; options?: string[]; correctOption?: string }>;
      return parsed
        .map((item) => ({
          question: String(item.question ?? "").trim(),
          options: Array.isArray(item.options) ? item.options.map((option) => String(option).trim()).filter(Boolean) : [],
          correctOption: String(item.correctOption ?? "A").trim().toUpperCase(),
        }))
        .filter((item) => item.question && item.options.length >= 2);
    } catch {
      return [];
    }
  })();
  const passingScore = Number(passingScoreRaw || "70");
  const canCreateQuiz = typeof (db as Record<string, unknown>).quiz === "object" && (db as { quiz?: { create: (args: Record<string, unknown>) => Promise<unknown> } }).quiz?.create;
  if (quizTitle && structuredQuestions.length && canCreateQuiz) {
    const questionsToCreate = structuredQuestions.map((item) => ({
      question: item.question,
      answerType: "single",
      points: 1,
      options: {
        create: item.options.map((option, optionIndex) => ({
          text: option,
          isCorrect: optionIndex === Math.max(0, Math.min(3, item.correctOption.charCodeAt(0) - 65)),
        })),
      },
    }));
    await (db as { quiz: { create: (args: Record<string, unknown>) => Promise<unknown> } }).quiz.create({
      data: {
        courseId: createdCourse.id,
        title: quizTitle,
        passingScore: Number.isFinite(passingScore) ? Math.min(100, Math.max(1, passingScore)) : 70,
        durationMinutes: 15,
        questions: {
          create: questionsToCreate,
        },
      },
    });
  }

  return {
    message: "Course created successfully",
    course: createdCourse,
  };
}

export async function listCoursesWithFallback() {
  const courses = await db.course.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      category: true,
      level: true,
      duration: true,
      description: true,
      instructor: true,
      enrolledCount: true,
      completedCount: true,
      status: true,
    },
  });
  const audits = getCourseAuditMap();
  return courses.map((course) => ({
    ...course,
    createdBy: audits.get(course.id)?.createdBy ?? "manager",
    lastEditedBy: audits.get(course.id)?.lastEditedBy ?? audits.get(course.id)?.createdBy ?? "manager",
  }));
}
