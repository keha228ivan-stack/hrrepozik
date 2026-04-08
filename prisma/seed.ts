import { PrismaClient, UserRole, EnrollmentStatus, CourseStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.quizAnswerOption.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseAttachment.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const depDev = await prisma.department.create({ data: { name: "Разработка" } });
  const depHr = await prisma.department.create({ data: { name: "HR" } });

  const managerPasswordHash = await bcrypt.hash("manager123", 10);
  const employeePasswordHash = await bcrypt.hash("employee123", 10);

  await prisma.user.create({
    data: {
      fullName: "Васильева Ольга",
      email: "manager@company.ru",
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      departmentId: depHr.id,
    },
  });

  const employee = await prisma.user.create({
    data: {
      fullName: "Иванов Иван",
      email: "employee@company.ru",
      passwordHash: employeePasswordHash,
      role: UserRole.EMPLOYEE,
      departmentId: depDev.id,
      employeeProfile: {
        create: {
          position: "Senior Developer",
          performance: 92,
          status: "active",
          completedCourses: 4,
          inProgressCourses: 1,
        },
      },
    },
  });

  const reactCourse = await prisma.course.create({
    data: {
      title: "React для начинающих",
      category: "Разработка",
      level: "Базовый",
      duration: "12 часов",
      description: "Практический курс по React.",
      instructor: "Васильева Ольга",
      status: CourseStatus.published,
      enrolledCount: 20,
      completedCount: 12,
      modules: {
        create: [
          { title: "Основы React", description: "JSX и компоненты", duration: "2 ч" },
          { title: "Хуки", description: "useState и useEffect", duration: "3 ч" },
        ],
      },
    },
  });

  const secondCourse = await prisma.course.create({
    data: {
      title: "Управление проектами",
      category: "Менеджмент",
      level: "Средний",
      duration: "8 часов",
      description: "Планирование, оценка рисков, коммуникации",
      instructor: "Петрова Мария",
      status: CourseStatus.published,
    },
  });

  const thirdCourse = await prisma.course.create({
    data: {
      title: "SQL для аналитики",
      category: "Аналитика",
      level: "Средний",
      duration: "6 часов",
      description: "Запросы, агрегации, оптимизация SQL.",
      instructor: "Смирнов Алексей",
      status: CourseStatus.published,
    },
  });

  const fourthCourse = await prisma.course.create({
    data: {
      title: "Коммуникации в команде",
      category: "Soft Skills",
      level: "Базовый",
      duration: "4 часа",
      description: "Обратная связь, встречи 1:1, фасилитация.",
      instructor: "Козлова Анна",
      status: CourseStatus.archived,
    },
  });

  await prisma.enrollment.createMany({
    data: [
      {
        userId: employee.id,
        courseId: reactCourse.id,
        status: EnrollmentStatus.CREATED,
        progress: 0,
        deadline: new Date("2026-06-01"),
      },
      {
        userId: employee.id,
        courseId: secondCourse.id,
        status: EnrollmentStatus.ACTIVE,
        progress: 45,
        deadline: new Date("2026-06-15"),
      },
      {
        userId: employee.id,
        courseId: thirdCourse.id,
        status: EnrollmentStatus.COMPLETED,
        progress: 100,
        deadline: new Date("2026-04-10"),
      },
      {
        userId: employee.id,
        courseId: fourthCourse.id,
        status: EnrollmentStatus.CANCELLED,
        progress: 20,
        deadline: new Date("2026-04-20"),
      },
    ],
  });

  console.log("Seed completed");
  console.log("Manager login: manager@company.ru / manager123");
  console.log("Employee login: employee@company.ru / employee123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
