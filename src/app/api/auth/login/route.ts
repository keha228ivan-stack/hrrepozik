import { z } from "zod";
import { isBackendProxyEnabled, toBackendUrl } from "@/server/backend-proxy";
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

    if (isBackendProxyEnabled()) {
      const targetUrl = toBackendUrl("/auth/login");
      if (!targetUrl) {
        throw new Error("Backend proxy is disabled or BACKEND_API_BASE_URL is invalid");
      }

      try {
        const upstreamResponse = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
        console.warn("POST /api/auth/login proxy failed, falling back to local auth service", proxyError);
      }
    }

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
