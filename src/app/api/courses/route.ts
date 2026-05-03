import { requireAuth } from "@/server/auth/guard";
import { isBackendProxyEnabled, proxyBackendRequest, toBackendUrl } from "@/server/backend-proxy";
import { setCourseAudit } from "@/server/fallback-store";
import { HttpError, toErrorResponse } from "@/server/http-error";
import { createCourseFromFormData, listCoursesWithFallback } from "@/server/services/course-create.service";

export async function GET(request: Request) {
  try {
    if (isBackendProxyEnabled()) {
      try {
        return await proxyBackendRequest(request, "/courses");
      } catch (proxyError) {
        console.warn("GET /api/courses proxy failed, falling back to local course service", proxyError);
      }
    }

    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const courses = await listCoursesWithFallback();

    return Response.json({ courses });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    if (isBackendProxyEnabled()) {
      try {
        const targetUrl = toBackendUrl("/courses");
        if (!targetUrl) {
          throw new Error("Backend proxy is disabled");
        }

        const formData = await request.clone().formData();
        const payload = {
          title: String(formData.get("title") ?? ""),
          category: String(formData.get("category") ?? ""),
          level: String(formData.get("level") ?? ""),
          duration: String(formData.get("duration") ?? ""),
          description: String(formData.get("description") ?? ""),
          instructor: String(formData.get("instructor") ?? ""),
        };

        const upstreamResponse = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(request.headers.get("authorization")
              ? { Authorization: request.headers.get("authorization") as string }
              : {}),
          },
          body: JSON.stringify(payload),
          cache: "no-store",
        });

        const responseBody = await upstreamResponse.text();
        return new Response(responseBody, {
          status: upstreamResponse.status,
          headers: {
            "Content-Type": upstreamResponse.headers.get("content-type") ?? "application/json",
          },
        });
      } catch (proxyError) {
        console.warn("POST /api/courses proxy failed, falling back to local course service", proxyError);
      }
    }

    const payload = await requireAuth();
    if (payload.role !== "manager") {
      throw new HttpError(403, "Manager access only");
    }

    const formData = await request.formData();
    const result = await createCourseFromFormData(formData);
    if (result.course?.id) {
      setCourseAudit({
        courseId: result.course.id,
        createdBy: payload.user_id,
        lastEditedBy: payload.user_id,
      });
    }

    return Response.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
