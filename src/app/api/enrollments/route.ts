import { z } from "zod";
import { requireAuth } from "@/server/auth/guard";
import { toErrorResponse } from "@/server/http-error";
import { createEnrollmentWithNotification } from "@/server/services/enrollment.service";

const createEnrollmentSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  deadline: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await requireAuth();
    const payload = createEnrollmentSchema.parse(await request.json());
    const enrollment = await createEnrollmentWithNotification(payload);
    return Response.json(enrollment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return toErrorResponse(error);
  }
}
