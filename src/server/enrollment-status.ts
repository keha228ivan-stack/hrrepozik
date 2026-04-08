import { EnrollmentStatus } from "@prisma/client";

const allowedTransitions: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  CREATED: ["ACTIVE"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: EnrollmentStatus, to: EnrollmentStatus): boolean {
  return allowedTransitions[from].includes(to);
}
