import { z } from "zod";
import { registerUser } from "@/server/services/auth.service";
import { HttpError, toErrorResponse } from "@/server/http-error";

const registerSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  email: z.string().trim().email(),
  password: z.string().min(6),
  role: z.enum(["MANAGER", "EMPLOYEE"]).optional(),
});

export async function POST(request: Request) {
  try {
    const rawPayload: unknown = await request.json();
    const parsed = registerSchema.safeParse(rawPayload);

    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const user = await registerUser(parsed.data);
    return Response.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!(error instanceof HttpError)) {
      console.error("POST /api/auth/register failed", error);
    }
    return toErrorResponse(error);
  }
}
