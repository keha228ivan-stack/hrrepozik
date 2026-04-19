function sanitizeEnvValue(value: string | undefined) {
  if (!value) {
    return value;
  }

  let result = value.trim();
  while (
    (result.startsWith("\"") && result.endsWith("\"")) ||
    (result.startsWith("'") && result.endsWith("'"))
  ) {
    result = result.slice(1, -1).trim();
  }

  return result;
}

const BACKEND_API_BASE_URL = sanitizeEnvValue(process.env.BACKEND_API_BASE_URL);
const BACKEND_API_PREFIX = sanitizeEnvValue(process.env.BACKEND_API_PREFIX) ?? "/api";

function normalizePrefix(prefix: string) {
  if (!prefix) {
    return "";
  }

  return prefix.startsWith("/") ? prefix : `/${prefix}`;
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function isBackendProxyEnabled() {
  return Boolean(BACKEND_API_BASE_URL);
}

export function toBackendUrl(path: string) {
  if (!BACKEND_API_BASE_URL) {
    return null;
  }

  const base = BACKEND_API_BASE_URL.replace(/\/+$/, "");
  const prefix = normalizePrefix(BACKEND_API_PREFIX).replace(/\/+$/, "");
  const normalizedPath = normalizePath(path);
  const fullUrl = `${base}${prefix}${normalizedPath}`;
  try {
    return new URL(fullUrl).toString();
  } catch {
    return null;
  }
}

export async function proxyBackendRequest(request: Request, path: string) {
  const targetUrl = toBackendUrl(path);

  if (!targetUrl) {
    throw new Error("Backend proxy is disabled or BACKEND_API_BASE_URL is invalid");
  }

  const method = request.method.toUpperCase();
  const shouldPassBody = method !== "GET" && method !== "HEAD";
  const body = shouldPassBody ? await request.text() : undefined;

  const upstreamResponse = await fetch(targetUrl, {
    method,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      ...(request.headers.get("authorization")
        ? { Authorization: request.headers.get("authorization") as string }
        : {}),
    },
    body,
    cache: "no-store",
  });

  const responseBody = await upstreamResponse.text();

  return new Response(responseBody, {
    status: upstreamResponse.status,
    headers: {
      "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json",
    },
  });
}
