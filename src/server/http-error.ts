import { Prisma } from "@prisma/client";

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
      return Response.json({ error: "User with this email already exists" }, { status: 409 });
    }
  }

  console.error("Unhandled server error", error);

  return Response.json({ error: "Internal server error" }, { status: 500 });
}
