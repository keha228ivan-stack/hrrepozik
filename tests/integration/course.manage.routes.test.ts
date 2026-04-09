import { beforeEach, describe, expect, it, vi } from "vitest";

describe("course manage routes integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("updates and deletes course via /api/courses/[id]", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        course: {
          update: async ({ where, data }: { where: { id: string }; data: { title?: string } }) => ({
            id: where.id,
            title: data.title ?? "Course",
          }),
          delete: async () => ({}),
          findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id, title: "Course", description: "Desc", category: "Backend", level: "Middle", duration: "4w", instructor: "John" }),
        },
      },
    }));

    const route = await import("@/app/api/courses/[id]/route");
    const patchResponse = await route.PATCH(
      new Request("http://localhost/api/courses/c-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Course" }),
      }),
      { params: Promise.resolve({ id: "c-1" }) },
    );
    expect(patchResponse.status).toBe(200);

    const deleteResponse = await route.DELETE(
      new Request("http://localhost/api/courses/c-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "c-1" }) },
    );
    expect(deleteResponse.status).toBe(200);
  });
});
