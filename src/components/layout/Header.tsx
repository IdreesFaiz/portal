"use client";

import { usePathname } from "next/navigation";
import { Shield, Menu } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "ڈیش بورڈ",
  "/admin/students": "طلباء",
  "/admin/classes": "جماعتیں",
  "/admin/marks": "نمبرات کا اندراج",
  "/admin/results": "رزلٹ کارڈز",
  "/admin/drafts": "غیر مختص طلباء",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

/**
 * اوپر والا ہیڈر بار — ایڈمن لے آؤٹ
 */
export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const pageTitle = PAGE_TITLES[pathname] ?? "ایڈمن پینل";

  return (
    <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors -ms-1"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 border border-gray-100">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-blue-600 shadow-sm">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-none">ایڈمن</p>
            <p className="text-[11px] text-gray-400 mt-0.5">منتظم</p>
          </div>
        </div>
      </div>
    </header>
  );
}
