"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  FolderOpen,
  LogOut,
  GraduationCap,
  ChevronLeft,
  X,
} from "lucide-react";
import { apiRoutes } from "@/config/api-routes";
import { useGetDraftStudents } from "@/hooks/useGetDraftStudents";

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * ایڈمن سائڈبار نیویگیشن — پریمیم ڈیزائن
 * Desktop: fixed sidebar with collapse toggle.
 * Mobile: slide-over drawer controlled by parent.
 */
export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: drafts } = useGetDraftStudents();
  const draftCount = drafts?.length ?? 0;

  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const menu: MenuItem[] = [
    { title: "ڈیش بورڈ", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { title: "طلباء", href: "/admin/students", icon: <Users className="w-5 h-5" /> },
    { title: "جماعتیں", href: "/admin/classes", icon: <BookOpen className="w-5 h-5" /> },
    { title: "نمبرات", href: "/admin/marks", icon: <ClipboardCheck className="w-5 h-5" /> },
    { title: "رزلٹ کارڈز", href: "/admin/results", icon: <FileText className="w-5 h-5" /> },
    { title: "غیر مختص", href: "/admin/drafts", icon: <FolderOpen className="w-5 h-5" />, badge: draftCount > 0 ? draftCount : undefined },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(apiRoutes.authLogout, { method: "POST" });
      router.push("/admin/login");
    } catch {
      setLoggingOut(false);
    }
  };

  function isActive(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <aside className={`${collapsed ? "w-20" : "w-64"} relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white min-h-screen flex flex-col transition-all duration-300`}>
      <div className="absolute top-0 left-0 w-full h-40 bg-linear-to-b from-indigo-600/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-indigo-900/10 to-transparent pointer-events-none" />

      {/* Brand */}
      <div className="relative p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold tracking-tight">اسکول ایڈمن</h1>
              <p className="text-[11px] text-slate-500 font-medium">مینجمنٹ سسٹم</p>
            </div>
          )}
          {/* Mobile close button */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ms-auto"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="hidden lg:flex absolute -left-3 top-[72px] z-20 h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-md"
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 pt-6 pb-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            مینو
          </p>
        )}
        {menu.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.title : undefined}
              className={`relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
              } ${
                active
                  ? "bg-white/10 text-white shadow-inner backdrop-blur-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-l-full bg-indigo-400" />
              )}
              <span className={`shrink-0 ${active ? "text-indigo-400" : ""}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="flex-1">{item.title}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold px-1.5">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge !== undefined && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="relative px-3 pb-4 border-t border-white/5 pt-3">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50 ${
            collapsed ? "justify-center px-2 py-3" : "px-4 py-2.5"
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && (loggingOut ? "لاگ آؤٹ..." : "لاگ آؤٹ")}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:block shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative w-64 h-full animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
