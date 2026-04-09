import { beforeEach, describe, expect, it, vi } from "vitest";

describe("courses routes integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates course via POST /api/courses", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/services/course-create.service", () => ({
      createCourseFromFormData: async () => ({
        message: "Course created successfully",
        course: { id: "c-77", title: "Node.js Core", status: "draft" },
      }),
    }));

    const route = await import("@/app/api/courses/route");
    const formData = new FormData();
    formData.set("title", "Node.js Core");
    formData.set("category", "Backend");
    formData.set("level", "Middle");
    formData.set("duration", "4 weeks");
    formData.set("description", "Course description text");
    formData.set("instructor", "John");
    formData.set("cover", new File(["image"], "cover.png", { type: "image/png" }));
    formData.append("videos", new File(["video"], "intro.mp4", { type: "video/mp4" }));

    const response = await route.POST(new Request("http://localhost/api/courses", { method: "POST", body: formData }));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      message: "Course created successfully",
      course: { id: "c-77", title: "Node.js Core" },
    });
  });
});
