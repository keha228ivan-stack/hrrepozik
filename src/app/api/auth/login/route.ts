import { z } from "zod";
import { loginUser } from "@/server/services/auth.service";
import { toErrorResponse } from "@/server/http-error";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const rawPayload: unknown = await request.json();
    const payload = loginSchema.parse(rawPayload);
    const result = await loginUser(payload);
    return Response.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (error instanceof z.ZodError) {
      return Response.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return toErrorResponse(error);
  }
}
