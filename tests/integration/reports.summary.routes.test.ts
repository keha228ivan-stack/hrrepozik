import { beforeEach, describe, expect, it, vi } from "vitest";

describe("reports summary routes integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns reports summary and top employees", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        user: {
          findMany: async () => [
            { id: "u-2", fullName: "Ivan", email: "ivan@test.dev", employeeProfile: { status: "active" } },
          ],
        },
        enrollment: {
          findMany: async () => [
            { userId: "u-2", progress: 80, status: "COMPLETED", deadline: new Date("2030-01-01"), course: { id: "c-1", title: "React" } },
          ],
        },
      },
    }));

    const route = await import("@/app/api/reports/summary/route");
    const response = await route.GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      summary: {
        totalEmployees: 1,
      },
      topEmployees: [
        { fullName: "Ivan" },
      ],
    });
  });
});
