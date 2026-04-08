import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyAccessToken } from "@/server/auth/jwt";

type DbUser = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "MANAGER" | "EMPLOYEE";
};

describe("auth routes integration", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "integration-secret";
    vi.resetModules();
  });

  it("registers user, rejects duplicate, and logs in with JWT", async () => {
    const users: DbUser[] = [];

    vi.doMock("@/server/db", () => ({
      db: {
        user: {
          findUnique: async ({ where }: { where: { email: string } }) =>
            users.find((user) => user.email === where.email) ?? null,
          create: async ({ data }: { data: Omit<DbUser, "id"> }) => {
            const created: DbUser = { id: `u-${users.length + 1}`, ...data };
            users.push(created);
            return created;
          },
        },
      },
    }));

    const registerRoute = await import("@/app/api/auth/register/route");
    const loginRoute = await import("@/app/api/auth/login/route");

    const registerResponse = await registerRoute.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Test User",
          email: "user@test.dev",
          password: "password123",
          role: "EMPLOYEE",
        }),
      }),
    );

    expect(registerResponse.status).toBe(201);
    await expect(registerResponse.json()).resolves.toMatchObject({
      message: "User registered successfully",
      token_type: "bearer",
    });

    const duplicateResponse = await registerRoute.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Duplicate User",
          email: "user@test.dev",
          password: "password123",
          role: "EMPLOYEE",
        }),
      }),
    );

    expect(duplicateResponse.status).toBe(400);
    await expect(duplicateResponse.json()).resolves.toMatchObject({
      error: "User with this email already exists",
    });

    const loginResponse = await loginRoute.POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@test.dev",
          password: "password123",
        }),
      }),
    );

    expect(loginResponse.status).toBe(200);
    const loginData = (await loginResponse.json()) as { access_token: string; token_type: string };
    expect(loginData.token_type).toBe("bearer");
    expect(typeof loginData.access_token).toBe("string");

    const payload = verifyAccessToken(loginData.access_token);
    expect(payload).toMatchObject({ user_id: "u-1", role: "employee" });

    const invalidLoginResponse = await loginRoute.POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@test.dev",
          password: "wrong-password",
        }),
      }),
    );

    expect(invalidLoginResponse.status).toBe(401);
    await expect(invalidLoginResponse.json()).resolves.toMatchObject({
      error: "Invalid credentials",
    });
  });
});
