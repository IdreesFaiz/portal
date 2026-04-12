"use client";

import { use, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FileDown, ArrowUpRight, Loader2, BookOpen } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api";
import { useGetClassStudents } from "@/hooks/useGetClassStudents";
import { useGetClasses } from "@/hooks/useGetClasses";
import { apiRoutes } from "@/config/api-routes";
import { apiRequest } from "@/lib/api-client";
import { queryKeys } from "@/config/query-keys";
import { useNotification } from "@/hooks/useNotification";
import DataTable, { type Column } from "@/components/DataTable";
import Modal from "@/components/Modal";
import ErrorBanner from "@/components/ErrorBanner";
import SuccessBanner from "@/components/SuccessBanner";
import type { ClassWithId } from "@/types/class.types";
import type { StudentWithId } from "@/types/student.types";

interface PageProps { params: Promise<{ id: string }>; }

export default function ClassDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { errorMsg, successMsg, showError, showSuccess, clearError, clearSuccess } = useNotification();
  const { data: classData, isLoading: classLoading } = useApiQuery<ClassWithId>(queryKeys.classById(id), apiRoutes.classById(id));
  const { data: students, isLoading: studentsLoading } = useGetClassStudents(id);
  const { data: allClasses } = useGetClasses();
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteTargetId, setPromoteTargetId] = useState("");
  const [promoting, setPromoting] = useState(false);

  const promoteTargetOptions = useMemo(() => { if (!allClasses) return []; return allClasses.filter((c) => c._id !== id); }, [allClasses, id]);

  const handlePromote = useCallback(async () => {
    if (!promoteTargetId) return;
    setPromoting(true);
    try {
      const res = await apiRequest<{ promotedCount: number }>(apiRoutes.classPromote(id), { method: "POST", json: { targetClassId: promoteTargetId } });
      void queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.classStudents(id) });
      showSuccess(`${res.promotedCount} طالب علم کامیابی سے ترقی پا گئے!`);
      setPromoteOpen(false); setPromoteTargetId("");
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : "ترقی ناکام"; showError(msg); }
    finally { setPromoting(false); }
  }, [promoteTargetId, id, queryClient, showSuccess, showError]);

  if (classLoading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <span className="mt-4 text-sm text-gray-500 font-medium">تفصیلات لوڈ ہو رہی ہیں...</span>
    </div>
  );

  if (!classData) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-gray-500 font-medium">جماعت نہیں ملی۔</p>
      <Link href="/admin/classes" className="text-blue-600 hover:underline mt-2 inline-block text-sm">تمام جماعتوں پر واپس</Link>
    </div>
  );

  const totalMarks = classData.courses.reduce((sum, c) => sum + c.marks, 0);
  const studentColumns: Column<StudentWithId>[] = [
    { key: "name", header: "نام", render: (row) => <span className="font-semibold text-gray-900">{row.name}</span> },
    { key: "rollNumber", header: "رول نمبر", render: (row) => <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{row.rollNumber}</span> },
    { key: "email", header: "ای میل", render: (row) => <span className="text-gray-600 text-xs">{row.email}</span> },
    { key: "phone", header: "فون", render: (row) => <span className="text-gray-600 text-xs">{row.phone}</span> },
    { key: "actions", header: "عمل", render: (row) => (<button onClick={() => window.open(apiRoutes.studentReport(row._id), "_blank")} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition border border-emerald-100"><FileDown className="w-3.5 h-3.5" /> رپورٹ</button>) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/classes" className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 font-medium"><ChevronRight className="w-4 h-4" /> تمام جماعتوں پر واپس</Link>

      <ErrorBanner message={errorMsg} onDismiss={clearError} />
      <SuccessBanner message={successMsg} onDismiss={clearSuccess} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-violet-50 border border-violet-100 shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{classData.className}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs sm:text-sm text-gray-500">{classData.year} &middot; {classData.courses.length} مضامین &middot; {totalMarks} کل نمبر</span>
                {classData.resultsPublished && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-100">شائع شدہ</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => { setPromoteTargetId(""); setPromoteOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 rounded-xl hover:bg-purple-100 transition border border-purple-100 shadow-sm self-start sm:self-auto shrink-0">
            <ArrowUpRight className="w-4 h-4" /> طلباء کی ترقی
          </button>
        </div>

        {classData.courses.length > 0 && (
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">مضامین</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {classData.courses.map((course, idx) => (
                <div key={idx} className="bg-violet-50/60 border border-violet-100 rounded-xl p-3.5">
                  <p className="font-semibold text-violet-900 text-sm">{course.name}</p>
                  <p className="text-xs text-violet-600 mt-1 font-medium">{course.marks} نمبر</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">اس جماعت کے طلباء ({students?.length ?? 0})</h2>
        <DataTable columns={studentColumns} data={students ?? []} rowKey={(row) => row._id} loading={studentsLoading} emptyMessage="اس جماعت میں ابھی کوئی طالب علم نہیں۔" />
      </div>

      <Modal open={promoteOpen} onClose={() => setPromoteOpen(false)} title="طلباء کی ترقی" maxWidth="max-w-md">
        <div className="space-y-5">
          <div className="bg-purple-50/80 border border-purple-100 rounded-xl p-4">
            <p className="text-sm text-purple-800"><strong>تمام {students?.length ?? 0} طلباء</strong> کو <strong>{classData.className} ({classData.year})</strong> سے نئی جماعت میں منتقل کریں۔ پرانے نمبرات محفوظ رہیں گے۔</p>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">ہدف جماعت <span className="text-red-500">*</span></label>
            <select value={promoteTargetId} onChange={(e) => setPromoteTargetId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 hover:border-gray-300 transition-all">
              <option value="">جماعت منتخب کریں</option>
              {promoteTargetOptions.map((c) => (<option key={c._id} value={c._id}>{c.className} ({c.year})</option>))}
            </select>
          </div>
          <div className="flex justify-start gap-3 pt-2">
            <button onClick={handlePromote} disabled={!promoteTargetId || promoting} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-purple-600/20">
              {promoting ? (<><Loader2 className="w-4 h-4 animate-spin" /> ترقی ہو رہی ہے...</>) : (<><ArrowUpRight className="w-4 h-4" /> ترقی دیں</>)}
            </button>
            <button type="button" onClick={() => setPromoteOpen(false)} disabled={promoting} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50">منسوخ</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
