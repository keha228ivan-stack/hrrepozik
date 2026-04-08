import { z } from "zod";
import { registerUser } from "@/server/services/auth.service";
import { HttpError, toErrorResponse } from "@/server/http-error";

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["MANAGER", "EMPLOYEE"]).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const user = await registerUser(payload);
    return Response.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (!(error instanceof HttpError)) {
      console.error("POST /api/auth/register failed", error);
    }
    return toErrorResponse(error);
  }
}
