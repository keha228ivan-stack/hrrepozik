import jwt from "jsonwebtoken";
import { HttpError } from "@/server/http-error";

export type AuthTokenPayload = {
  user_id: string;
  role?: "manager" | "employee";
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new HttpError(500, "Authentication is misconfigured");
  }
  return secret;
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
