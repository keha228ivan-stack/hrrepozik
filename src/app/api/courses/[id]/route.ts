import { z } from "zod";
import { requireAuth } from "@/server/auth/guard";
import { isBackendProxyEnabled, proxyBackendRequest } from "@/server/backend-proxy";
import { db } from "@/server/db";
import { getCourseAuditMap, setCourseAudit } from "@/server/fallback-store";
import { HttpError, toErrorResponse } from "@/server/http-error";

const updateCourseSchema = z.object({
  title: z.string().trim().min(2).optional(),
  category: z.string().trim().min(2).optional(),
  level: z.string().trim().min(2).optional(),
  duration: z.string().trim().min(1).optional(),
  description: z.string().trim().min(5).optional(),
  instructor: z.string().trim().min(2).optional(),
  lessons: z.array(z.object({
    id: z.string().optional(),
    title: z.string().trim().min(1),
    duration: z.string().trim().min(1),
    description: z.string().trim().optional().default(""),
  })).optional(),
  quizQuestions: z.array(z.object({
    id: z.string().optional(),
    question: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).optional().default([]),
    correctOption: z.string().trim().optional().default("A"),
  })).optional(),
});

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    if (isBackendProxyEnabled()) {
      const { id } = await props.params;
      return await proxyBackendRequest(new Request(_request.url, {
        method: "GET",
        headers: _request.headers,
      }), `/courses/${id}`);
    }

    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const { id } = await props.params;
    const course = await db.course.findUnique({
      where: { id },
      include: {
        attachments: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
          },
        },
        modules: {
          select: { id: true, title: true, duration: true, description: true },
          orderBy: { title: "asc" },
        },
        quizzes: {
          select: {
            title: true,
            passingScore: true,
            questions: {
              select: {
                id: true,
                question: true,
                options: { select: { text: true, isCorrect: true } },
              },
            },
          },
          take: 1,
        },
      },
    });
    if (!course) {
      throw new HttpError(404, "Course not found");
    }
    const audit = getCourseAuditMap().get(id);
    const primaryQuiz = course.quizzes[0];
    return Response.json({ course: { ...course, lessons: course.modules, quizTitle: primaryQuiz?.title ?? "", passingScore: primaryQuiz?.passingScore ?? 70, quizQuestions: (primaryQuiz?.questions ?? []).map((q) => ({ id: q.id, question: q.question, options: q.options.map((o) => o.text), correctOption: String.fromCharCode(65 + Math.max(0, q.options.findIndex((o) => o.isCorrect))) })), createdBy: audit?.createdBy ?? "manager", lastEditedBy: audit?.lastEditedBy ?? audit?.createdBy ?? "manager" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    if (isBackendProxyEnabled()) {
      const { id } = await props.params;
      return await proxyBackendRequest(request, `/courses/${id}`);
    }

    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const parsed = updateCourseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Validation failed", details: parsed.error.issues }, { status: 400 });
    }
    const { id } = await props.params;

    const { lessons, quizQuestions, ...courseData } = parsed.data;
    const updated = await db.course.update({
      where: { id },
      data: courseData,
    });
    if (lessons) {
      await db.courseModule.deleteMany({ where: { courseId: id } });
      if (lessons.length) {
        await db.courseModule.createMany({ data: lessons.map((lesson) => ({ courseId: id, title: lesson.title, duration: lesson.duration, description: lesson.description || "—" })) });
      }
    }
    if (quizQuestions) {
      const existingQuiz = await db.quiz.findFirst({ where: { courseId: id }, select: { id: true, title: true, passingScore: true } });
      if (existingQuiz) {
        await db.quizQuestion.deleteMany({ where: { quizId: existingQuiz.id } });
        for (const question of quizQuestions) {
          await db.quizQuestion.create({
            data: {
              quizId: existingQuiz.id,
              question: question.question,
              answerType: "single",
              points: 1,
              options: { create: (question.options ?? []).map((text, index) => ({ text, isCorrect: index === Math.max(0, Math.min(3, question.correctOption.charCodeAt(0) - 65)) })) },
            },
          });
        }
      }
    }
    setCourseAudit({
      courseId: id,
      lastEditedBy: payload.user_id,
    });
    return Response.json({ message: "Course updated successfully", course: { ...updated, lastEditedBy: payload.user_id } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    if (isBackendProxyEnabled()) {
      try {
        const { id } = await props.params;
        return await proxyBackendRequest(new Request(_request.url, {
          method: "DELETE",
          headers: _request.headers,
        }), `/courses/${id}`);
      } catch (proxyError) {
        console.warn("DELETE /api/courses/[id] proxy failed, falling back to local delete", proxyError);
      }
    }

    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }
    const { id } = await props.params;

    await db.course.delete({
      where: { id },
    });
    return Response.json({ message: "Course deleted successfully" });
  } catch (error) {
    return toErrorResponse(error);
  }
}
