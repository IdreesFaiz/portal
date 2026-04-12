"use client";

import { CheckCircle, X } from "lucide-react";

interface SuccessBannerProps {
  message: string | null | undefined;
  onDismiss?: () => void;
}

/**
 * کامیابی کا بینر — سبز الرٹ ظاہر کرتا ہے۔
 */
export default function SuccessBanner({ message, onDismiss }: SuccessBannerProps) {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/80 backdrop-blur-sm px-4 py-3.5 shadow-sm animate-in slide-in-from-top-2 duration-300">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
      </div>
      <p className="flex-1 text-sm text-emerald-700 font-medium">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
