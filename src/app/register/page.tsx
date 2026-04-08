"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"manager" | "employee">("employee");
  const [error, setError] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      await register(fullName, email, password, role);
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ошибка регистрации");
    }
  };

  return (
    <div className="mx-auto mt-24 max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Регистрация</h1>
      <p className="mt-1 text-sm text-slate-500">Создайте аккаунт и выберите роль</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          placeholder="ФИО"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          placeholder="Email"
          type="email"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          placeholder="Пароль"
          type="password"
        />
        <select value={role} onChange={(event) => setRole(event.target.value as "manager" | "employee")} className="w-full rounded-xl border border-slate-200 px-3 py-2">
          <option value="employee">Сотрудник</option>
          <option value="manager">Менеджер</option>
        </select>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium text-white">Зарегистрироваться</button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
