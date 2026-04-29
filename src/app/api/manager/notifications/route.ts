import { requireAuth } from "@/server/auth/guard";
import { isBackendProxyEnabled, toBackendUrl } from "@/server/backend-proxy";
import { HttpError, toErrorResponse } from "@/server/http-error";
import { listFallbackNotifications } from "@/server/fallback-store";

export async function GET(request: Request) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    if (isBackendProxyEnabled()) {
      const targetUrl = toBackendUrl("/manager/notifications");
      if (targetUrl) {
        try {
          const upstream = await fetch(targetUrl, {
            headers: { Authorization: request.headers.get("authorization") ?? "" },
            cache: "no-store",
          });
          const text = await upstream.text();
          return new Response(text, {
            status: upstream.status,
            headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
          });
        } catch {
          // fallback below
        }
      }
    }

    return Response.json({ notifications: listFallbackNotifications() });
  } catch (error) {
    return toErrorResponse(error);
  }
}
