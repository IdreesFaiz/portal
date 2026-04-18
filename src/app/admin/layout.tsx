"use client";

import { useState } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { apiRoutes } from "@/config/api-routes";

/**
 * Admin shell layout — sidebar + header + scrollable main content.
 * The login page is rendered without the shell.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let mounted = true;

    async function verifyAuth() {
      try {
        const res = await fetch(apiRoutes.authMe, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }

        if (mounted) {
          setAuthChecking(false);
        }
      } catch {
        router.replace("/admin/login");
      }
    }

    function handlePageShow() {
      void verifyAuth();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void verifyAuth();
      }
    }

    void verifyAuth();
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50/80">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
