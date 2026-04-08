import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { HttpError } from "@/server/http-error";
import { signAccessToken, verifyAccessToken } from "@/server/auth/jwt";

describe("jwt auth", () => {
  it("signs and verifies token with user_id and role", () => {
    process.env.JWT_SECRET = "test-secret";
    const token = signAccessToken({ user_id: "u-1", role: "employee" });

    const payload = verifyAccessToken(token);
    expect(payload).toEqual({ user_id: "u-1", role: "employee" });
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
