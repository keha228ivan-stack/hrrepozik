import { EnrollmentStatus, UserRole } from "@prisma/client";
import { requireAuth } from "@/server/auth/guard";
import { db } from "@/server/db";
import { HttpError, toErrorResponse } from "@/server/http-error";

export async function GET() {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

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
    return toErrorResponse(error);
  }
}
