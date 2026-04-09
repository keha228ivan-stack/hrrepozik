import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "@/server/auth/guard";
import { db } from "@/server/db";
import { deleteFallbackCourse, listFallbackCourses, updateFallbackCourse } from "@/server/fallback-store";
import { HttpError, toErrorResponse } from "@/server/http-error";

const updateCourseSchema = z.object({
  title: z.string().trim().min(2).optional(),
  category: z.string().trim().min(2).optional(),
  level: z.string().trim().min(2).optional(),
  duration: z.string().trim().min(1).optional(),
  description: z.string().trim().min(5).optional(),
  instructor: z.string().trim().min(2).optional(),
});

function isDatabaseUnavailable(error: unknown) {
  return error instanceof Prisma.PrismaClientInitializationError
    || (error instanceof Prisma.PrismaClientKnownRequestError
      && (error.code === "P1000" || error.code === "P1001" || error.code === "P1008"));
}

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const { id } = await props.params;
    try {
      const course = await db.course.findUnique({
        where: { id },
      });
      if (!course) {
        throw new HttpError(404, "Course not found");
      }
      return Response.json({ course });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }
      const course = listFallbackCourses().find((item) => item.id === id);
      if (!course) {
        throw new HttpError(404, "Course not found");
      }
      return Response.json({ course, warning: "Database unavailable, fallback mode enabled" });
    }
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const parsed = updateCourseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Validation failed", details: parsed.error.issues }, { status: 400 });
    }
    const { id } = await props.params;

    try {
      const updated = await db.course.update({
        where: { id },
        data: parsed.data,
      });
      return Response.json({ message: "Course updated successfully", course: updated });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }
      const updatedFallback = updateFallbackCourse(id, parsed.data);
      if (updatedFallback === "duplicate") {
        throw new HttpError(409, "Course with this title already exists");
      }
      if (!updatedFallback) {
        throw new HttpError(404, "Course not found");
      }
      return Response.json({ message: "Course updated successfully (temporary in-memory mode)", course: updatedFallback });
    }
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }
    const { id } = await props.params;

    try {
      await db.course.delete({
        where: { id },
      });
      return Response.json({ message: "Course deleted successfully" });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }
      const deleted = deleteFallbackCourse(id);
      if (!deleted) {
        throw new HttpError(404, "Course not found");
      }
      return Response.json({ message: "Course deleted successfully (temporary in-memory mode)" });
    }
  } catch (error) {
    return toErrorResponse(error);
  }
}
