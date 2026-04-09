import { z } from "zod";
import { Prisma, UserRole } from "@prisma/client";
import { requireAuth } from "@/server/auth/guard";
import { db } from "@/server/db";
import { addFallbackAssignment, listFallbackAssignmentsByUser, listFallbackCourses, listFallbackEmployees } from "@/server/fallback-store";
import { HttpError, toErrorResponse } from "@/server/http-error";
import { createEnrollmentWithNotification } from "@/server/services/enrollment.service";

const assignCourseSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  courseId: z.string().min(1, "Course is required"),
  deadline: z.string().optional(),
});

function defaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

function isDatabaseUnavailable(error: unknown) {
  return error instanceof Prisma.PrismaClientInitializationError
    || (error instanceof Prisma.PrismaClientKnownRequestError
      && (error.code === "P1000" || error.code === "P1001" || error.code === "P1008"));
}

export async function GET(request: Request) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    try {
      if (userId) {
        const enrollments = await db.enrollment.findMany({
          where: { userId },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                category: true,
                duration: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return Response.json({ enrollments });
      }

      const [employees, courses] = await Promise.all([
        db.user.findMany({
          where: { role: UserRole.EMPLOYEE },
          select: { id: true, fullName: true, email: true },
          orderBy: { fullName: "asc" },
        }),
        db.course.findMany({
          select: { id: true, title: true, category: true, status: true },
          orderBy: { title: "asc" },
        }),
      ]);

      return Response.json({ employees, courses });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }

      if (userId) {
        const assignments = listFallbackAssignmentsByUser(userId);
        const courses = listFallbackCourses();
        const enrollments = assignments.map((assignment) => ({
          ...assignment,
          course: courses.find((course) => course.id === assignment.courseId) ?? {
            id: assignment.courseId,
            title: "Курс",
            category: "Без категории",
            duration: "—",
          },
        }));
        return Response.json({ enrollments, warning: "Database unavailable, fallback mode enabled" });
      }

      return Response.json({
        employees: listFallbackEmployees().map((employee) => ({ id: employee.id, fullName: employee.fullName, email: employee.email })),
        courses: listFallbackCourses().map((course) => ({ id: course.id, title: course.title, category: course.category, status: course.status })),
        warning: "Database unavailable, fallback mode enabled",
      });
    }
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const parsed = assignCourseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const deadline = parsed.data.deadline ?? defaultDeadline();
    let enrollment: Awaited<ReturnType<typeof createEnrollmentWithNotification>> | ReturnType<typeof addFallbackAssignment>;
    try {
      enrollment = await createEnrollmentWithNotification({
        userId: parsed.data.userId,
        courseId: parsed.data.courseId,
        deadline,
      });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }

      enrollment = addFallbackAssignment({
        userId: parsed.data.userId,
        courseId: parsed.data.courseId,
        deadline,
      });
      if (!enrollment) {
        throw new HttpError(409, "Enrollment already exists");
      }
    }

    return Response.json({
      message: "Course assigned successfully",
      enrollment,
    }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
