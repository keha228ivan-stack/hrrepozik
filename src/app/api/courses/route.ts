import { requireAuth } from "@/server/auth/guard";
import { HttpError, toErrorResponse } from "@/server/http-error";
import { createCourseFromFormData, listCoursesWithFallback } from "@/server/services/course-create.service";

export async function GET() {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const courses = await listCoursesWithFallback();

    return Response.json({ courses });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const formData = await request.formData();
    const result = await createCourseFromFormData(formData);

    return Response.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
