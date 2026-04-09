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
};

const FALLBACK_STORE_PATH = join(process.cwd(), ".data", "fallback-store.json");

function ensureStoreFile() {
  const dir = dirname(FALLBACK_STORE_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(FALLBACK_STORE_PATH)) {
    writeFileSync(FALLBACK_STORE_PATH, JSON.stringify({ managers: [], courses: [] }), "utf8");
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
    };
  } catch {
    return { managers: [], courses: [] };
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
