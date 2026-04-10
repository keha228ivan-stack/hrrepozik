import { Prisma } from "@prisma/client";

const PrismaClientConstructorValidationError = Prisma.PrismaClientConstructorValidationError as
  | (new (...args: unknown[]) => Error)
  | undefined;

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.statusCode });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return Response.json({ error: "Email already in use" }, { status: 409 });
    }

    if (error.code === "P2003") {
      return Response.json({ error: "Invalid relation reference" }, { status: 400 });
    }

    if (error.code === "P2021" || error.code === "P2022") {
      return Response.json({ error: "Database schema is out of sync. Please run migrations." }, { status: 500 });
    }

    if (error.code === "P1000" || error.code === "P1001" || error.code === "P1008") {
      return Response.json({ error: "Database unavailable" }, { status: 503 });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return Response.json({ error: "Invalid request data" }, { status: 400 });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  if (PrismaClientConstructorValidationError && error instanceof PrismaClientConstructorValidationError) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  if (error instanceof Error && /database|datasource|DATABASE_URL|connection url|prisma/i.test(error.message)) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  console.error("Unhandled server error", error);

  return Response.json({ error: "Internal server error" }, { status: 500 });
}
