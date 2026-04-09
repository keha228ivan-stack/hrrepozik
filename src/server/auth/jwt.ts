import jwt from "jsonwebtoken";
import { HttpError } from "@/server/http-error";

export type AuthTokenPayload = {
  user_id: string;
  role?: "manager";
};

const DEV_FALLBACK_JWT_SECRET = "dev-insecure-jwt-secret";
let fallbackSecretWarned = false;

function isReleaseEnvironment() {
  return process.env.NODE_ENV === "production"
    || process.env.APP_ENV === "production"
    || process.env.APP_ENV === "release"
    || process.env.VERCEL_ENV === "production";
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (isReleaseEnvironment()) {
    throw new HttpError(500, "JWT_SECRET is required in release environment");
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
    const normalizedRole = role === "manager" ? role : undefined;

    return {
      user_id: decoded.user_id,
      role: normalizedRole,
    };
  } catch {
    throw new HttpError(401, "Unauthorized");
  }
}
