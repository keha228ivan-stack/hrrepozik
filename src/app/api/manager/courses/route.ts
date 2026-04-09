import { requireAuth } from "@/server/auth/guard";
import { setCourseAudit } from "@/server/fallback-store";
import { HttpError, toErrorResponse } from "@/server/http-error";
import { createCourseFromFormData } from "@/server/services/course-create.service";

export async function POST(request: Request) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const formData = await request.formData();

    const result = await createCourseFromFormData(formData);
    if (result.course?.id) {
      setCourseAudit({
        courseId: result.course.id,
        createdBy: payload.user_id,
        lastEditedBy: payload.user_id,
      });
    }
    return Response.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
