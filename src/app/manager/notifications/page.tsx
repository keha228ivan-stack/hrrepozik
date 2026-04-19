"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { useAuth } from "@/contexts/auth-context";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  notifications?: NotificationItem[];
  items?: NotificationItem[];
  data?: NotificationItem[];
  error?: string;
};

export default function ManagerNotificationsPage() {
  const { authFetch } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authFetch("/api/notifications");
        const payload = (await response.json()) as NotificationsResponse;

        if (!response.ok) {
          if (response.status === 401) {
            setError("Сессия истекла. Выполните вход в аккаунт менеджера.");
            return;
          }
          setError(payload.error ?? "Не удалось загрузить уведомления.");
          return;
        }

        setNotifications(payload.notifications ?? payload.items ?? payload.data ?? []);
      } catch {
        setError("Сетевая ошибка при загрузке уведомлений.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadNotifications();
  }, [authFetch]);

  const orderedNotifications = useMemo(
    () => [...notifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [notifications],
  );

  return (
    <div>
      <SectionHeader title="Уведомления" subtitle="Системные и операционные события" />

      {isLoading ? (
        <p className="inline-flex items-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Загрузка уведомлений...
        </p>
      ) : null}

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      {!isLoading && !error ? (
        <div className="space-y-3">
          {orderedNotifications.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{item.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${item.isRead ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-700"}`}>
                  {item.isRead ? "Прочитано" : "Новое"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              <p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {!orderedNotifications.length ? <p className="text-sm text-slate-500">Уведомлений пока нет.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
