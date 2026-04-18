"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  BookOpen,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  EyeOff,
  Inbox,
  ArrowUpRight,
  Loader2,
  Filter,
} from "lucide-react";
import { useGetClasses } from "@/hooks/useGetClasses";
import { useCreateClass } from "@/hooks/useCreateClass";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import { useApiMutation } from "@/hooks/use-api";
import { apiRequest } from "@/lib/api-client";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import ClassFormModal from "@/components/forms/ClassFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import ErrorBanner from "@/components/ErrorBanner";
import SuccessBanner from "@/components/SuccessBanner";
import { useNotification } from "@/hooks/useNotification";
import type { Class, ClassWithId } from "@/types/class.types";

const SELECT_CLASS =
  "px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 hover:border-gray-300 transition-all";

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const { data: classes, isLoading } = useGetClasses();
  const createMutation = useCreateClass();
  const { errorMsg, successMsg, showError, showSuccess, clearError, clearSuccess } =
    useNotification();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithId | null>(null);
  const [promoteTargetId, setPromoteTargetId] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState("");

  const availableYears = useMemo(() => {
    if (!classes) return [];
    const yearSet = new Set<number>();
    for (const cls of classes) {
      if (cls.year) yearSet.add(cls.year);
    }
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    if (!filterYear) return classes;
    return classes.filter((c) => String(c.year) === filterYear);
  }, [classes, filterYear]);

  const updateMutation = useApiMutation<ClassWithId, Partial<Class>>(
    selectedClass ? apiRoutes.classById(selectedClass._id) : "",
    {
      method: "PUT",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.students() });
        setEditOpen(false);
        setSelectedClass(null);
        showSuccess("جماعت کامیابی سے اپ ڈیٹ ہو گئی۔");
      },
      onError: (err) => showError(err.message),
    }
  );

  const deleteMutation = useApiMutation<{ success: boolean }>(
    selectedClass ? apiRoutes.classById(selectedClass._id) : "",
    {
      method: "DELETE",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.students() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.draftStudents() });
        setDeleteOpen(false);
        setSelectedClass(null);
        showSuccess("جماعت حذف ہو گئی۔ طلباء غیر مختص میں منتقل ہو گئے۔");
      },
      onError: (err) => {
        showError(err.message);
        setDeleteOpen(false);
      },
    }
  );

  const handleAdd = useCallback(
    (data: Class) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setAddOpen(false);
          showSuccess("جماعت کامیابی سے بن گئی۔");
        },
        onError: (err) => showError(err.message),
      });
    },
    [createMutation, showSuccess, showError]
  );

  const handleEdit = useCallback((data: Class) => updateMutation.mutate(data), [updateMutation]);
  const handleDelete = useCallback(() => deleteMutation.mutate(), [deleteMutation]);

  const handleTogglePublish = useCallback(
    async (cls: ClassWithId) => {
      const next = !cls.resultsPublished;
      setPublishingId(cls._id);
      try {
        const res = await apiRequest<ClassWithId & { emailsSent?: boolean }>(
          apiRoutes.classById(cls._id),
          { method: "PUT", json: { resultsPublished: next } }
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.students() });
        if (next && res.emailsSent) {
          showSuccess("نتائج شائع ہو گئے! طلباء کو ای میل بھیجی جا رہی ہے۔");
        } else {
          showSuccess(next ? "نتائج شائع ہو گئے!" : "نتائج غیر شائع ہو گئے۔");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "اپ ڈیٹ ناکام";
        showError(msg);
      } finally {
        setPublishingId(null);
      }
    },
    [queryClient, showSuccess, showError]
  );

  const handlePromote = useCallback(async () => {
    if (!selectedClass || !promoteTargetId) return;
    setPromoting(true);
    try {
      const res = await apiRequest<{ promotedCount: number }>(
        apiRoutes.classPromote(selectedClass._id),
        { method: "POST", json: { targetClassId: promoteTargetId } }
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.students() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes() });
      showSuccess(`${res.promotedCount} طالب علم کامیابی سے ترقی پا گئے!`);
      setPromoteOpen(false);
      setSelectedClass(null);
      setPromoteTargetId("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ترقی ناکام";
      showError(msg);
    } finally {
      setPromoting(false);
    }
  }, [selectedClass, promoteTargetId, queryClient, showSuccess, showError]);

  const promoteTargetOptions = useMemo(() => {
    if (!classes || !selectedClass) return [];
    return classes.filter((c) => c._id !== selectedClass._id);
  }, [classes, selectedClass]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-violet-50 border border-violet-100 shrink-0">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">تمام جماعتیں</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">
              جماعتوں، مضامین کا انتظام اور داخل شدہ طلباء دیکھیں
            </p>
          </div>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm shadow-blue-600/20 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> نئی جماعت
        </button>
      </div>

      <ErrorBanner message={errorMsg} onDismiss={clearError} />
      <SuccessBanner message={successMsg} onDismiss={clearSuccess} />

      {!isLoading && availableYears.length > 1 && (
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className={`${SELECT_CLASS} min-w-[140px]`}
          >
            <option value="">تمام سال</option>
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          {filterYear && (
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
              {filteredClasses.length} / {classes?.length ?? 0} جماعتیں
            </span>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <span className="mt-4 text-sm text-gray-500 font-medium">جماعتیں لوڈ ہو رہی ہیں...</span>
        </div>
      )}

      {!isLoading && filteredClasses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 mb-4">
            <Inbox className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400 font-medium">
            {filterYear
              ? `${filterYear} کے لیے کوئی جماعت نہیں ملی۔`
              : 'کوئی جماعت نہیں ملی۔ "نئی جماعت" پر کلک کریں۔'}
          </p>
        </div>
      )}

      {!isLoading && filteredClasses.length > 0 && (
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          dir="rtl"
        >
          <Accordion>
            {filteredClasses.map((cls) => {
              const totalMarks = cls.courses.reduce((s, c) => s + c.marks, 0);
              return (
                <AccordionItem key={cls._id} value={cls._id}>
                  <AccordionTrigger className="px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50/80 hover:no-underline cursor-pointer">
                    <div className="flex flex-col sm:flex-row-reverse sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="flex flex-row-reverse items-center gap-3 flex-1 min-w-0">
                        <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex flex-row-reverse items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 truncate text-sm sm:text-base">
                              {cls.className}
                            </p>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-mono">
                              {cls.year ?? "—"}
                            </span>
                            {cls.resultsPublished ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-100">
                                شائع شدہ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-bold border border-amber-100">
                                مسودہ
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {cls.courses.length} مضامین &middot; {totalMarks} کل نمبر
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex flex-row-reverse flex-wrap items-center gap-1.5 ms-0 sm:ms-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleTogglePublish(cls)}
                          disabled={publishingId === cls._id}
                          className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition border disabled:opacity-50 ${cls.resultsPublished ? "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-100" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100"}`}
                        >
                          {publishingId === cls._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : cls.resultsPublished ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden xs:inline">
                            {cls.resultsPublished ? "غیر شائع" : "شائع"}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClass(cls);
                            setPromoteTargetId("");
                            setPromoteOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition border border-purple-100"
                          title="تمام طلباء کو دوسری جماعت میں منتقل کریں"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline"> ترقی</span>
                        </button>
                        <Link
                          href={`/admin/classes/${cls._id}`}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition border border-indigo-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline"> دیکھیں</span>
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedClass(cls);
                            setEditOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition border border-blue-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline"> ترمیم</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClass(cls);
                            setDeleteOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition border border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline"> حذف</span>
                        </button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    {cls.courses.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        اس جماعت میں ابھی کوئی مضمون شامل نہیں۔
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-100 mt-2">
                        <table className="w-full text-sm text-right">
                          <thead>
                            <tr className="bg-gray-50/80">
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                                #
                              </th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                مضمون
                              </th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                                کل نمبر
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {cls.courses.map((course, idx) => (
                              <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                                <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                                  {idx + 1}
                                </td>
                                <td className="px-5 py-3 font-semibold text-gray-900">
                                  {course.name}
                                </td>
                                <td className="px-5 py-3 text-left">
                                  <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-semibold border border-violet-100">
                                    {course.marks}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50/80 border-t border-gray-100">
                            <tr>
                              <td className="px-5 py-3" />
                              <td className="px-5 py-3 font-bold text-gray-700">کل</td>
                              <td className="px-5 py-3 text-left">
                                <span className="px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-bold shadow-sm">
                                  {totalMarks}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}

      <ClassFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        loading={createMutation.isPending}
        title="نئی جماعت"
      />
      <ClassFormModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedClass(null);
        }}
        onSubmit={handleEdit}
        loading={updateMutation.isPending}
        initialData={selectedClass}
        title="جماعت میں ترمیم"
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedClass(null);
        }}
        onConfirm={handleDelete}
        title="جماعت حذف کریں"
        message={`کیا آپ واقعی "${selectedClass?.className ?? ""}" حذف کرنا چاہتے ہیں؟ طلباء غیر مختص میں منتقل ہو جائیں گے اور نمبرات حذف ہو جائیں گے۔`}
        loading={deleteMutation.isPending}
      />

      <Modal
        open={promoteOpen}
        onClose={() => {
          setPromoteOpen(false);
          setSelectedClass(null);
        }}
        title="طلباء کی ترقی"
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <div className="bg-purple-50/80 border border-purple-100 rounded-xl p-4">
            <p className="text-sm text-purple-800">
              <strong>تمام طلباء</strong> کو{" "}
              <strong>
                {selectedClass?.className ?? "—"} ({selectedClass?.year})
              </strong>{" "}
              سے نئی جماعت میں منتقل کریں۔ پرانے نمبرات بطور ریکارڈ محفوظ رہیں گے۔
            </p>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">
              ہدف جماعت <span className="text-red-500">*</span>
            </label>
            <select
              value={promoteTargetId}
              onChange={(e) => setPromoteTargetId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 hover:border-gray-300 transition-all"
            >
              <option value="">جماعت منتخب کریں</option>
              {promoteTargetOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className} ({c.year})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-start gap-3 pt-2">
            <button
              onClick={handlePromote}
              disabled={!promoteTargetId || promoting}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-purple-600/20"
            >
              {promoting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> ترقی ہو رہی ہے...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" /> ترقی دیں
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setPromoteOpen(false);
                setSelectedClass(null);
              }}
              disabled={promoting}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              منسوخ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
