import { beforeEach, describe, expect, it, vi } from "vitest";

describe("course public route integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates a course through POST /api/course", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        course: {
          findFirst: async () => null,
          create: async () => ({ id: "c-11", title: "TypeScript Mastery", status: "draft", category: "Frontend", level: "Advanced", duration: "4 weeks", instructor: "John Doe" }),
        },
      },
    }));

    const courseRoute = await import("@/app/api/course/route");
    const formData = new FormData();
    formData.set("title", "TypeScript Mastery");
    formData.set("category", "Frontend");
    formData.set("level", "Advanced");
    formData.set("duration", "4 weeks");
    formData.set("description", "<p>Deep TypeScript coverage</p>");
    formData.set("instructor", "John Doe");
    formData.set("cover", new File(["image"], "cover.png", { type: "image/png" }));
    formData.append("videos", new File(["video"], "lesson-1.mp4", { type: "video/mp4" }));

    const response = await courseRoute.POST(
      new Request("http://localhost/api/course", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      message: "Course created successfully",
      course: { id: "c-11", title: "TypeScript Mastery" },
    });
  });
});
