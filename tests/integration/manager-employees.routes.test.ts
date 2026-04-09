import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("manager employees routes integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates employee via POST /api/manager/employees", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/auth/password", () => ({
      hashPassword: async () => "hashed-password",
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        department: {
          findUnique: async () => null,
        },
        user: {
          findUnique: async () => null,
          create: async () => ({
            id: "u-22",
            fullName: "New Employee",
            email: "employee@test.dev",
            departmentId: null,
            employeeProfile: {
              position: "Developer",
              status: "onboarding",
            },
          }),
        },
      },
    }));

    const route = await import("@/app/api/manager/employees/route");
    const response = await route.POST(new Request("http://localhost/api/manager/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "New Employee",
        email: "employee@test.dev",
        position: "Developer",
      }),
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      message: "Employee added successfully",
      employee: { id: "u-22", fullName: "New Employee" },
    });
  });

  it("falls back to in-memory mode when database is unavailable", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        department: {
          findUnique: async () => {
            throw new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" });
          },
          findMany: async () => {
            throw new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" });
          },
        },
        user: {
          findUnique: async () => {
            throw new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" });
          },
          findMany: async () => {
            throw new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" });
          },
          create: async () => {
            throw new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" });
          },
        },
      },
    }));

    const route = await import("@/app/api/manager/employees/route");
    const response = await route.POST(new Request("http://localhost/api/manager/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Offline Employee",
        email: "offline-employee@test.dev",
        position: "Developer",
      }),
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      message: "Employee added successfully (temporary in-memory mode)",
      employee: { fullName: "Offline Employee" },
    });
  });
});
