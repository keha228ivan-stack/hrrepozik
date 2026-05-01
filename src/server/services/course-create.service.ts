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
  const quizQuestionsRaw = readString(formData, "quizQuestionsRaw");
  const quizQuestionsJson = readString(formData, "quizQuestionsJson");
  const passingScoreRaw = readString(formData, "passingScore");

  if (!title || !category || !level || !duration || !description || !instructor) {
    throw new HttpError(400, "All course fields are required");
  }

  const videos = formData.getAll("videos").map(asFile).filter(Boolean);
  if (!videos.length) {
    throw new HttpError(400, "At least one video file is required");
  }
  if (videos.some((video) => !video.type.startsWith("video/"))) {
    throw new HttpError(400, "Videos must be valid video files");
  }

  const materials = formData.getAll("materials").map(asFile).filter(Boolean);
  const hasInvalidMaterial = materials.some(
    (material) => material.type && !material.type.startsWith("video/") && !material.type.startsWith("image/") && !material.type.includes("pdf") && !material.type.includes("word") && !material.type.includes("document"),
  );
  if (hasInvalidMaterial) {
    throw new HttpError(400, "One or more materials have unsupported format");
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
      level,
      duration,
      description,
      instructor,
      status: CourseStatus.draft,
      attachments: {
        create: [
          ...videos.map((video) => ({
            name: video.name,
            type: video.type || "video/*",
            url: `uploads/videos/${Date.now()}-${video.name}`,
          })),
          ...materials.map((material) => ({
            name: material.name,
            type: material.type || "application/octet-stream",
            url: `uploads/materials/${Date.now()}-${material.name}`,
          })),
        ],
      },
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

  const quizQuestions = quizQuestionsRaw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
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
  if (quizTitle && (quizQuestions.length || structuredQuestions.length) && canCreateQuiz) {
    const questionsToCreate = structuredQuestions.length
      ? structuredQuestions.map((item) => ({
          question: item.question,
          answerType: "single",
          points: 1,
          options: {
            create: item.options.map((option, optionIndex) => ({
              text: option,
              isCorrect: optionIndex === Math.max(0, Math.min(3, item.correctOption.charCodeAt(0) - 65)),
            })),
          },
        }))
      : quizQuestions.map((question) => ({
          question,
          answerType: "single",
          points: 1,
          options: {
            create: [
              { text: "Верно", isCorrect: true },
              { text: "Неверно", isCorrect: false },
            ],
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
