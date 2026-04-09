import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/server/http-error";
import { getAuthUserProfile, loginUser, registerUser } from "@/server/services/auth.service";

const { findUniqueMock, createMock, hashPasswordMock, verifyPasswordMock, signAccessTokenMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  verifyPasswordMock: vi.fn(),
  signAccessTokenMock: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: findUniqueMock,
      create: createMock,
    },
  },
}));

vi.mock("@/server/auth/password", () => ({
  hashPassword: hashPasswordMock,
  verifyPassword: verifyPasswordMock,
}));

vi.mock("@/server/auth/jwt", () => ({
  signAccessToken: signAccessTokenMock,
}));

describe("auth.service manager-only", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects duplicate email during registration", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "u-1", email: "user@test.dev" });

    await expect(registerUser({ fullName: "Test User", email: "user@test.dev", password: "password123" })).rejects.toMatchObject<HttpError>({
      statusCode: 409,
      message: "Email already in use",
    });
  });

  it("registers manager with MANAGER role", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    hashPasswordMock.mockResolvedValueOnce("hashed-password");
    createMock.mockResolvedValueOnce({ id: "u-1", fullName: "Test User", email: "user@test.dev", role: "MANAGER" });
    signAccessTokenMock.mockReturnValueOnce("jwt-token");

    const result = await registerUser({ fullName: "Test User", email: "user@test.dev", password: "password123" });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        fullName: "Test User",
        email: "user@test.dev",
        passwordHash: "hashed-password",
        role: "MANAGER",
      },
    });
    expect(result).toEqual({
      message: "Manager registered successfully",
      access_token: "jwt-token",
      token_type: "bearer",
    });
  });

  it("blocks employee login", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "e-1",
      email: "employee@test.dev",
      passwordHash: "stored-hash",
      role: "EMPLOYEE",
    });

    await expect(loginUser({ email: "employee@test.dev", password: "password123" })).rejects.toMatchObject<HttpError>({
      statusCode: 403,
      message: "Manager access only",
    });
  });

  it("returns database unavailable when registering or logging in without DB", async () => {
    findUniqueMock.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" }));

    await expect(registerUser({ fullName: "Offline User", email: "offline@test.dev", password: "password123" })).rejects.toMatchObject<HttpError>({
      statusCode: 503,
      message: "Database unavailable",
    });

    findUniqueMock.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" }));
    await expect(loginUser({ email: "offline@test.dev", password: "password123" })).rejects.toMatchObject<HttpError>({
      statusCode: 503,
      message: "Database unavailable",
    });
  });

  it("returns 503 profile error when database is unavailable", async () => {
    findUniqueMock.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("db down", { code: "P1001", clientVersion: "test" }));

    await expect(getAuthUserProfile("m-1")).rejects.toMatchObject<HttpError>({
      statusCode: 503,
      message: "Database unavailable",
    });
  });
});
