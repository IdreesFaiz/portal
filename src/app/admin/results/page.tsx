"use client";

import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  FileDown,
  FileSpreadsheet,
  Loader2,
  FileText,
  Filter,
} from "lucide-react";
import { useGetStudents } from "@/hooks/useGetStudents";
import { useGetClasses } from "@/hooks/useGetClasses";
import { apiRoutes } from "@/config/api-routes";
import { queryKeys } from "@/config/query-keys";
import { useApiMutation } from "@/hooks/use-api";
import { useNotification } from "@/hooks/useNotification";
import DataTable, { type Column } from "@/components/DataTable";
import StudentFormModal from "@/components/forms/StudentFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import ErrorBanner from "@/components/ErrorBanner";
import SuccessBanner from "@/components/SuccessBanner";
import ResultCardModal from "@/components/ResultCardModal";
import { getClassName, getClassId } from "@/lib/class-helpers";
import type { Student, StudentWithId } from "@/types/student.types";
import type { ClassWithId } from "@/types/class.types";

const SELECT_CLASS =
  "px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 hover:border-gray-300 transition-all";

export default function ResultsPage() {
  const queryClient = useQueryClient();
  const { data: students, isLoading } = useGetStudents();
  const { data: classes } = useGetClasses();
  const { errorMsg, successMsg, showError, showSuccess, clearError, clearSuccess } =
    useNotification();

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithId | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterClassId, setFilterClassId] = useState("");
  const [exporting, setExporting] = useState(false);

  const availableYears = useMemo(() => {
    if (!classes) return [];
    const yearSet = new Set<number>();
    for (const c of classes) {
      if (c.year) yearSet.add(c.year);
    }
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [classes]);

  const filteredClassOptions = useMemo(() => {
    if (!classes) return [];
    if (!filterYear) return classes;
    return classes.filter((c: ClassWithId) => String(c.year) === filterYear);
  }, [classes, filterYear]);

  const updateMutation = useApiMutation<StudentWithId, Partial<Student>>(
    selectedStudent ? apiRoutes.studentById(selectedStudent._id) : "",
    {
      method: "PUT",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.students() });
        setEditOpen(false);
        setSelectedStudent(null);
        showSuccess("طالب علم اپ ڈیٹ ہو گیا۔");
      },
      onError: (err) => showError(err.message),
    }
  );

  const deleteMutation = useApiMutation<{ success: boolean }>(
    selectedStudent ? apiRoutes.studentById(selectedStudent._id) : "",
    {
      method: "DELETE",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.students() });
        setDeleteOpen(false);
        setSelectedStudent(null);
        showSuccess("طالب علم حذف ہو گیا۔");
      },
      onError: (err) => {
        showError(err.message);
        setDeleteOpen(false);
      },
    }
  );

  const handleEdit = useCallback((data: Student) => updateMutation.mutate(data), [updateMutation]);
  const handleDelete = useCallback(() => deleteMutation.mutate(), [deleteMutation]);

  const filteredStudents = useMemo(() => {
    const list = students ?? [];
    const yearClassIds = filterYear
      ? new Set((classes ?? []).filter((c) => String(c.year) === filterYear).map((c) => c._id))
      : null;
    return list.filter((s) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        s.name.toLowerCase().includes(term) ||
        s.rollNumber.toLowerCase().includes(term) ||
        s.registrationNumber.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term);
      const studentClassId = getClassId(s.classId);
      const matchesYear = yearClassIds === null || yearClassIds.has(studentClassId);
      const matchesClass = filterClassId.length === 0 || studentClassId === filterClassId;
      return matchesSearch && matchesYear && matchesClass;
    });
  }, [students, classes, searchTerm, filterYear, filterClassId]);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const url = filterYear
        ? `${apiRoutes.studentExport}?year=${encodeURIComponent(filterYear)}`
        : apiRoutes.studentExport;
      const res = await fetch(url);
      if (!res.ok) {
        let msg = "Excel export failed";
        try {
          const json = (await res.json()) as { message?: string };
          msg = json.message ?? msg;
        } catch {
          /* response may not be JSON */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filterYear
        ? `students-results-${filterYear}.xlsx`
        : "students-results-all.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      showSuccess("ایکسل فائل کامیابی سے ڈاؤن لوڈ ہو گئی۔");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ایکسپورٹ ناکام";
      showError(msg);
    } finally {
      setExporting(false);
    }
  }, [filterYear, showSuccess, showError]);

  const columns: Column<StudentWithId>[] = [
    {
      key: "name",
      header: "طالب علم",
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.email}</p>
        </div>
      ),
    },
    {
      key: "rollNumber",
      header: "رول نمبر",
      render: (row) => (
        <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
          {row.rollNumber}
        </span>
      ),
    },
    {
      key: "regNumber",
      header: "رجسٹریشن",
      render: (row) => (
        <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
          {row.registrationNumber}
        </span>
      ),
    },
    {
      key: "class",
      header: "جماعت",
      render: (row) => (
        <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-semibold border border-violet-100">
          {getClassName(row.classId)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "عمل",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedStudent(row);
              setViewOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition border border-indigo-100"
          >
            <Eye className="w-3.5 h-3.5" /> دیکھیں
          </button>
          <button
            onClick={() => {
              setSelectedStudent(row);
              setEditOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition border border-blue-100"
          >
            <Pencil className="w-3.5 h-3.5" /> ترمیم
          </button>
          <button
            onClick={() => {
              setSelectedStudent(row);
              setDeleteOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition border border-red-100"
          >
            <Trash2 className="w-3.5 h-3.5" /> حذف
          </button>
          <a
            href={apiRoutes.studentReport(row._id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition border border-emerald-100"
          >
            <FileDown className="w-3.5 h-3.5" /> پی ڈی ایف
          </a>
        </div>
      ),
    },
  ];

  const editInitialData: (Partial<Student> & { _id?: string }) | null = selectedStudent
    ? {
        _id: selectedStudent._id,
        registrationNumber: selectedStudent.registrationNumber,
        rollNumber: selectedStudent.rollNumber,
        name: selectedStudent.name,
        parentName: selectedStudent.parentName,
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        CNIC: selectedStudent.CNIC,
        classId: getClassId(selectedStudent.classId),
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 shrink-0">
            <FileText className="w-5 h-5 text-rose-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">رزلٹ کارڈز</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">
              طلباء کے ریکارڈ دیکھیں، ترمیم کریں اور پی ڈی ایف ڈاؤن لوڈ کریں
            </p>
          </div>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-emerald-600/20 self-start sm:self-auto shrink-0"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> ...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" /> ایکسل
            </>
          )}
        </button>
      </div>

      <ErrorBanner message={errorMsg} onDismiss={clearError} />
      <SuccessBanner message={successMsg} onDismiss={clearSuccess} />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="نام، رول نمبر، رجسٹریشن یا ای میل سے تلاش..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pe-10 ps-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 hover:border-gray-300 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
              setFilterClassId("");
            }}
            className={`${SELECT_CLASS} min-w-[130px]`}
          >
            <option value="">تمام سال</option>
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className={`${SELECT_CLASS} min-w-[160px]`}
          >
            <option value="">تمام جماعتیں</option>
            {filteredClassOptions.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className} ({c.year})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isLoading && (
        <p className="text-xs font-medium text-gray-400 bg-gray-50 inline-flex px-3 py-1.5 rounded-lg">
          {filteredStudents.length} / {(students ?? []).length} طلباء
          {filterYear && <span className="ms-2">— سال {filterYear}</span>}
        </p>
      )}

      <DataTable
        columns={columns}
        data={filteredStudents}
        rowKey={(row) => row._id}
        loading={isLoading}
        emptyMessage="آپ کی تلاش سے کوئی طالب علم نہیں ملا۔"
      />
      <ResultCardModal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />
      <StudentFormModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedStudent(null);
        }}
        onSubmit={handleEdit}
        loading={updateMutation.isPending}
        initialData={editInitialData}
        title="طالب علم میں ترمیم"
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleDelete}
        title="طالب علم حذف"
        message={`کیا آپ واقعی "${selectedStudent?.name ?? ""}" حذف کرنا چاہتے ہیں؟`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
