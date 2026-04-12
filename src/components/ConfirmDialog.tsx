"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

/**
 * تصدیقی ڈائیلاگ — حذف یا اہم عمل سے پہلے صارف سے تصدیق لیتا ہے۔
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "حذف کریں",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-gray-600 leading-relaxed mb-6">{message}</p>
        <div className="flex w-full gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 shadow-sm shadow-red-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاری ہے...
              </>
            ) : (
              confirmLabel
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            منسوخ
          </button>
        </div>
      </div>
    </Modal>
  );
}
