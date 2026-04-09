import jwt from "jsonwebtoken";
import { HttpError } from "@/server/http-error";

export type AuthTokenPayload = {
  user_id: string;
  role?: "manager" | "employee";
};

const DEV_FALLBACK_JWT_SECRET = "dev-insecure-jwt-secret";
let fallbackSecretWarned = false;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new HttpError(500, "Authentication is misconfigured");
  }

  if (!fallbackSecretWarned) {
    fallbackSecretWarned = true;
    console.warn("JWT_SECRET is missing. Using insecure development fallback secret.");
  }

  return DEV_FALLBACK_JWT_SECRET;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "1h" });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded || typeof decoded !== "object" || typeof decoded.user_id !== "string") {
      throw new HttpError(401, "Unauthorized");
    }

    const role = decoded.role;
    const normalizedRole = role === "manager" || role === "employee" ? role : undefined;

    return {
      user_id: decoded.user_id,
      role: normalizedRole,
    };
  } catch {
    throw new HttpError(401, "Unauthorized");
  }
}
