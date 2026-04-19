import { isBackendProxyEnabled, proxyBackendRequest } from "@/server/backend-proxy";

export async function GET(request: Request) {
  if (!isBackendProxyEnabled()) {
    return Response.json({ notifications: [] });
  }

  return proxyBackendRequest(request, "/notifications");
}
