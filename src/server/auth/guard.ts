import { headers } from "next/headers";
import { HttpError } from "@/server/http-error";
import { verifyAccessToken } from "@/server/auth/jwt";

export async function requireAuth() {
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Unauthorized");
  }

  const token = authHeader.slice("Bearer ".length);
  return verifyAccessToken(token);
}
