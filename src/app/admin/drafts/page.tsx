"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderOpen, UserPlus, AlertTriangle, Loader2 } from "lucide-react";
import { useGetDraftStudents } from "@/hooks/useGetDraftStudents";
import { useGetClasses } from "@/hooks/useGetClasses";
import { apiRequest } from "@/lib/api-client";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import { useNotification } from "@/hooks/useNotification";
import DataTable, { type Column } from "@/components/DataTable";
import ErrorBanner from "@/components/ErrorBanner";
import SuccessBanner from "@/components/SuccessBanner";
import type { StudentWithId } from "@/types/student.types";
import type { ClassWithId } from "@/types/class.types";

/**
 * غیر مختص طلباء — جن طلباء کی جماعت حذف ہو چکی ہے
 */
export default function DraftsPage() {
  const queryClient = useQueryClient();
  const { data: drafts, isLoading } = useGetDraftStudents();
  const { data: classes } = useGetClasses();
  const { errorMsg, successMsg, showError, showSuccess, clearError, clearSuccess } = useNotification();

  const [assignMap, setAssignMap] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const handleClassSelect = useCallback((studentId: string, classId: string) => {
    setAssignMap((prev) => ({ ...prev, [studentId]: classId }));
  }, []);

  const handleAssign = useCallback(async (student: StudentWithId) => {
    const classId = assignMap[student._id];
    if (!classId) { showError("پہلے جماعت منتخب کریں"); return; }
    setAssigningId(student._id);
    try {
      await apiRequest<StudentWithId>(apiRoutes.studentById(student._id), { method: "PUT", json: { classId } });
      void queryClient.invalidateQueries({ queryKey: queryKeys.draftStudents() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.classStudents(classId) });
      showSuccess(`${student.name} کامیابی سے جماعت میں تفویض ہو گیا`);
      setAssignMap((prev) => { const next = { ...prev }; delete next[student._id]; return next; });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تفویض ناکام";
      showError(msg);
    } finally { setAssigningId(null); }
  }, [assignMap, queryClient, showError, showSuccess]);

  const columns: Column<StudentWithId>[] = [
    { key: "name", header: "نام", render: (row) => <span className="font-semibold text-gray-900">{row.name}</span> },
    { key: "rollNumber", header: "رول نمبر", render: (row) => <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{row.rollNumber}</span> },
    { key: "regNumber", header: "رجسٹریشن نمبر", render: (row) => <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{row.registrationNumber}</span> },
    { key: "email", header: "ای میل", render: (row) => <span className="text-gray-600 text-xs">{row.email}</span> },
    { key: "phone", header: "فون", render: (row) => <span className="text-gray-600 text-xs">{row.phone}</span> },
    {
      key: "assign", header: "جماعت تفویض کریں", render: (row) => (
        <div className="flex items-center gap-2">
          <select value={assignMap[row._id] ?? ""} onChange={(e) => handleClassSelect(row._id, e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 hover:border-gray-300 transition-all min-w-[140px]">
            <option value="">جماعت منتخب کریں</option>
            {(classes ?? []).map((c: ClassWithId) => (<option key={c._id} value={c._id}>{c.className} ({c.year})</option>))}
          </select>
          <button onClick={() => handleAssign(row)} disabled={!assignMap[row._id] || assigningId === row._id} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20">
            {assigningId === row._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            {assigningId === row._id ? "..." : "تفویض"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 shrink-0">
          <FolderOpen className="w-5 h-5 text-amber-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">غیر مختص طلباء</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">وہ طلباء جن کی جماعت حذف ہو چکی ہے — انہیں نئی جماعت تفویض کریں</p>
        </div>
      </div>

      <ErrorBanner message={errorMsg} onDismiss={clearError} />
      <SuccessBanner message={successMsg} onDismiss={clearSuccess} />

      {!isLoading && drafts && drafts.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-sm text-amber-800 font-medium"><strong>{drafts.length}</strong> طالب علم کو جماعت تفویض کرنے کی ضرورت ہے</p>
        </div>
      )}

      <DataTable columns={columns} data={drafts ?? []} rowKey={(row) => row._id} loading={isLoading} emptyMessage="کوئی غیر مختص طالب علم نہیں — تمام طلباء جماعت میں ہیں۔" />
    </div>
  );
}
