import type {
  Certificate,
  Course,
  Department,
  EmployeeProfile,
  Enrollment,
  Notification,
  PerformanceReview,
  Quiz,
  QuizAttempt,
  User,
} from "@/lib/types";

export const departments: Department[] = [
  { id: "dep-1", name: "Разработка" },
  { id: "dep-2", name: "Маркетинг" },
  { id: "dep-3", name: "Продажи" },
  { id: "dep-4", name: "HR" },
];

export const users: User[] = [
  { id: "u-1", fullName: "Васильева Ольга", email: "olga@company.ru", role: "MANAGER", departmentId: "dep-4" },
  { id: "u-2", fullName: "Иванов Иван", email: "ivan@company.ru", role: "EMPLOYEE", departmentId: "dep-1" },
  { id: "u-3", fullName: "Козлова Анна", email: "anna@company.ru", role: "EMPLOYEE", departmentId: "dep-2" },
  { id: "u-4", fullName: "Петрова Мария", email: "maria@company.ru", role: "EMPLOYEE", departmentId: "dep-3" },
  { id: "u-5", fullName: "Смирнов Алексей", email: "alex@company.ru", role: "EMPLOYEE", departmentId: "dep-1" },
  { id: "u-6", fullName: "Новиков Денис", email: "denis@company.ru", role: "EMPLOYEE", departmentId: "dep-2" },
];

export const employeeProfiles: EmployeeProfile[] = [
  { userId: "u-2", position: "Senior Developer", avatarInitials: "ИИ", performance: 92, status: "active", completedCourses: 5, inProgressCourses: 2 },
  { userId: "u-3", position: "Marketing Specialist", avatarInitials: "КА", performance: 84, status: "active", completedCourses: 4, inProgressCourses: 1 },
  { userId: "u-4", position: "Sales Manager", avatarInitials: "ПМ", performance: 79, status: "onboarding", completedCourses: 2, inProgressCourses: 3 },
  { userId: "u-5", position: "Frontend Developer", avatarInitials: "СА", performance: 88, status: "vacation", completedCourses: 3, inProgressCourses: 1 },
  { userId: "u-6", position: "Content Manager", avatarInitials: "НД", performance: 68, status: "active", completedCourses: 2, inProgressCourses: 2 },
];

export const courses: Course[] = [
  {
    id: "c-1",
    title: "React для начинающих",
    category: "Разработка",
    level: "Базовый",
    duration: "12 часов",
    description: "Практический курс по React, компонентам и состоянию.",
    instructor: "Васильева Ольга",
    status: "published",
    enrolledCount: 24,
    completedCount: 15,
    modules: [
      { id: "m-1", title: "Основы React", description: "Компоненты, JSX, props", duration: "2 ч" },
      { id: "m-2", title: "Состояние и хуки", description: "useState, useEffect, паттерны", duration: "4 ч" },
    ],
    attachments: [{ id: "a-1", name: "Конспект React.pdf", type: "pdf", url: "#" }],
  },
  {
    id: "c-2",
    title: "Управление проектами",
    category: "Менеджмент",
    level: "Средний",
    duration: "8 часов",
    description: "Планирование задач, сроки, риски и коммуникации.",
    instructor: "Петрова Мария",
    status: "published",
    enrolledCount: 18,
    completedCount: 11,
    modules: [{ id: "m-3", title: "Основы PM", description: "Waterfall, Agile, Scrum", duration: "3 ч" }],
    attachments: [{ id: "a-2", name: "Шаблон Roadmap.docx", type: "doc", url: "#" }],
  },
  {
    id: "c-3",
    title: "UI/UX дизайн",
    category: "Дизайн",
    level: "Продвинутый",
    duration: "10 часов",
    description: "Проектирование пользовательских интерфейсов и UX-паттерны.",
    instructor: "Козлова Анна",
    status: "draft",
    enrolledCount: 15,
    completedCount: 7,
    modules: [{ id: "m-4", title: "UX-исследования", description: "Jobs to be done и опросы", duration: "2 ч" }],
    attachments: [{ id: "a-3", name: "Дизайн система.fig", type: "image", url: "#" }],
  },
];

export const enrollments: Enrollment[] = [
  { id: "e-1", userId: "u-2", courseId: "c-1", progress: 10, status: "ACTIVE", deadline: "2026-05-30" },
  { id: "e-2", userId: "u-2", courseId: "c-2", progress: 100, status: "COMPLETED", deadline: "2026-04-01" },
  { id: "e-3", userId: "u-3", courseId: "c-1", progress: 0, status: "CREATED", deadline: "2026-05-18" },
  { id: "e-4", userId: "u-4", courseId: "c-2", progress: 25, status: "CANCELLED", deadline: "2026-06-05" },
];

export const quizzes: Quiz[] = [
  {
    id: "q-1",
    courseId: "c-1",
    title: "Финальный тест по React",
    passingScore: 70,
    durationMinutes: 25,
    questions: [
      {
        id: "qq-1",
        question: "Какой хук отвечает за локальное состояние?",
        answerType: "single",
        options: ["useState", "useMemo", "useRouter"],
        correctAnswer: ["useState"],
        points: 5,
      },
    ],
  },
];

export const quizAttempts: QuizAttempt[] = [
  { id: "qa-1", quizId: "q-1", userId: "u-2", score: 86, passed: true, completedAt: "2026-04-07", attemptCount: 1 },
  { id: "qa-2", quizId: "q-1", userId: "u-4", score: 64, passed: false, completedAt: "2026-04-05", attemptCount: 2 },
];

export const certificates: Certificate[] = [
  { id: "cert-1", userId: "u-2", courseId: "c-2", issueDate: "2026-04-01" },
];

export const performanceReviews: PerformanceReview[] = [
  { id: "pr-1", userId: "u-2", month: "Март 2026", score: 92, managerComment: "Стабильный рост и активное участие в проектах." },
  { id: "pr-2", userId: "u-3", month: "Март 2026", score: 84, managerComment: "Хорошая динамика, требуется усиление аналитики." },
  { id: "pr-3", userId: "u-6", month: "Март 2026", score: 68, managerComment: "Нужен фокус на дедлайнах и регулярности прохождения курсов." },
];

export const notifications: Notification[] = [
  { id: "n-1", userId: "u-2", title: "Новый курс назначен", description: "Вам назначен курс «Управление проектами».", isRead: false, createdAt: "2026-04-08" },
  { id: "n-2", userId: "u-1", title: "Низкая активность", description: "2 сотрудника не начали обязательное обучение.", isRead: true, createdAt: "2026-04-07" },
];

export const managerStats = [
  { title: "Всего сотрудников", value: "6", trend: "+12%" },
  { title: "Активных", value: "5", trend: "+5%" },
  { title: "Средняя оценка", value: "89%", trend: "+3%" },
  { title: "Пройдено курсов", value: "33", trend: "+18%" },
];
