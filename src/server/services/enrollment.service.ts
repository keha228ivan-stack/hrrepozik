import { EnrollmentStatus, Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { HttpError } from "@/server/http-error";
import { canTransition } from "@/server/enrollment-status";

type CreateEnrollmentInput = {
  userId: string;
  courseId: string;
  deadline: string;
};

export async function createEnrollmentWithNotification(input: CreateEnrollmentInput) {
  const user = await db.user.findUnique({ where: { id: input.userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const course = await db.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw new HttpError(404, "Course not found");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          userId: input.userId,
          courseId: input.courseId,
          deadline: new Date(input.deadline),
          status: EnrollmentStatus.CREATED,
        },
      });

      await tx.notification.create({
        data: {
          userId: input.userId,
          title: "Вам назначен курс",
          description: `Назначен курс: ${course.title}`,
          isRead: false,
        },
      });

      return enrollment;
    });

    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "Enrollment already exists");
    }
    throw error;
  }
}

export async function updateEnrollmentStatus(enrollmentId: string, nextStatus: EnrollmentStatus) {
  const enrollment = await db.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) {
    throw new HttpError(404, "Enrollment not found");
  }

  if (!canTransition(enrollment.status, nextStatus)) {
    throw new HttpError(
      409,
      `Invalid transition: ${enrollment.status} -> ${nextStatus}. Allowed: CREATED->ACTIVE, ACTIVE->COMPLETED, ACTIVE->CANCELLED`,
    );
  }

  return db.enrollment.update({
    where: { id: enrollmentId },
    data: { status: nextStatus },
  });
}
