import { EnrollmentStatus } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "@/server/auth/guard";
import { toErrorResponse } from "@/server/http-error";
import { updateEnrollmentStatus } from "@/server/services/enrollment.service";

const updateStatusSchema = z.object({
  status: z.enum([
    EnrollmentStatus.CREATED,
    EnrollmentStatus.ACTIVE,
    EnrollmentStatus.COMPLETED,
    EnrollmentStatus.CANCELLED,
  ]),
});

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await props.params;
    const payload = updateStatusSchema.parse(await request.json());
    const updated = await updateEnrollmentStatus(id, payload.status);
    return Response.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return toErrorResponse(error);
  }
}
