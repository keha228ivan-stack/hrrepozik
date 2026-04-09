import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it } from "vitest";
import { HttpError } from "@/server/http-error";
import { signAccessToken, verifyAccessToken } from "@/server/auth/jwt";

describe("jwt auth", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it("signs and verifies token with user_id and role", () => {
    process.env.JWT_SECRET = "test-secret";
    const token = signAccessToken({ user_id: "u-1", role: "employee" });

    const payload = verifyAccessToken(token);
    expect(payload).toEqual({ user_id: "u-1", role: "employee" });
  });

  it("uses development fallback secret when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "development";

    const token = signAccessToken({ user_id: "u-2", role: "manager" });
    const payload = verifyAccessToken(token);

    expect(payload).toEqual({ user_id: "u-2", role: "manager" });
  });

  it("throws misconfigured error in production when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "production";

    expect(() => signAccessToken({ user_id: "u-3", role: "employee" })).toThrowError(HttpError);
  });

  it("rejects invalid token", () => {
    process.env.JWT_SECRET = "test-secret";
    expect(() => verifyAccessToken("broken.token")).toThrowError(HttpError);
  });

  it("rejects expired token", () => {
    process.env.JWT_SECRET = "test-secret";
    const expired = jwt.sign({ user_id: "u-1", role: "manager" }, process.env.JWT_SECRET, { expiresIn: -10 });

    expect(() => verifyAccessToken(expired)).toThrowError(HttpError);
  });
});
