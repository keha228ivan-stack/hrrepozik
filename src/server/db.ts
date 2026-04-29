import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import {
  addFallbackAssignment,
  addFallbackCourse,
  addFallbackEmployee,
  archiveFallbackEmployee,
  addFallbackManager,
  deleteFallbackCourse,
  findFallbackAssignmentById,
  findFallbackManagerByEmail,
  findFallbackManagerById,
  listFallbackAssignments,
  listFallbackAssignmentsByUser,
  listFallbackCourses,
  listFallbackEmployees,
  listFallbackManagers,
  updateFallbackAssignment,
  updateFallbackCourse,
  updateFallbackEmployee,
} from "@/server/fallback-store";

type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "MANAGER" | "EMPLOYEE";
};

type DbUserApi = {
  findUnique(args: { where: { id?: string; email?: string }; select?: Record<string, unknown> }): Promise<UserRecord | null>;
  findMany(args?: Record<string, unknown>): Promise<UserRecord[]>;
  create(args: { data: Record<string, unknown>; select?: Record<string, unknown> }): Promise<UserRecord>;
  update(args: { where: { id: string }; data: Record<string, unknown>; select?: Record<string, unknown> }): Promise<UserRecord>;
};

type DbShape = {
  user: DbUserApi;
};
type UnsafeDb = DbShape & Record<string, unknown>;

const require = createRequire(import.meta.url);
const FALLBACK_DEPARTMENTS = [
  { id: "dep-dev", name: "Разработка" },
  { id: "dep-hr", name: "HR" },
];

function applySelect<T extends Record<string, unknown>>(item: T, select?: Record<string, unknown>) {
  if (!select) {
    return item;
  }
  const picked: Record<string, unknown> = {};
  for (const [key, include] of Object.entries(select)) {
    if (include && key in item) {
      picked[key] = item[key];
    }
  }
  return picked;
}

