"use client";

import { Inbox, Loader2 } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * دوبارہ استعمال کے قابل ڈیٹا ٹیبل — لوڈنگ، خالی اور ڈیٹا حالتوں کے ساتھ
 */
export default function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyMessage = "کوئی ڈیٹا نہیں ملا",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50" />
          <Loader2 className="relative w-10 h-10 animate-spin text-blue-600" />
        </div>
        <span className="mt-4 text-sm text-gray-500 font-medium">لوڈ ہو رہا ہے...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 mb-4">
          <Inbox className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-sm text-gray-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full text-sm text-right min-w-[600px]">
          <thead>
            <tr className="bg-gray-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 sm:px-5 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                className="hover:bg-blue-50/40 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 sm:px-5 py-2.5 sm:py-3.5">
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
