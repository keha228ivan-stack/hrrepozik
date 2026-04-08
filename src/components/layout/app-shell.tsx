"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isAuthPage) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isAuthPage) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isAuthPage, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Проверка сессии...
      </div>
    );
  }

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
