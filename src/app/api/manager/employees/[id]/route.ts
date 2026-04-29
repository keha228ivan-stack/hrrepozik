import { z } from "zod";
import { EmployeeStatus, UserRole } from "@prisma/client";
import { db } from "@/server/db";
import { requireAuth } from "@/server/auth/guard";
import { HttpError, toErrorResponse } from "@/server/http-error";

const patchSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  departmentId: z.string().trim().nullable().optional(),
  position: z.string().trim().min(2).optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
});

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") throw new HttpError(403, "Manager access only");

    const { id } = await props.params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(parsed.data.fullName ? { fullName: parsed.data.fullName } : {}),
        ...(parsed.data.departmentId !== undefined ? { departmentId: parsed.data.departmentId || null } : {}),
        employeeProfile: {
          update: {
            ...(parsed.data.position ? { position: parsed.data.position } : {}),
            ...(parsed.data.status ? { status: parsed.data.status } : {}),
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        departmentId: true,
        employeeProfile: { select: { position: true, status: true } },
      },
    });

    return Response.json({ message: "Employee updated", employee: updated });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAuth();
    if (payload.role !== "manager") throw new HttpError(403, "Manager access only");

    const { id } = await props.params;
    const archived = await db.user.update({
      where: { id },
      data: { employeeProfile: { update: { status: EmployeeStatus.inactive } } },
      select: { id: true, fullName: true, role: true },
    });

    if (archived.role !== UserRole.EMPLOYEE) {
      throw new HttpError(400, "Only employee can be archived");
    }

    return Response.json({ message: "Employee archived", employee: archived });
  } catch (error) {
    return toErrorResponse(error);
  }
}
