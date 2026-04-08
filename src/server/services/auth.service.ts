import { UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { signAccessToken } from "@/server/auth/jwt";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { HttpError } from "@/server/http-error";

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
};

type LoginInput = {
  email: string;
  password: string;
};

export async function registerUser(input: RegisterInput) {
  if (!input.email || !input.password) {
    throw new HttpError(400, "Email and password are required");
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  try {
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new HttpError(409, "User with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await db.user.create({
      data: {
        fullName: input.fullName,
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
    if (error instanceof HttpError) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "User with this email already exists");
    }

    console.error("Registration failed", {
      email: normalizedEmail,
      error,
    });
    throw new HttpError(500, "Unable to register user");
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
