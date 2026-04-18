"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import { useGetClasses } from "@/hooks/useGetClasses";
import { useGetClassStudents } from "@/hooks/useGetClassStudents";
import { useGetMarksByClass, useBulkUpsertMarks } from "@/hooks/useMarks";
import { PASS_PERCENT } from "@/lib/result-status";
import type { ClassWithId, Course } from "@/types/class.types";
import type { StudentWithId } from "@/types/student.types";
import type { MarkPayload } from "@/types/mark.types";

type MarksGrid = Record<string, number>;
function cellKey(studentId: string, courseName: string): string {
  return `${studentId}::${courseName}`;
}
function extractId(field: unknown): string {
  if (typeof field === "object" && field !== null && "_id" in field) {
    return String(field._id);
  }
  return String(field ?? "");
}

export default function MarksPage() {
  const { data: classes, isLoading: classesLoading } = useGetClasses();
  const [selectedClassId, setSelectedClassId] = useState("");
  const selectedClass = useMemo(
    () => classes?.find((c: ClassWithId) => c._id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );
  const { data: students, isLoading: studentsLoading } = useGetClassStudents(selectedClassId);
  const { data: existingMarks, isLoading: marksLoading } = useGetMarksByClass(selectedClassId);
  const bulkMutation = useBulkUpsertMarks(selectedClassId);
  const [grid, setGrid] = useState<MarksGrid>({});
  const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());
  const courses: Course[] = useMemo(() => selectedClass?.courses ?? [], [selectedClass]);

  useEffect(() => {
    if (!students || courses.length === 0) {
      setGrid({});
      setSavedStudents(new Set());
      return;
    }
    const nextGrid: MarksGrid = {};
    const saved = new Set<string>();
    for (const student of students) {
      for (const course of courses) {
        nextGrid[cellKey(student._id, course.name)] = 0;
      }
    }
    if (existingMarks) {
      for (const mark of existingMarks) {
        const studentId = extractId(mark.studentId);
        saved.add(studentId);
        for (const cm of mark.courseMarks) {
          const key = cellKey(studentId, cm.courseName);
          if (key in nextGrid) {
            nextGrid[key] = cm.obtainedMarks;
          }
        }
      }
    }
    setGrid(nextGrid);
    setSavedStudents(saved);
  }, [students, existingMarks, selectedClassId, courses]);

  const handleCellChange = useCallback(
    (studentId: string, courseName: string, value: string, maxMarks: number) => {
      const num = Math.max(0, Math.min(Number(value) || 0, maxMarks));
      setGrid((prev) => ({ ...prev, [cellKey(studentId, courseName)]: num }));
    },
    []
  );

  const buildPayload = useCallback((): MarkPayload[] => {
    if (!students || !selectedClassId) return [];
    return students.map((student) => ({
      studentId: student._id,
      classId: selectedClassId,
      courseMarks: courses.map((course) => ({
        courseName: course.name,
        totalMarks: course.marks,
        obtainedMarks: grid[cellKey(student._id, course.name)] ?? 0,
      })),
    }));
  }, [students, courses, grid, selectedClassId]);

  const handleSaveAll = useCallback(() => {
    const entries = buildPayload();
    if (!entries.length) return;
    bulkMutation.mutate(
      { entries },
      {
        onSuccess: () => {
          setSavedStudents(new Set(students?.map((s) => s._id) ?? []));
        },
      }
    );
  }, [buildPayload, bulkMutation, students]);

  function getStudentStats(studentId: string) {
    let obtained = 0;
    let total = 0;
    let allSubjectsPassed = courses.length > 0;
    for (const course of courses) {
      const subjectObtained = grid[cellKey(studentId, course.name)] ?? 0;
      const subjectPercentage = course.marks > 0 ? (subjectObtained / course.marks) * 100 : 0;
      obtained += subjectObtained;
      total += course.marks;
      if (subjectPercentage < PASS_PERCENT) {
        allSubjectsPassed = false;
      }
    }
    const pct = total > 0 ? (obtained / total) * 100 : 0;
    return { obtained, total, pct, pass: allSubjectsPassed };
  }

  const isDataReady =
    selectedClassId &&
    !studentsLoading &&
    !marksLoading &&
    students &&
    students.length > 0 &&
    courses.length > 0;

  const classStats = useMemo(() => {
    if (!students || !courses.length) return { avg: 0, passCount: 0, failCount: 0, total: 0 };
    let sumPct = 0;
    let passCount = 0;
    for (const student of students) {
      const { pct, pass } = getStudentStats(student._id);
      sumPct += pct;
      if (pass) passCount++;
    }
    return {
      avg: students.length > 0 ? sumPct / students.length : 0,
      passCount,
      failCount: students.length - passCount,
      total: students.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, courses, grid]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 shrink-0">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">نمبرات کا اندراج</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">
              جماعت منتخب کریں اور تمام طلباء کے نمبرات درج کریں
            </p>
          </div>
        </div>
        {isDataReady && (
          <button
            onClick={handleSaveAll}
            disabled={bulkMutation.isPending}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-600/20 self-start sm:self-auto shrink-0"
          >
            {bulkMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> محفوظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" /> تمام محفوظ
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <label className="block mb-2 text-sm font-semibold text-gray-700">جماعت منتخب کریں</label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 hover:border-gray-300 transition-all"
        >
          <option value="">{classesLoading ? "لوڈ ہو رہا ہے..." : "-- جماعت منتخب کریں --"}</option>
          {classes?.map((cls: ClassWithId) => (
            <option key={cls._id} value={cls._id}>
              {cls.className} ({cls.year}) — {cls.courses.length} مضامین
            </option>
          ))}
        </select>
      </div>

      {isDataReady && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{classStats.total}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">کل طلباء</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{classStats.avg.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">جماعت کی اوسط</p>
          </div>
          <div className="bg-emerald-50/60 rounded-2xl shadow-sm border border-emerald-100 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{classStats.passCount}</p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">پاس</p>
          </div>
          <div className="bg-red-50/60 rounded-2xl shadow-sm border border-red-100 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{classStats.failCount}</p>
            <p className="text-xs text-red-600 mt-1 font-medium">فیل</p>
          </div>
        </div>
      )}

      {selectedClassId && (studentsLoading || marksLoading) && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <span className="mt-4 text-sm text-gray-500 font-medium">
            طلباء اور نمبرات لوڈ ہو رہے ہیں...
          </span>
        </div>
      )}

      {selectedClassId && !studentsLoading && students?.length === 0 && (
        <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-8 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 mx-auto mb-3">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-amber-800 font-semibold">اس جماعت میں کوئی طالب علم نہیں۔</p>
          <p className="text-amber-600 text-sm mt-1">پہلے طلباء شامل کریں، پھر نمبرات درج کریں۔</p>
        </div>
      )}

      {selectedClassId && selectedClass && courses.length === 0 && (
        <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-8 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 mx-auto mb-3">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-amber-800 font-semibold">اس جماعت میں کوئی مضمون نہیں۔</p>
          <p className="text-amber-600 text-sm mt-1">جماعت میں ترمیم کر کے مضامین شامل کریں۔</p>
        </div>
      )}

      {isDataReady && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {bulkMutation.isSuccess && (
            <div className="bg-emerald-50/80 border-b border-emerald-100 px-5 py-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm text-emerald-700 font-medium">
                تمام نمبرات کامیابی سے محفوظ ہو گئے!
              </p>
            </div>
          )}
          {bulkMutation.isError && (
            <div className="bg-red-50/80 border-b border-red-100 px-5 py-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-sm text-red-700 font-medium">
                محفوظ کرنے میں ناکامی: {bulkMutation.error?.message ?? "نامعلوم خرابی"}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-l border-gray-100 bg-gray-50/80 sticky right-0 z-20 min-w-[50px]">
                    #
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-l border-gray-100 bg-gray-50/80 sticky right-[50px] z-20 min-w-[180px]">
                    طالب علم
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-l border-gray-100 bg-gray-50/80 sticky right-[230px] z-20 min-w-[90px]">
                    رول نمبر
                  </th>
                  {courses.map((course) => (
                    <th
                      key={course.name}
                      className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-l border-gray-100 min-w-[120px]"
                    >
                      <div>{course.name}</div>
                      <div className="text-[10px] font-normal text-gray-400 mt-0.5">
                        {course.marks} میں سے
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-l border-gray-100 min-w-[80px]">
                    کل
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-l border-gray-100 min-w-[70px]">
                    %
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 min-w-[70px]">
                    حیثیت
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student: StudentWithId, rowIdx: number) => {
                  const stats = getStudentStats(student._id);
                  const isSaved = savedStudents.has(student._id);
                  return (
                    <tr
                      key={student._id}
                      className={`transition-colors ${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/30"} hover:bg-blue-50/40`}
                    >
                      <td className="px-4 py-2.5 text-xs text-gray-400 font-mono border-l border-gray-50 bg-inherit sticky right-0 z-10">
                        {rowIdx + 1}
                      </td>
                      <td className="px-4 py-2.5 border-l border-gray-50 bg-inherit sticky right-[50px] z-10">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${isSaved ? "bg-emerald-500" : "bg-gray-300"}`}
                            title={isSaved ? "نمبرات محفوظ" : "ابھی محفوظ نہیں"}
                          />
                          <span className="font-semibold text-gray-900 truncate">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 border-l border-gray-50 bg-inherit sticky right-[230px] z-10 font-mono text-xs">
                        {student.rollNumber}
                      </td>
                      {courses.map((course) => {
                        const val = grid[cellKey(student._id, course.name)] ?? 0;
                        return (
                          <td
                            key={course.name}
                            className="px-2 py-1.5 text-center border-l border-gray-50"
                          >
                            <input
                              type="number"
                              min={0}
                              max={course.marks}
                              value={val}
                              onChange={(e) =>
                                handleCellChange(
                                  student._id,
                                  course.name,
                                  e.target.value,
                                  course.marks
                                )
                              }
                              className="w-full max-w-[80px] mx-auto px-2 py-1.5 text-center border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 hover:border-gray-300 transition-all"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-center font-bold text-gray-800 border-l border-gray-50">
                        {stats.obtained}
                        <span className="text-gray-400 font-normal">/{stats.total}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold border-l border-gray-50">
                        <span className={stats.pass ? "text-emerald-700" : "text-red-600"}>
                          {stats.pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${stats.pass ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}
                        >
                          {stats.pass ? "پاس" : "فیل"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-3 sm:px-5 py-3 sm:py-3.5 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs text-gray-500 font-medium">
              {students.length} طلباء &middot; {courses.length} مضامین &middot;{" "}
              <span className="text-emerald-600 font-semibold">{savedStudents.size} محفوظ</span>
              {savedStudents.size < students.length && (
                <span className="text-gray-400">
                  {" "}
                  / {students.length - savedStudents.size} باقی
                </span>
              )}
            </p>
            <button
              onClick={handleSaveAll}
              disabled={bulkMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-blue-600/20"
            >
              {bulkMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> محفوظ...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> سب محفوظ
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
