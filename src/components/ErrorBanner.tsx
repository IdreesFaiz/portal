"use client";

import { AlertCircle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string | null | undefined;
  onDismiss?: () => void;
}

/**
 * خرابی کا بینر — سرخ الرٹ ظاہر کرتا ہے۔
 */
export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/80 backdrop-blur-sm px-4 py-3.5 shadow-sm animate-in slide-in-from-top-2 duration-300">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
        <AlertCircle className="w-4 h-4 text-red-600" />
      </div>
      <p className="flex-1 text-sm text-red-700 font-medium">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
