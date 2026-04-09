import { CourseStatus } from "@prisma/client";
import { db } from "@/server/db";
import { HttpError } from "@/server/http-error";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function asFile(value: FormDataEntryValue) {
  return value instanceof File ? value : null;
}

export async function createCourseFromFormData(formData: FormData) {
  const title = readString(formData, "title");
  const category = readString(formData, "category");
  const level = readString(formData, "level");
  const duration = readString(formData, "duration");
  const description = readString(formData, "description");
  const instructor = readString(formData, "instructor");

  if (!title || !category || !level || !duration || !description || !instructor) {
    throw new HttpError(400, "All course fields are required");
  }

  const cover = asFile(formData.get("cover") ?? "");
  if (!cover) {
    throw new HttpError(400, "Course cover image is required");
  }
  if (!cover.type.startsWith("image/")) {
    throw new HttpError(400, "Course cover must be an image file");
  }

  const videos = formData.getAll("videos").map(asFile).filter(Boolean);
  if (!videos.length) {
    throw new HttpError(400, "At least one video file is required");
  }
  if (videos.some((video) => !video.type.startsWith("video/"))) {
    throw new HttpError(400, "Videos must be valid video files");
  }

  const materials = formData.getAll("materials").map(asFile).filter(Boolean);
  const hasInvalidMaterial = materials.some(
    (material) => material.type && !material.type.startsWith("video/") && !material.type.startsWith("image/") && !material.type.includes("pdf") && !material.type.includes("word") && !material.type.includes("document"),
  );
  if (hasInvalidMaterial) {
    throw new HttpError(400, "One or more materials have unsupported format");
  }

  const existing = await db.course.findFirst({ where: { title: { equals: title, mode: "insensitive" } }, select: { id: true } });
  if (existing) {
    throw new HttpError(409, "Course with this title already exists");
  }

  const createdCourse = await db.course.create({
    data: {
      title,
      category,
      level,
      duration,
      description,
      instructor,
      status: CourseStatus.draft,
      attachments: {
        create: [
          {
            name: cover.name,
            type: cover.type || "image/*",
            url: `uploads/covers/${Date.now()}-${cover.name}`,
          },
          ...videos.map((video) => ({
            name: video.name,
            type: video.type || "video/*",
            url: `uploads/videos/${Date.now()}-${video.name}`,
          })),
          ...materials.map((material) => ({
            name: material.name,
            type: material.type || "application/octet-stream",
            url: `uploads/materials/${Date.now()}-${material.name}`,
          })),
        ],
      },
    },
    select: {
      id: true,
      title: true,
      category: true,
      level: true,
      duration: true,
      instructor: true,
      status: true,
    },
  });

  return {
    message: "Course created successfully",
    course: createdCourse,
  };
}
