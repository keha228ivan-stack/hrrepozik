import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("courses routes integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates course via POST /api/courses", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        course: {
          findFirst: async () => null,
          create: async () => ({
            id: "c-77",
            title: "Node.js Core",
            category: "Backend",
            level: "Middle",
            duration: "4 weeks",
            instructor: "John",
            status: "draft",
          }),
        },
      },
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

  it("falls back to in-memory mode when database is unavailable", async () => {
    vi.doMock("@/server/auth/guard", () => ({
      requireAuth: async () => ({ user_id: "m-1", role: "manager" }),
    }));

    vi.doMock("@/server/db", () => ({
      db: {
        course: {
          findFirst: async () => {
            throw new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" });
          },
          create: async () => {
            throw new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" });
          },
        },
      },
    }));

    const route = await import("@/app/api/courses/route");
    const formData = new FormData();
    formData.set("title", "Database Offline Course");
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
      message: "Course created successfully (temporary in-memory mode)",
      course: { title: "Database Offline Course" },
    });
  });
});
