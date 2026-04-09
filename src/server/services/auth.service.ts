import { Prisma, UserRole } from "@prisma/client";
import { db } from "@/server/db";
import { signAccessToken } from "@/server/auth/jwt";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { HttpError } from "@/server/http-error";

type RegisterInput = {
  fullName?: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export type AuthUserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: "manager";
};

function validateRegisterInput(input: RegisterInput) {
  if (!input.email || !input.password) {
    throw new HttpError(400, "Email and password are required");
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new HttpError(400, "Invalid email format");
  }

  if (input.password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters long");
  }
}

function toRegistrationError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new HttpError(409, "Email already in use");
    }

    if (error.code === "P1000" || error.code === "P1001" || error.code === "P1008") {
      return new HttpError(503, "Database unavailable");
    }

    if (error.code === "P2021" || error.code === "P2022") {
      return new HttpError(500, "Database schema is out of sync. Please run migrations.");
    }

    if (error.code === "P2000" || error.code === "P2006" || error.code === "P2011" || error.code === "P2012") {
      return new HttpError(400, "Invalid registration data");
    }

    return new HttpError(500, `Registration failed (database error: ${error.code})`);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new HttpError(503, "Database unavailable");
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new HttpError(400, "Invalid registration data");
  }

  if (error instanceof Error && error.message) {
    return new HttpError(500, `Registration failed: ${error.message}`);
  }

  return new HttpError(500, "Registration failed due to an unexpected server error");
}

function toLoginError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P1000" || error.code === "P1001" || error.code === "P1008"))
  ) {
    return new HttpError(503, "Database unavailable");
  }

  return new HttpError(500, "Login failed due to an unexpected server error");
}

function buildAuthResponse(user: { id: string }) {
  const accessToken = signAccessToken({
    user_id: user.id,
    role: "manager",
  });

  return {
    access_token: accessToken,
    token_type: "bearer" as const,
  };
}

function toAuthUserProfile(user: { id: string; fullName: string; email: string }): AuthUserProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: "manager",
  };
}

export async function getAuthUserProfile(userId: string): Promise<AuthUserProfile | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    if (user.role !== UserRole.MANAGER) {
      throw new HttpError(403, "Manager access only");
    }

    return toAuthUserProfile(user);
  } catch (error) {
    throw toLoginError(error);
  }
}

export async function registerUser(input: RegisterInput) {
  validateRegisterInput(input);

  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedFullName = input.fullName?.trim() || normalizedEmail.split("@")[0] || "User";

  try {
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new HttpError(409, "Email already in use");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await db.user.create({
      data: {
        fullName: normalizedFullName,
        email: normalizedEmail,
        passwordHash,
        role: UserRole.MANAGER,
      },
    });

    return {
      message: "Manager registered successfully",
      ...buildAuthResponse(user),
    };
  } catch (error) {
    const mappedError = toRegistrationError(error);

    console.error("Registration failed", {
      email: normalizedEmail,
      mappedStatus: mappedError.statusCode,
      mappedMessage: mappedError.message,
      error,
    });

    throw mappedError;
  }
}

export async function loginUser(input: LoginInput) {
  const normalizedEmail = input.email.trim().toLowerCase();

  try {
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    if (user.role !== UserRole.MANAGER) {
      throw new HttpError(403, "Manager access only");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, "Invalid credentials");
    }

    return buildAuthResponse(user);
  } catch (error) {
    throw toLoginError(error);
  }
}
