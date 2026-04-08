import { db } from "@/server/db";
import { requireAuth } from "@/server/auth/guard";
import { HttpError, toErrorResponse } from "@/server/http-error";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await props.params;
    const enrollment = await db.enrollment.findUnique({ where: { id } });
    if (!enrollment) {
      throw new HttpError(404, "Enrollment not found");
    }
    return Response.json(enrollment);
  } catch (error) {
    return toErrorResponse(error);
  }
}
