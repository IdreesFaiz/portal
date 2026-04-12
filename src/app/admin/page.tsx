"use client";

import Link from "next/link";
import {
  Users,
  BookOpen,
  ClipboardCheck,
  FolderOpen,
  ArrowUpLeft,
  TrendingUp,
  GraduationCap,
  FileSpreadsheet,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useGetStudents } from "@/hooks/useGetStudents";
import { useGetClasses } from "@/hooks/useGetClasses";
import { useGetDraftStudents } from "@/hooks/useGetDraftStudents";

/**
 * Returns an Urdu greeting based on the current time of day.
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "صبح بخیر";
  if (hour < 17) return "دوپہر بخیر";
  return "شام بخیر";
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  href: string;
  gradient: string;
  shadowColor: string;
  icon: React.ReactNode;
  trend?: string;
}

function StatCard({ title, value, description, href, gradient, shadowColor, icon, trend }: StatCardProps) {
  return (
    <Link href={href} className="group block">
      <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-6 text-white transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl ${gradient} ${shadowColor}`}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
            {trend && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </span>
            )}
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">{value}</p>
          <p className="text-sm font-semibold text-white/90 mt-1.5">{title}</p>
          <p className="text-xs text-white/60 mt-0.5">{description}</p>
        </div>

        <div className="absolute bottom-3 left-6 flex items-center gap-1 text-[11px] text-white/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpLeft className="w-3 h-3" />
          تفصیلات دیکھیں
        </div>
      </div>
    </Link>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

function QuickAction({ title, description, href, icon, color }: QuickActionProps) {
  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 transition-all duration-200 hover:border-gray-200 hover:shadow-md hover:translate-x-[-2px]">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color} transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 truncate">{description}</p>
        </div>
      </div>
    </Link>
  );
}

/**
 * ایڈمن ڈیش بورڈ — خلاصہ اعداد و شمار
 */
export default function AdminPage() {
  const { data: students, isLoading: studentsLoading } = useGetStudents();
  const { data: classes, isLoading: classesLoading } = useGetClasses();
  const { data: drafts, isLoading: draftsLoading } = useGetDraftStudents();

  const studentCount = studentsLoading ? "—" : (students?.length ?? 0);
  const classCount = classesLoading ? "—" : (classes?.length ?? 0);
  const courseCount = classesLoading
    ? "—"
    : (classes?.reduce((sum, c) => sum + c.courses.length, 0) ?? 0);
  const draftCount = draftsLoading ? "—" : (drafts?.length ?? 0);

  const currentYear = new Date().getFullYear();
  const todayDate = new Date().toLocaleDateString("ur-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-bl from-slate-900 via-slate-800 to-indigo-900 p-5 sm:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoMnptMC0zMHY2aC0yVjRoMnptLTMwIDMwdjZINHYtNmgyem0wLTMwdjZINFY0aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-white/70">{getGreeting()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              اسکول ایڈمن ڈیش بورڈ
            </h1>
            <div className="flex items-center gap-3 mt-3 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {todayDate}
              </span>
              <span className="hidden sm:inline text-white/30">|</span>
              <span className="hidden sm:flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                تعلیمی سال {currentYear}
              </span>
            </div>
          </div>

          <Link
            href="/admin/results"
            className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors border border-white/10"
          >
            <FileSpreadsheet className="w-4 h-4" />
            رزلٹ کارڈز
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="کل طلباء"
          value={studentCount}
          description="رجسٹرڈ طلباء"
          href="/admin/students"
          gradient="bg-linear-to-br from-blue-500 to-blue-700"
          shadowColor="shadow-lg shadow-blue-500/25"
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="کل جماعتیں"
          value={classCount}
          description="فعال جماعتیں"
          href="/admin/classes"
          gradient="bg-linear-to-br from-violet-500 to-purple-700"
          shadowColor="shadow-lg shadow-violet-500/25"
          icon={<BookOpen className="w-6 h-6" />}
        />
        <StatCard
          title="کل مضامین"
          value={courseCount}
          description="تمام جماعتوں میں"
          href="/admin/marks"
          gradient="bg-linear-to-br from-emerald-500 to-green-700"
          shadowColor="shadow-lg shadow-emerald-500/25"
          icon={<ClipboardCheck className="w-6 h-6" />}
        />
        <StatCard
          title="غیر مختص طلباء"
          value={draftCount}
          description="جماعت کی تفویض زیر التواء"
          href="/admin/drafts"
          gradient="bg-linear-to-br from-amber-500 to-orange-600"
          shadowColor="shadow-lg shadow-amber-500/25"
          icon={<FolderOpen className="w-6 h-6" />}
          trend={typeof draftCount === "number" && draftCount > 0 ? "زیر التواء" : undefined}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="h-7 w-1 rounded-full bg-blue-600" />
            فوری کارروائیاں
          </h2>
          <div className="space-y-3">
            <QuickAction
              title="طلباء کا انتظام"
              description="نیا اندراج، ترمیم، یا حذف"
              href="/admin/students"
              icon={<Users className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50"
            />
            <QuickAction
              title="جماعتوں کا انتظام"
              description="جماعتیں اور مضامین ترتیب دیں"
              href="/admin/classes"
              icon={<BookOpen className="w-5 h-5 text-violet-600" />}
              color="bg-violet-50"
            />
            <QuickAction
              title="نمبرات کا اندراج"
              description="طلباء کے نمبرات درج کریں"
              href="/admin/marks"
              icon={<ClipboardCheck className="w-5 h-5 text-emerald-600" />}
              color="bg-emerald-50"
            />
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="h-7 w-1 rounded-full bg-violet-600" />
            رپورٹس اور ایکسپورٹ
          </h2>
          <div className="space-y-3">
            <QuickAction
              title="رزلٹ کارڈز"
              description="طلباء کے نتائج دیکھیں اور ڈاؤن لوڈ کریں"
              href="/admin/results"
              icon={<FileSpreadsheet className="w-5 h-5 text-rose-600" />}
              color="bg-rose-50"
            />
            <QuickAction
              title="غیر مختص طلباء"
              description="بغیر جماعت کے طلباء کو تفویض کریں"
              href="/admin/drafts"
              icon={<FolderOpen className="w-5 h-5 text-amber-600" />}
              color="bg-amber-50"
            />
            <QuickAction
              title="جماعت کی تفصیلات"
              description="جماعت وار طلباء کی فہرست"
              href="/admin/classes"
              icon={<GraduationCap className="w-5 h-5 text-teal-600" />}
              color="bg-teal-50"
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-2">
        <p className="text-xs text-gray-400">
          اسکول مینجمنٹ سسٹم &mdash; v1.0.0
        </p>
      </div>
    </div>
  );
}
