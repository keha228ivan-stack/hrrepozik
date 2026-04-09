import { EnrollmentStatus, Prisma, UserRole } from "@prisma/client";
import { requireAuth } from "@/server/auth/guard";
import { db } from "@/server/db";
import { listFallbackAssignments, listFallbackCourses, listFallbackEmployees } from "@/server/fallback-store";
import { HttpError, toErrorResponse } from "@/server/http-error";

function isDatabaseUnavailable(error: unknown) {
  return error instanceof Prisma.PrismaClientInitializationError
    || (error instanceof Prisma.PrismaClientKnownRequestError
      && (error.code === "P1000" || error.code === "P1001" || error.code === "P1008"));
}

export async function GET() {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    try {
      const [employees, enrollments] = await Promise.all([
        db.user.findMany({
          where: { role: UserRole.EMPLOYEE },
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeProfile: { select: { status: true } },
          },
        }),
        db.enrollment.findMany({
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
      ]);

      const totalEmployees = employees.length;
      const activeEmployees = employees.filter((employee) => employee.employeeProfile?.status === "active").length;
      const avgProgress = enrollments.length ? Math.round(enrollments.reduce((acc, item) => acc + item.progress, 0) / enrollments.length) : 0;
      const completedCourses = enrollments.filter((item) => item.status === EnrollmentStatus.COMPLETED).length;
      const overdueCourses = enrollments.filter((item) => item.deadline < new Date() && item.status !== EnrollmentStatus.COMPLETED && item.status !== EnrollmentStatus.CANCELLED).length;

      const topEmployees = employees.map((employee) => {
        const ownEnrollments = enrollments.filter((enrollment) => enrollment.userId === employee.id);
        const progress = ownEnrollments.length ? Math.round(ownEnrollments.reduce((acc, item) => acc + item.progress, 0) / ownEnrollments.length) : 0;
        const completed = ownEnrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.COMPLETED).length;
        return { userId: employee.id, fullName: employee.fullName, progress, completed };
      }).sort((a, b) => b.progress - a.progress).slice(0, 5);

      return Response.json({
        summary: {
          totalEmployees,
          activeEmployees,
          avgProgress,
          completedCourses,
          overdueCourses,
        },
        topEmployees,
      });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }
      const employees = listFallbackEmployees();
      const assignments = listFallbackAssignments();
      const courses = listFallbackCourses();
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter((employee) => employee.employeeProfile.status === "active").length;
      const avgProgress = assignments.length ? Math.round(assignments.reduce((acc, item) => acc + item.progress, 0) / assignments.length) : 0;
      const completedCourses = assignments.filter((item) => item.status === "COMPLETED").length;
      const overdueCourses = assignments.filter((item) => new Date(item.deadline) < new Date() && item.status !== "COMPLETED" && item.status !== "CANCELLED").length;
      const topEmployees = employees.map((employee) => {
        const ownAssignments = assignments.filter((assignment) => assignment.userId === employee.id);
        const progress = ownAssignments.length ? Math.round(ownAssignments.reduce((acc, item) => acc + item.progress, 0) / ownAssignments.length) : 0;
        const completed = ownAssignments.filter((assignment) => assignment.status === "COMPLETED").length;
        return { userId: employee.id, fullName: employee.fullName, progress, completed };
      }).sort((a, b) => b.progress - a.progress).slice(0, 5).map((item) => ({
        ...item,
        assignedCourses: assignments.filter((assignment) => assignment.userId === item.userId).map((assignment) => courses.find((course) => course.id === assignment.courseId)?.title ?? "Курс"),
      }));

      return Response.json({
        summary: {
          totalEmployees,
          activeEmployees,
          avgProgress,
          completedCourses,
          overdueCourses,
        },
        topEmployees,
        warning: "Database unavailable, fallback mode enabled",
      });
    }
  } catch (error) {
    return toErrorResponse(error);
  }
}
