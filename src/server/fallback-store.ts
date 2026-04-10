import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

type FallbackUserRole = "MANAGER" | "EMPLOYEE";
type FallbackCourseStatus = "draft" | "published" | "archived";

type FallbackManager = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: FallbackUserRole;
};

type FallbackCourse = {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string;
  instructor: string;
  status: FallbackCourseStatus;
  createdAt: string;
  createdBy: string;
  lastEditedBy: string;
  updatedAt: string;
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
  courseAudit: {
    courseId: string;
    createdBy: string;
    lastEditedBy: string;
    createdAt: string;
    updatedAt: string;
  }[];
};

const FALLBACK_STORE_PATH = join(process.cwd(), ".data", "fallback-store.json");

function ensureStoreFile() {
  const dir = dirname(FALLBACK_STORE_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(FALLBACK_STORE_PATH)) {
    writeFileSync(FALLBACK_STORE_PATH, JSON.stringify({ managers: [], courses: [], employees: [], assignments: [], courseAudit: [] }), "utf8");
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
      courseAudit: parsed.courseAudit ?? [],
    };
  } catch {
    return { managers: [], courses: [], employees: [], assignments: [], courseAudit: [] };
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
    role: "MANAGER",
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
  actor: string;
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
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: input.actor,
    lastEditedBy: input.actor,
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

export function listFallbackAssignments() {
  const store = readStore();
  return [...store.assignments];
}

export function updateFallbackCourse(courseId: string, updates: Partial<{
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string;
  instructor: string;
  status: FallbackCourseStatus;
  lastEditedBy: string;
}>) {
  const store = readStore();
  const index = store.courses.findIndex((course) => course.id === courseId);
  if (index === -1) {
    return null;
  }

  if (updates.title) {
    const normalizedTitle = updates.title.toLowerCase();
    const duplicate = store.courses.find((course) => course.id !== courseId && course.title.toLowerCase() === normalizedTitle);
    if (duplicate) {
      return "duplicate";
    }
  }

  store.courses[index] = {
    ...store.courses[index],
    ...updates,
    updatedAt: new Date().toISOString(),
    lastEditedBy: updates.lastEditedBy ?? store.courses[index].lastEditedBy,
  };
  writeStore(store);
  return store.courses[index];
}

export function deleteFallbackCourse(courseId: string) {
  const store = readStore();
  const nextCourses = store.courses.filter((course) => course.id !== courseId);
  if (nextCourses.length === store.courses.length) {
    return false;
  }
  store.courses = nextCourses;
  store.assignments = store.assignments.filter((assignment) => assignment.courseId !== courseId);
  store.courseAudit = store.courseAudit.filter((item) => item.courseId !== courseId);
  writeStore(store);
  return true;
}

export function setCourseAudit(input: {
  courseId: string;
  createdBy?: string;
  lastEditedBy: string;
}) {
  const store = readStore();
  const current = store.courseAudit.find((item) => item.courseId === input.courseId);
  if (!current) {
    store.courseAudit.push({
      courseId: input.courseId,
      createdBy: input.createdBy ?? input.lastEditedBy,
      lastEditedBy: input.lastEditedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } else {
    current.lastEditedBy = input.lastEditedBy;
    current.updatedAt = new Date().toISOString();
    if (input.createdBy) {
      current.createdBy = input.createdBy;
    }
  }
  writeStore(store);
}

export function getCourseAuditMap() {
  const store = readStore();
  return new Map(store.courseAudit.map((item) => [item.courseId, item]));
}
