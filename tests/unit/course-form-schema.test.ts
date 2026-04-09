import { describe, expect, it } from "vitest";
import { courseSchema } from "@/lib/course-form-schema";

describe("course form schema", () => {
  it("validates required fields", () => {
    const result = courseSchema.safeParse({
      title: "",
      category: "",
      level: "",
      duration: "",
      description: "",
      instructor: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid course payload", () => {
    const result = courseSchema.safeParse({
      title: "React Basics",
      category: "Frontend",
      level: "Beginner",
      duration: "6 weeks",
      description: "A complete introduction to React fundamentals.",
      instructor: "Jane Smith",
    });

    expect(result.success).toBe(true);
  });
});
