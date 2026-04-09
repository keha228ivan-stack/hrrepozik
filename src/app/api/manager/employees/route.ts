import { randomUUID } from "node:crypto";
import { EmployeeStatus, UserRole, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "@/server/auth/guard";
import { hashPassword } from "@/server/auth/password";
import { db } from "@/server/db";
import { addFallbackEmployee, listFallbackEmployees } from "@/server/fallback-store";
import { HttpError, toErrorResponse } from "@/server/http-error";

const createEmployeeSchema = z.object({
  fullName: z.string().trim().min(2, "Введите ФИО сотрудника"),
  email: z.string().trim().email("Введите корректный email"),
  position: z.string().trim().min(2, "Введите должность"),
  departmentId: z.string().trim().optional(),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.onboarding),
});

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

    const [employees, departments] = await Promise.all([
      db.user.findMany({
      where: { role: UserRole.EMPLOYEE },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        departmentId: true,
        employeeProfile: {
          select: {
            position: true,
            status: true,
            performance: true,
            completedCourses: true,
            inProgressCourses: true,
          },
        },
      },
      }),
      db.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    return Response.json({ employees, departments });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return Response.json({
        employees: listFallbackEmployees(),
        departments: [],
        warning: "Database unavailable, fallback mode enabled",
      });
    }
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const parsed = createEmployeeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    try {
      const existing = await db.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
      if (existing) {
        throw new HttpError(409, "Employee with this email already exists");
      }

      const generatedPassword = randomUUID();
      const passwordHash = await hashPassword(generatedPassword);

      if (parsed.data.departmentId) {
        const department = await db.department.findUnique({
          where: { id: parsed.data.departmentId },
          select: { id: true },
        });
        if (!department) {
          throw new HttpError(400, "Selected department does not exist");
        }
      }

      const employee = await db.user.create({
        data: {
          fullName: parsed.data.fullName,
          email: normalizedEmail,
          passwordHash,
          role: UserRole.EMPLOYEE,
          departmentId: parsed.data.departmentId || null,
          employeeProfile: {
            create: {
              position: parsed.data.position,
              status: parsed.data.status,
              performance: 0,
              completedCourses: 0,
              inProgressCourses: 0,
            },
          },
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          departmentId: true,
          employeeProfile: {
            select: {
              position: true,
              status: true,
            },
          },
        },
      });

      return Response.json({
        message: "Employee added successfully",
        employee,
      }, { status: 201 });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) {
        throw error;
      }

      const employee = addFallbackEmployee({
        fullName: parsed.data.fullName,
        email: normalizedEmail,
        departmentId: parsed.data.departmentId || null,
        position: parsed.data.position,
        status: parsed.data.status,
      });
      if (!employee) {
        throw new HttpError(409, "Employee with this email already exists");
      }

      return Response.json({
        message: "Employee added successfully (temporary in-memory mode)",
        employee,
      }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return Response.json({ error: "Invalid department selected" }, { status: 400 });
    }
    return toErrorResponse(error);
  }
}
