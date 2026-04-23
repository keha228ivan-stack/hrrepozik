import { z } from "zod";
import { isBackendProxyEnabled, toBackendUrl } from "@/server/backend-proxy";
import { registerUser } from "@/server/services/auth.service";
import { HttpError, toErrorResponse } from "@/server/http-error";

const registerSchema = z.object({
  fullName: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined)
    .refine((value) => value === undefined || value.length >= 2, {
      message: "Full name must be at least 2 characters long",
    }),
  email: z.string().trim().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
});

export async function POST(request: Request) {
  try {
    const rawPayload: unknown = await request.json();
    const payload = (rawPayload && typeof rawPayload === "object"
      ? rawPayload
      : {}) as Record<string, unknown>;

    const normalizedPayload = {
      fullName: payload.fullName ?? payload.full_name ?? payload.name,
      email: payload.email,
      password: payload.password ?? payload.pass,
    };

    const parsed = registerSchema.safeParse(normalizedPayload);

    if (!parsed.success) {
      return Response.json({
        error: parsed.error.issues[0]?.message ?? "Validation failed",
        details: parsed.error.issues,
      }, { status: 400 });
    }

    if (isBackendProxyEnabled()) {
      const targetUrl = toBackendUrl("/auth/register");
      if (!targetUrl) {
        throw new Error("Backend proxy is disabled or BACKEND_API_BASE_URL is invalid");
      }

      const [firstName = "", ...lastNameParts] = (parsed.data.fullName ?? "").trim().split(/\s+/).filter(Boolean);
      const lastName = lastNameParts.join(" ");

      try {
        const upstreamResponse = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            fullName: parsed.data.fullName,
            email: parsed.data.email,
            password: parsed.data.password,
          }),
          cache: "no-store",
        });

        const responseBody = await upstreamResponse.text();
        return new Response(responseBody, {
          status: upstreamResponse.status,
          headers: {
            "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json",
          },
        });
      } catch (proxyError) {
        console.warn("POST /api/auth/register proxy failed, falling back to local auth service", proxyError);
      }
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
