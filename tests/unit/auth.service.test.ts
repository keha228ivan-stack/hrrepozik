import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/server/http-error";
import { loginUser, registerUser } from "@/server/services/auth.service";

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

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects duplicate email during registration", async () => {
    findUniqueMock.mockResolvedValueOnce({ id: "u-1", email: "user@test.dev" });

    await expect(
      registerUser({
        fullName: "Test User",
        email: "user@test.dev",
        password: "password123",
      }),
    ).rejects.toMatchObject<HttpError>({ statusCode: 409 });
  });

  it("hashes password and creates a new user", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    hashPasswordMock.mockResolvedValueOnce("hashed-password");
    createMock.mockResolvedValueOnce({
      id: "u-1",
      fullName: "Test User",
      email: "user@test.dev",
      role: "EMPLOYEE",
    });
    signAccessTokenMock.mockReturnValueOnce("jwt-token");

    const result = await registerUser({
      fullName: "Test User",
      email: "user@test.dev",
      password: "password123",
    });

    expect(hashPasswordMock).toHaveBeenCalledWith("password123");
    expect(createMock).toHaveBeenCalledWith({
      data: {
        fullName: "Test User",
        email: "user@test.dev",
        passwordHash: "hashed-password",
        role: "EMPLOYEE",
      },
    });
    expect(result).toEqual({
      message: "User registered successfully",
      access_token: "jwt-token",
      token_type: "bearer",
    });
  });

  it("returns 401 when user does not exist during login", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    await expect(loginUser({ email: "none@test.dev", password: "bad" })).rejects.toMatchObject<HttpError>({
      statusCode: 401,
    });
  });

  it("returns 401 when password is invalid", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "u-1",
      email: "user@test.dev",
      passwordHash: "stored-hash",
      role: "EMPLOYEE",
    });
    verifyPasswordMock.mockResolvedValueOnce(false);

    await expect(loginUser({ email: "user@test.dev", password: "wrong" })).rejects.toMatchObject<HttpError>({
      statusCode: 401,
    });
  });

  it("returns bearer token for valid credentials", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "u-1",
      email: "user@test.dev",
      passwordHash: "stored-hash",
      role: "MANAGER",
    });
    verifyPasswordMock.mockResolvedValueOnce(true);
    signAccessTokenMock.mockReturnValueOnce("jwt-token");

    const result = await loginUser({ email: "user@test.dev", password: "password123" });

    expect(result).toEqual({
      access_token: "jwt-token",
      token_type: "bearer",
    });
  });
});
