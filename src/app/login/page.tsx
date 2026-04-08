 "use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Ошибка входа");
    }
  };

  return (
    <div className="mx-auto mt-24 max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Вход в систему</h1>
      <p className="mt-1 text-sm text-slate-500">Введите email и пароль</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Email" type="email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Пароль" type="password" />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium text-white">Войти</button>
      </form>
      <p className="mt-4 text-sm text-slate-500">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
