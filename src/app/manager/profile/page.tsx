"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Shield, UserCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/contexts/auth-context";

type ProfileUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export default function ManagerProfilePage() {
  const { authFetch } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setError(null);
      setIsLoading(true);
      try {
        const response = await authFetch("/api/auth/me", { cache: "no-store" });
        const data = (await response.json()) as { user?: ProfileUser; error?: string };

        if (!response.ok) {
          if (response.status === 401) {
            setError("Сессия истекла. Выполните вход повторно.");
            return;
          }
          setError(data.error ?? "Не удалось загрузить профиль.");
          return;
        }

        setProfile(data.user ?? null);
      } catch {
        setError("Сетевая ошибка при загрузке профиля.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [authFetch]);

  return (
    <div>
      <SectionHeader title="Профиль" subtitle="Данные текущего менеджера" />

      {isLoading ? (
        <p className="inline-flex items-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Загрузка профиля...
        </p>
      ) : null}

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      {!isLoading && !error && profile ? (
        <div className="max-w-2xl rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <UserCircle2 className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-lg font-semibold text-slate-900">{profile.fullName}</p>
              <p className="text-sm text-slate-500">ID: {profile.id}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {profile.email}</p>
            <p className="inline-flex items-center gap-2"><Shield className="h-4 w-4 text-slate-400" /> Роль: {profile.role}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
