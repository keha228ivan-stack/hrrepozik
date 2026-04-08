import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/server/http-error";

const headersMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

describe("requireAuth", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
  });

  it("rejects request without Authorization header", async () => {
    headersMock.mockResolvedValueOnce(new Headers());
    const { requireAuth } = await import("@/server/auth/guard");

    await expect(requireAuth()).rejects.toThrowError(HttpError);
  });

  it("rejects request with invalid bearer token", async () => {
    headersMock.mockResolvedValueOnce(
      new Headers({
        authorization: "Bearer invalid.token",
      }),
    );
    const { requireAuth } = await import("@/server/auth/guard");

    await expect(requireAuth()).rejects.toThrowError(HttpError);
  });
});
