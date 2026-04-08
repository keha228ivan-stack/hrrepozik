export type UserRole = "MANAGER" | "EMPLOYEE";

export type EmployeeStatus = "active" | "onboarding" | "vacation" | "inactive";
export type CourseStatus = "draft" | "published" | "archived";
export type EnrollmentStatus = "CREATED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type AnswerType = "single" | "multiple" | "text";

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId?: string;
}

export interface EmployeeProfile {
  userId: string;
  position: string;
  avatarInitials: string;
  performance: number;
  status: EmployeeStatus;
  completedCourses: number;
  inProgressCourses: number;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: string;
}

export interface CourseAttachment {
  id: string;
  name: string;
  type: "video" | "pdf" | "doc" | "image";
  url: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  level: "Базовый" | "Средний" | "Продвинутый";
  duration: string;
  description: string;
  instructor: string;
  status: CourseStatus;
  enrolledCount: number;
  completedCount: number;
  modules: CourseModule[];
  attachments: CourseAttachment[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  status: EnrollmentStatus;
  deadline: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answerType: AnswerType;
  options: string[];
  correctAnswer: string[];
  points: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  passingScore: number;
  durationMinutes: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  completedAt: string;
  attemptCount: number;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issueDate: string;
}

export interface PerformanceReview {
  id: string;
  userId: string;
  month: string;
  score: number;
  managerComment: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
}
