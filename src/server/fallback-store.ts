import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { CourseStatus, UserRole } from "@prisma/client";

type FallbackManager = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole.MANAGER;
};

type FallbackCourse = {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string;
  instructor: string;
  status: CourseStatus;
  createdAt: string;
};

type FallbackStore = {
  managers: FallbackManager[];
  courses: FallbackCourse[];
  employees: {
    id: string;
    fullName: string;
    email: string;
    departmentId: string | null;
    employeeProfile: {
      position: string;
      status: "active" | "onboarding" | "vacation" | "inactive";
      performance: number;
      completedCourses: number;
      inProgressCourses: number;
    };
  }[];
  assignments: {
    id: string;
    userId: string;
    courseId: string;
    progress: number;
    status: "CREATED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    createdAt: string;
    deadline: string;
  }[];
};

const FALLBACK_STORE_PATH = join(process.cwd(), ".data", "fallback-store.json");

function ensureStoreFile() {
  const dir = dirname(FALLBACK_STORE_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(FALLBACK_STORE_PATH)) {
    writeFileSync(FALLBACK_STORE_PATH, JSON.stringify({ managers: [], courses: [], employees: [], assignments: [] }), "utf8");
  }
}

function readStore(): FallbackStore {
  ensureStoreFile();
  try {
    const raw = readFileSync(FALLBACK_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<FallbackStore>;
    return {
      managers: parsed.managers ?? [],
      courses: parsed.courses ?? [],
      employees: parsed.employees ?? [],
      assignments: parsed.assignments ?? [],
    };
  } catch {
    return { managers: [], courses: [], employees: [], assignments: [] };
  }
}

function writeStore(nextStore: FallbackStore) {
  ensureStoreFile();
  writeFileSync(FALLBACK_STORE_PATH, JSON.stringify(nextStore, null, 2), "utf8");
}

export function findFallbackManagerByEmail(email: string) {
  const store = readStore();
  return store.managers.find((manager) => manager.email === email) ?? null;
}

export function findFallbackManagerById(id: string) {
  const store = readStore();
  return store.managers.find((manager) => manager.id === id) ?? null;
}

export function addFallbackManager(input: { fullName: string; email: string; passwordHash: string }) {
  const store = readStore();
  if (store.managers.some((manager) => manager.email === input.email)) {
    return null;
  }

  const manager: FallbackManager = {
    id: randomUUID(),
    fullName: input.fullName,
    email: input.email,
    passwordHash: input.passwordHash,
    role: UserRole.MANAGER,
  };
  store.managers.push(manager);
  writeStore(store);
  return manager;
}

export function addFallbackCourse(input: {
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string;
  instructor: string;
}) {
  const store = readStore();
  const normalizedTitle = input.title.toLowerCase();
  if (store.courses.some((course) => course.title.toLowerCase() === normalizedTitle)) {
    return null;
  }

  const course: FallbackCourse = {
    id: randomUUID(),
    title: input.title,
    category: input.category,
    level: input.level,
    duration: input.duration,
    description: input.description,
    instructor: input.instructor,
    status: CourseStatus.draft,
    createdAt: new Date().toISOString(),
  };
  store.courses.push(course);
  writeStore(store);
  return course;
}

export function listFallbackCourses() {
  const store = readStore();
  return [...store.courses];
}

export function addFallbackEmployee(input: {
  fullName: string;
  email: string;
  departmentId: string | null;
  position: string;
  status: "active" | "onboarding" | "vacation" | "inactive";
}) {
  const store = readStore();
  if (store.employees.some((employee) => employee.email === input.email)) {
    return null;
  }
  const employee = {
    id: randomUUID(),
    fullName: input.fullName,
    email: input.email,
    departmentId: input.departmentId,
    employeeProfile: {
      position: input.position,
      status: input.status,
      performance: 0,
      completedCourses: 0,
      inProgressCourses: 0,
    },
  };
  store.employees.push(employee);
  writeStore(store);
  return employee;
}

export function listFallbackEmployees() {
  const store = readStore();
  return [...store.employees];
}

export function addFallbackAssignment(input: {
  userId: string;
  courseId: string;
  deadline: string;
}) {
  const store = readStore();
  if (store.assignments.some((assignment) => assignment.userId === input.userId && assignment.courseId === input.courseId)) {
    return null;
  }
  const assignment = {
    id: randomUUID(),
    userId: input.userId,
    courseId: input.courseId,
    progress: 0,
    status: "CREATED" as const,
    createdAt: new Date().toISOString(),
    deadline: input.deadline,
  };
  store.assignments.push(assignment);
  writeStore(store);
  return assignment;
}

export function listFallbackAssignmentsByUser(userId: string) {
  const store = readStore();
  return store.assignments.filter((assignment) => assignment.userId === userId);
}
