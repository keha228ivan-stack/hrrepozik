import { db } from "@/server/db";
import { requireAuth } from "@/server/auth/guard";
import { HttpError, toErrorResponse } from "@/server/http-error";

export async function GET() {
  try {
    const payload = await requireAuth();
    const user = await db.user.findUnique({
      where: { id: payload.user_id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    return Response.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.toLowerCase(),
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
