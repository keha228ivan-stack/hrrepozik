import { requireAuth } from "@/server/auth/guard";
import { isBackendProxyEnabled, proxyBackendRequest } from "@/server/backend-proxy";
import { getAuthUserProfile } from "@/server/services/auth.service";
import { HttpError, toErrorResponse } from "@/server/http-error";

export async function GET(request: Request) {
  try {
    if (isBackendProxyEnabled()) {
      try {
        return await proxyBackendRequest(request, "/auth/me");
      } catch (proxyError) {
        console.warn("GET /api/auth/me proxy failed, falling back to local auth service", proxyError);
      }
    }

    const payload = await requireAuth();
    const user = await getAuthUserProfile(payload.user_id);

    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    return Response.json({ user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
