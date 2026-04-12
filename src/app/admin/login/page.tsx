"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { apiRoutes } from "@/config/api-routes";

/**
 * ایڈمن لاگ ان صفحہ — پریمیم ڈیزائن
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest<{ success: boolean }>(apiRoutes.authLogin, {
        method: "POST",
        json: { email, password },
      });
      router.push("/admin");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "لاگ ان ناکام";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-600/15 blur-[100px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-violet-600/10 blur-[80px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoMnptMC0zMHY2aC0yVjRoMnptLTMwIDMwdjZINHYtNmgyem0wLTMwdjZINFY0aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-blue-600 shadow-2xl shadow-indigo-500/40 mb-5">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ایڈمن لاگ ان
          </h1>
          <p className="text-sm text-slate-400 mt-2">اسکول مینجمنٹ سسٹم میں خوش آمدید</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          {error && (
            <div className="mb-5 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-300">ای میل</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.com"
                required
                autoFocus
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-300">پاسورڈ</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="اپنا پاسورڈ درج کریں"
                  required
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition pe-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-linear-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-indigo-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  سائن ان ہو رہا ہے...
                </>
              ) : (
                "سائن ان"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          صرف مجاز منتظمین ڈیش بورڈ تک رسائی حاصل کر سکتے ہیں۔
        </p>
      </div>
    </div>
  );
}
