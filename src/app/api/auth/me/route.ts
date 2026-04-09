import { requireAuth } from "@/server/auth/guard";
import { getAuthUserProfile } from "@/server/services/auth.service";
import { HttpError, toErrorResponse } from "@/server/http-error";

export async function GET() {
  try {
    const payload = await requireAuth();
    const user = await getAuthUserProfile(payload.user_id);

    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    return Response.json({ user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
