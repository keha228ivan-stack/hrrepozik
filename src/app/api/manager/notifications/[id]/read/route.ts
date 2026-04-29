import { requireAuth } from "@/server/auth/guard";
import { HttpError, toErrorResponse } from "@/server/http-error";
import { markFallbackNotificationAsRead } from "@/server/fallback-store";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const { id } = await params;
    const updated = markFallbackNotificationAsRead(id);
    if (!updated) {
      return Response.json({ error: "Notification not found" }, { status: 404 });
    }

    return Response.json({ message: "Notification marked as read", notification: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}
