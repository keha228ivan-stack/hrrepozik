import { beforeEach, describe, expect, it, vi } from "vitest";

describe("assign-course routes integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("assigns a course to an employee", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/services/enrollment.service", () => ({
      createEnrollmentWithNotification: async ({ userId, courseId }: { userId: string; courseId: string }) => ({
        id: "en-1",
        userId,
        courseId,
        progress: 0,
        status: "CREATED",
        createdAt: new Date("2026-04-09").toISOString(),
      }),
    }));

    const route = await import("@/app/api/assign-course/route");
    const response = await route.POST(new Request("http://localhost/api/assign-course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "u-2",
        courseId: "c-1",
      }),
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      message: "Course assigned successfully",
      enrollment: { userId: "u-2", courseId: "c-1" },
    });
  });

  it("returns employees and courses on GET without userId", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        user: {
          findMany: async () => [{ id: "u-2", fullName: "Ivan Ivanov", email: "ivan@test.dev" }],
        },
        course: {
          findMany: async () => [{ id: "c-1", title: "React", category: "Frontend", status: "published" }],
        },
      },
    }));

    const route = await import("@/app/api/assign-course/route");
    const response = await route.GET(new Request("http://localhost/api/assign-course"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      employees: [{ id: "u-2" }],
      courses: [{ id: "c-1" }],
    });
  });
});
