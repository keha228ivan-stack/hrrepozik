Это проект на [Next.js](https://nextjs.org), созданный через [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Быстрый старт (PowerShell)

1. Установите зависимости:

```powershell
npm install
```

2. Создайте файл `.env.local` (пример ниже в разделе переменных окружения).

3. Запустите проект:

```powershell
npm run dev
```

4. Откройте [http://localhost:3000](http://localhost:3000) в браузере.

Можно редактировать страницы в `src/app/*` — изменения применяются автоматически.

Проект использует [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) для автоматической оптимизации и загрузки шрифта [Geist](https://vercel.com/font).

## Полезные ссылки

Чтобы подробнее изучить Next.js:

- [Документация Next.js](https://nextjs.org/docs) — возможности и API.
- [Learn Next.js](https://nextjs.org/learn) — интерактивный туториал.

Также можно посмотреть [репозиторий Next.js на GitHub](https://github.com/vercel/next.js).

## Деплой на Vercel

Самый простой способ задеплоить приложение — через [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Подробности: [документация по деплою Next.js](https://nextjs.org/docs/app/building-your-application/deploying).


## Переменные окружения

Перед запуском auth-сценариев создайте `.env.local`.

### Вариант 1: вручную в редакторе

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hr_management?schema=public
JWT_SECRET=change-this-to-a-long-random-string
BCRYPT_SALT_ROUNDS=12
# Опционально: проксирование auth API на внешний backend
# BACKEND_API_BASE_URL=http://localhost:8000
# BACKEND_API_PREFIX=/api
```

### Вариант 2: командами PowerShell

```powershell
@"
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hr_management?schema=public
JWT_SECRET=change-this-to-a-long-random-string
BCRYPT_SALT_ROUNDS=12
# Опционально: проксирование auth API на внешний backend
# BACKEND_API_BASE_URL=http://localhost:8000
# BACKEND_API_PREFIX=/api
"@ | Set-Content -Path .env.local
```

- `DATABASE_URL` — обязателен для Prisma (регистрация/логин и запросы к БД).
- `JWT_SECRET` — обязателен для подписи и проверки access-токена.
- `BCRYPT_SALT_ROUNDS` — опционально; если задан, ожидается число от `10` до `15`.
- `BACKEND_API_BASE_URL` — опционально; при наличии включается проксирование `/api/auth/login`, `/api/auth/register`, `/api/auth/me` на внешний backend.
- `BACKEND_API_PREFIX` — опционально; по умолчанию `/api` (например: `http://localhost:8000/api/auth/login`).
