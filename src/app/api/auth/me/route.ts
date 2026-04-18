import { requireAuth } from "@/server/auth/guard";
import { isBackendProxyEnabled, proxyBackendRequest } from "@/server/backend-proxy";
import { getAuthUserProfile } from "@/server/services/auth.service";
import { HttpError, toErrorResponse } from "@/server/http-error";

export async function GET(request: Request) {
  try {
    if (isBackendProxyEnabled()) {
      return await proxyBackendRequest(request, "/auth/me");
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