function createFallbackDb(): DbShape {
  const userApi = {
    async findUnique({ where, select }: { where: { id?: string; email?: string }; select?: Record<string, unknown> }) {
      const managerById = where.id ? findFallbackManagerById(where.id) : null;
      const employeeById = where.id ? listFallbackEmployees().find((employee) => employee.id === where.id) ?? null : null;
      const managerByEmail = where.email ? findFallbackManagerByEmail(where.email) : null;
      const employeeByEmail = where.email ? listFallbackEmployees().find((employee) => employee.email === where.email) ?? null : null;
      const found = managerById ?? employeeById ?? managerByEmail ?? employeeByEmail;
      if (!found) {
        return null;
      }
      if ("employeeProfile" in found) {
        const employee = {
          id: found.id,
          fullName: found.fullName,
          email: found.email,
          passwordHash: "",
          role: "EMPLOYEE" as const,
          departmentId: found.departmentId,
          employeeProfile: found.employeeProfile,
        };
        return applySelect(employee as Record<string, unknown>, select) as unknown as UserRecord;
      }
      return applySelect(found as unknown as Record<string, unknown>, select) as unknown as UserRecord;
    },
    async findMany(args?: Record<string, unknown>) {
      const where = (args?.where ?? {}) as { role?: string };
      const roleFilter = where.role;
      const managers = listFallbackManagers().map((item) => ({ ...item }));
      const employees = listFallbackEmployees().map((item) => ({
        id: item.id,
        fullName: item.fullName,
        email: item.email,
        passwordHash: "",
        role: "EMPLOYEE" as const,
        departmentId: item.departmentId,
        employeeProfile: item.employeeProfile,
      }));
      const combined = [...managers, ...employees]
        .filter((user) => (roleFilter ? user.role === roleFilter : true))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      const select = args?.select as Record<string, unknown> | undefined;
      return combined.map((item) => applySelect(item as unknown as Record<string, unknown>, select) as unknown as UserRecord);
    },
    async create({ data, select }: { data: Record<string, unknown>; select?: Record<string, unknown> }) {
      const normalizedRole = String(data.role ?? "MANAGER");
      if (normalizedRole === "EMPLOYEE") {
        const employee = addFallbackEmployee({
          fullName: String(data.fullName ?? ""),
          email: String(data.email ?? "").toLowerCase(),
          departmentId: (data.departmentId as string | null | undefined) ?? null,
          position: String((data.employeeProfile as { create?: { position?: string } } | undefined)?.create?.position ?? "Employee"),
          status: ((data.employeeProfile as { create?: { status?: "active" | "onboarding" | "vacation" | "inactive" } } | undefined)?.create?.status ?? "onboarding"),
        });
        if (!employee) {
          const error = new Error("Unique constraint failed");
          (error as Error & { code?: string }).code = "P2002";
          throw error;
        }
        const created = {
          id: employee.id,
          fullName: employee.fullName,
          email: employee.email,
          role: "EMPLOYEE",
          departmentId: employee.departmentId,
          employeeProfile: employee.employeeProfile,
        };
        return applySelect(created, select) as unknown as UserRecord;
      }

      const created = addFallbackManager({
        fullName: String(data.fullName ?? ""),
        email: String(data.email ?? "").toLowerCase(),
        passwordHash: String(data.passwordHash ?? ""),
      });
      if (!created) {
        const error = new Error("Unique constraint failed");
        (error as Error & { code?: string }).code = "P2002";
        throw error;
      }
      return applySelect(created as unknown as Record<string, unknown>, select) as unknown as UserRecord;
    },
    async update({ where, data, select }: { where: { id: string }; data: Record<string, unknown>; select?: Record<string, unknown> }) {
      if (data.employeeProfile && typeof data.employeeProfile === "object" && "update" in data.employeeProfile) {
        const profileUpdate = (data.employeeProfile as { update?: Record<string, unknown> }).update ?? {};
        const updated = updateFallbackEmployee(where.id, {
          fullName: data.fullName as string | undefined,
          departmentId: (data.departmentId as string | null | undefined) ?? undefined,
          position: profileUpdate.position as string | undefined,
          status: profileUpdate.status as "active" | "onboarding" | "vacation" | "inactive" | undefined,
        });
        if (!updated) throw new Error("Employee not found");
        return applySelect(updated as unknown as Record<string, unknown>, select) as unknown as UserRecord;
      }
      const archived = archiveFallbackEmployee(where.id);
      if (!archived) throw new Error("Employee not found");
      return applySelect(archived as unknown as Record<string, unknown>, select) as unknown as UserRecord;
    },
  };

  const fallbackDb = {
    user: userApi,
    department: {
      async findMany(args?: Record<string, unknown>) {
        const select = args?.select as Record<string, unknown> | undefined;
        return FALLBACK_DEPARTMENTS.map((item) => applySelect(item, select));
      },
      async findUnique({ where, select }: { where: { id: string }; select?: Record<string, unknown> }) {
        const found = FALLBACK_DEPARTMENTS.find((department) => department.id === where.id) ?? null;
        if (!found) {
          return null;
        }
        return applySelect(found, select);
      },
    },
    course: {
      async findMany(args?: Record<string, unknown>) {
        const select = args?.select as Record<string, unknown> | undefined;
        return listFallbackCourses()
          .slice()
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((course) => applySelect(course as unknown as Record<string, unknown>, select));
      },
      async findFirst({ where, select }: { where?: { title?: string }; select?: Record<string, unknown> }) {
        const normalizedTitle = where?.title?.toLowerCase();
        const found = listFallbackCourses().find((course) => course.title.toLowerCase() === normalizedTitle);
        return found ? applySelect(found as unknown as Record<string, unknown>, select) : null;
      },
      async findUnique({ where, include }: { where: { id: string }; include?: Record<string, unknown> }) {
        const found = listFallbackCourses().find((course) => course.id === where.id);
        if (!found) {
          return null;
        }
        if (include?.attachments) {
          return { ...found, attachments: [] };
        }
        return found;
      },
      async create({ data, select }: { data: Record<string, unknown>; select?: Record<string, unknown> }) {
        const created = addFallbackCourse({
          title: String(data.title ?? ""),
          category: String(data.category ?? ""),
          level: String(data.level ?? ""),
          duration: String(data.duration ?? ""),
          description: String(data.description ?? ""),
          instructor: String(data.instructor ?? ""),
          actor: "manager",
        });
        if (!created) {
          const error = new Error("Unique constraint failed");
          (error as Error & { code?: string }).code = "P2002";
          throw error;
        }
        return applySelect(created as unknown as Record<string, unknown>, select);
      },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
        const updated = updateFallbackCourse(where.id, {
          title: data.title as string | undefined,
          category: data.category as string | undefined,
          level: data.level as string | undefined,
          duration: data.duration as string | undefined,
          description: data.description as string | undefined,
          instructor: data.instructor as string | undefined,
          status: data.status as "draft" | "published" | "archived" | undefined,
        });
        if (!updated || updated === "duplicate") {
          throw new Error("Course not found or duplicate title");
        }
        return updated;
      },
      async delete({ where }: { where: { id: string } }) {
        const deleted = deleteFallbackCourse(where.id);
        if (!deleted) {
          throw new Error("Course not found");
        }
        return { id: where.id };
      },
    },
    enrollment: {
      async findMany(args?: Record<string, unknown>) {
        const where = (args?.where ?? {}) as { userId?: string };
        const include = args?.include as { course?: { select?: Record<string, unknown> } } | undefined;
        const list = where.userId ? listFallbackAssignmentsByUser(where.userId) : listFallbackAssignments();
        return list.map((item) => {
          if (!include?.course) {
            return item;
          }
          const course = listFallbackCourses().find((entry) => entry.id === item.courseId);
          return {
            ...item,
            course: course ? applySelect(course as unknown as Record<string, unknown>, include.course.select) : null,
          };
        });
      },
      async findUnique({ where }: { where: { id: string } }) {
        return findFallbackAssignmentById(where.id);
      },
      async create({ data }: { data: { userId: string; courseId: string; deadline: Date; status: "CREATED" | "ACTIVE" | "COMPLETED" | "CANCELLED" } }) {
        const created = addFallbackAssignment({
          userId: data.userId,
          courseId: data.courseId,
          deadline: data.deadline.toISOString(),
        });
        if (!created) {
          const error = new Error("Unique constraint failed");
          (error as Error & { code?: string }).code = "P2002";
          throw error;
        }
        return { ...created, status: data.status };
      },
      async update({ where, data }: { where: { id: string }; data: { status?: "CREATED" | "ACTIVE" | "COMPLETED" | "CANCELLED"; progress?: number } }) {
        const updated = updateFallbackAssignment(where.id, data);
        if (!updated) {
          throw new Error("Enrollment not found");
        }
        return updated;
      },
    },
    notification: {
      async create() {
        return { id: randomUUID() };
      },
    },
    async $transaction<T>(callback: (tx: {
      enrollment: { create(args: { data: { userId: string; courseId: string; deadline: Date; status: "CREATED" | "ACTIVE" | "COMPLETED" | "CANCELLED" } }): Promise<unknown> };
      notification: { create(args: { data: Record<string, unknown> }): Promise<unknown> };
    }) => Promise<T>) {
      return callback({
        enrollment: {
          create: async ({ data }) => fallbackDb.enrollment.create({ data }),
        },
        notification: {
          create: async ({ data }) => fallbackDb.notification.create({ data }),
        },
      });
    },
  };
  return fallbackDb as DbShape;
}

function createDb(): DbShape {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.warn("DATABASE_URL is not set, using fallback auth store.");
    return createFallbackDb();
  }
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    console.warn("DATABASE_URL has invalid protocol, using fallback auth store.");
    return createFallbackDb();
  }

  try {
    const { PrismaClient } = require("@prisma/client") as { PrismaClient: new (args: unknown) => { user: DbUserApi } };
    const globalForPrisma = globalThis as unknown as { prisma?: { user: DbUserApi } };
    const prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prisma;
    }

    return prisma as unknown as DbShape;
  } catch (error) {
    console.warn("Prisma client is unavailable, using fallback auth store.", error);
    return createFallbackDb();
  }
}

export const db = createDb() as UnsafeDb;
