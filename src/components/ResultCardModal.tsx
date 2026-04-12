"use client";

import Modal from "@/components/Modal";
import InfoItem from "@/components/shared/InfoItem";
import SummaryCard from "@/components/shared/SummaryCard";
import { useGetMarks } from "@/hooks/useMarks";
import { getClassId } from "@/lib/class-helpers";
import type { StudentWithId } from "@/types/student.types";
import type { ClassWithId, Course } from "@/types/class.types";

interface ResultCardModalProps { open: boolean; onClose: () => void; student: StudentWithId | null; }

function getClassInfo(classId: unknown): ClassWithId | null {
  if (typeof classId === "object" && classId !== null && "className" in classId) return classId as ClassWithId;
  return null;
}

export default function ResultCardModal({ open, onClose, student }: ResultCardModalProps) {
  const classIdStr = student ? getClassId(student.classId) : "";
  const studentId = student?._id ?? "";
  const { data: marksData, isLoading, isError } = useGetMarks(studentId, classIdStr);

  if (!student) return null;

  const classInfo = getClassInfo(student.classId);
  const className = classInfo?.className ?? "—";
  const courses: Course[] = classInfo?.courses ?? [];
  const courseMarks = marksData?.courseMarks ?? [];
  const totalMax = courses.reduce((s, c) => s + c.marks, 0);
  const totalObtained = courseMarks.reduce((s, cm) => s + cm.obtainedMarks, 0);
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const passed = percentage >= 50;
  const hasMarks = courseMarks.length > 0;

  return (
    <Modal open={open} onClose={onClose} title="طالب علم کا رزلٹ کارڈ" maxWidth="max-w-2xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /><span className="me-3 text-gray-500">نتائج لوڈ ہو رہے ہیں...</span></div>
      ) : isError ? (
        <div className="py-12 text-center"><p className="text-red-600 font-medium">نتائج لوڈ نہیں ہو سکے</p><p className="text-sm text-gray-500 mt-1">دوبارہ کوشش کریں</p></div>
      ) : (
        <div className="space-y-6">
          <div className="bg-linear-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div><h2 className="text-2xl font-bold">{student.name}</h2><p className="text-slate-300 text-sm mt-1">{className}</p></div>
              {hasMarks && (<div className={`px-4 py-2 rounded-lg text-center ${passed ? "bg-green-500/20 border border-green-400/30" : "bg-red-500/20 border border-red-400/30"}`}><p className={`text-2xl font-bold ${passed ? "text-green-400" : "text-red-400"}`}>{passed ? "پاس" : "فیل"}</p><p className="text-xs text-slate-300 mt-0.5">{percentage.toFixed(1)}%</p></div>)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <InfoItem label="رول نمبر" value={student.rollNumber} />
            <InfoItem label="رجسٹریشن نمبر" value={student.registrationNumber} />
            <InfoItem label="ای میل" value={student.email} />
            <InfoItem label="فون" value={student.phone} />
            <InfoItem label="شناختی کارڈ" value={student.CNIC} />
            <InfoItem label="والد/والدہ" value={student.parentName} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">داخلہ شدہ جماعت اور مضامین</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-2">{className}</p>
              {courses.length > 0 ? (<div className="flex flex-wrap gap-2">{courses.map((c, idx) => (<span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">{c.name} ({c.marks} نمبر)</span>))}</div>) : (<p className="text-sm text-gray-400">کوئی مضمون نہیں</p>)}
            </div>
          </div>

          {hasMarks ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">مضمون وار نمبرات</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">مضمون</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">کل</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">حاصل</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">%</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">حیثیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {courseMarks.map((cm, idx) => {
                      const pct = cm.totalMarks > 0 ? (cm.obtainedMarks / cm.totalMarks) * 100 : 0;
                      const subPassed = pct >= 50;
                      return (
                        <tr key={cm.courseName} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{cm.courseName}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{cm.totalMarks}</td>
                          <td className="px-4 py-2.5 text-center font-semibold text-gray-800">{cm.obtainedMarks}</td>
                          <td className="px-4 py-2.5 text-center"><span className={`text-xs font-medium ${subPassed ? "text-green-700" : "text-red-600"}`}>{pct.toFixed(1)}%</span></td>
                          <td className="px-4 py-2.5 text-center"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${subPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{subPassed ? "پاس" : "فیل"}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-6 text-center"><p className="text-yellow-700 font-medium">ابھی نمبرات درج نہیں ہوئے</p><p className="text-yellow-600 text-xs mt-1">نمبرات کے اندراج سے اس طالب علم کے نمبرات شامل کریں۔</p></div>
          )}

          {hasMarks && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SummaryCard label="کل نمبر" value={`${totalObtained} / ${totalMax}`} color="blue" />
              <SummaryCard label="فیصد" value={`${percentage.toFixed(1)}%`} color="indigo" />
              <SummaryCard label="مجموعی حیثیت" value={passed ? "پاس" : "فیل"} color={passed ? "green" : "red"} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
