import { Prisma } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { db } from "@/server/db";
import { signAccessToken } from "@/server/auth/jwt";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { HttpError } from "@/server/http-error";

type RegisterInput = {
  fullName?: string;
  email: string;
  password: string;
  role?: UserRole;
};

type LoginInput = {
  email: string;
  password: string;
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
        role: input.role ?? UserRole.EMPLOYEE,
      },
    });

    const role = user.role.toLowerCase() as "manager" | "employee";
    const accessToken = signAccessToken({
      user_id: user.id,
      role,
    });

    return {
      message: "User registered successfully",
      access_token: accessToken,
      token_type: "bearer",
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
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new HttpError(401, "Invalid credentials");
  }

  const role = user.role.toLowerCase() as "manager" | "employee";
  const accessToken = signAccessToken({
    user_id: user.id,
    role,
  });

  return {
    access_token: accessToken,
    token_type: "bearer",
  };
}
