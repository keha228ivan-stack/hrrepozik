import { isBackendProxyEnabled, proxyBackendRequest } from "@/server/backend-proxy";
import { listFallbackNotifications } from "@/server/fallback-store";

export async function GET(request: Request) {
  if (!isBackendProxyEnabled()) {
    return Response.json({ notifications: listFallbackNotifications() });
  }

  return proxyBackendRequest(request, "/notifications");
}
