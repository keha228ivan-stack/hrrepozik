import { beforeEach, describe, expect, it, vi } from "vitest";

describe("manager course routes integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates a course from multipart form data", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        course: {
          findFirst: async () => null,
          create: async () => ({ id: "c-1", title: "React Advanced", status: "draft" }),
        },
      },
    }));

    const courseRoute = await import("@/app/api/manager/courses/route");

    const formData = new FormData();
    formData.set("title", "React Advanced");
    formData.set("category", "Frontend");
    formData.set("level", "Advanced");
    formData.set("duration", "6 weeks");
    formData.set("description", "<p>Comprehensive React course</p>");
    formData.set("instructor", "Jane Doe");
    formData.set("cover", new File(["image"], "cover.png", { type: "image/png" }));
    formData.append("videos", new File(["video"], "intro.mp4", { type: "video/mp4" }));

    const response = await courseRoute.POST(
      new Request("http://localhost/api/manager/courses", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      message: "Course created successfully",
      course: { id: "c-1", title: "React Advanced" },
    });
  });

  it("creates a course without top-level files", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        course: {
          findFirst: async () => null,
          create: async () => ({ id: "c-1", title: "React Advanced", status: "draft" }),
        },
      },
    }));

    const courseRoute = await import("@/app/api/manager/courses/route");

    const formData = new FormData();
    formData.set("title", "React Advanced");
    formData.set("category", "Frontend");
    formData.set("level", "Advanced");
    formData.set("duration", "6 weeks");
    formData.set("description", "<p>Comprehensive React course</p>");
    formData.set("instructor", "Jane Doe");

    const response = await courseRoute.POST(
      new Request("http://localhost/api/manager/courses", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      message: "Course created successfully",
    });
  });
});
