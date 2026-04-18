"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Loader2, AlertCircle, FileText, FileDown } from "lucide-react";
import { useGetClasses } from "@/hooks/useGetClasses";
import { evaluateFinalResult } from "@/lib/result-status";
import { apiRoutes } from "@/config/api-routes";
import InfoItem from "@/components/shared/InfoItem";
import SummaryCard from "@/components/shared/SummaryCard";
import type { ClassWithId, Course } from "@/types/class.types";
import type { CourseMark } from "@/types/mark.types";

interface PublicClassInfo {
  className: string;
  year: number;
  courses: Course[];
  resultsPublished: boolean;
}

interface LookupStudent {
  _id: string;
  name: string;
  rollNumber: string;
  registrationNumber: string;
  classId: PublicClassInfo;
}
interface LookupMarks {
  courseMarks: CourseMark[];
}
interface LookupResult {
  student: LookupStudent;
  marks: LookupMarks | null;
}

export default function ResultLookupPage() {
  const { data: classes, isLoading: classesLoading } = useGetClasses();
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const years = useMemo(() => {
    if (!classes) return [];
    const s = new Set<number>();
    for (const c of classes) {
      if (c.year) s.add(c.year);
    }
    return Array.from(s).sort((a, b) => b - a);
  }, [classes]);
  const filteredClasses = useMemo(() => {
    if (!classes || !selectedYear) return [];
    return classes.filter((c) => String(c.year) === selectedYear);
  }, [classes, selectedYear]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !rollNumber.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setSearched(true);
    try {
      const url = `${apiRoutes.studentLookup}?classId=${encodeURIComponent(selectedClassId)}&rollNumber=${encodeURIComponent(rollNumber.trim())}`;
      const res = await fetch(url);
      if (!res.ok) {
        let msg = "طالب علم نہیں ملا";
        try {
          const json = (await res.json()) as { message?: string };
          msg = json.message ?? msg;
        } catch {
          /* non-JSON error */
        }
        setErrorMsg(msg);
        return;
      }
      const json = (await res.json()) as {
        success: boolean;
        data?: LookupResult;
        message?: string;
      };
      if (!json.success) {
        setErrorMsg(json.message ?? "طالب علم نہیں ملا");
        return;
      }
      setResult(json.data ?? null);
    } catch {
      setErrorMsg("نیٹ ورک کی خرابی — دوبارہ کوشش کریں");
    } finally {
      setLoading(false);
    }
  };

  const student = result?.student ?? null;
  const marks = result?.marks ?? null;
  const classInfo = student?.classId ?? null;
  const courses: Course[] = classInfo?.courses ?? [];
  const courseMarks: CourseMark[] = marks?.courseMarks ?? [];
  const hasMarks = courseMarks.length > 0;
  const { totalMax, totalObtained, percentage, passed } = evaluateFinalResult(courseMarks);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
              طالب علم نتائج پورٹل
            </h1>
            <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5">اسکول مینجمنٹ سسٹم</p>
          </div>
          <Link
            href="/admin"
            className="px-3 sm:px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg transition shrink-0"
          >
            ایڈمن پینل
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">اپنا نتیجہ دیکھیں</h2>
            <p className="text-sm text-gray-500 mt-1">
              اپنا رزلٹ کارڈ دیکھنے کے لیے نیچے تفصیلات درج کریں
            </p>
          </div>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  سال <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setSelectedClassId("");
                  }}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{classesLoading ? "لوڈ ہو رہا ہے..." : "سال منتخب کریں"}</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  جماعت <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  required
                  disabled={!selectedYear}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">
                    {!selectedYear ? "پہلے سال منتخب کریں" : "جماعت منتخب کریں"}
                  </option>
                  {filteredClasses.map((c: ClassWithId) => (
                    <option key={c._id} value={c._id}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-700">
                  رول نمبر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="رول نمبر درج کریں"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !selectedYear || !selectedClassId || !rollNumber.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> تلاش ہو رہی ہے...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" /> نتیجہ تلاش کریں
                </>
              )}
            </button>
          </form>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-8 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <p className="text-red-800 font-medium">{errorMsg}</p>
              <p className="text-red-600 text-xs mt-0.5">
                جماعت اور رول نمبر چیک کر کے دوبارہ کوشش کریں۔
              </p>
            </div>
          </div>
        )}

        {student && searched && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-linear-to-r from-slate-800 to-slate-900 px-6 md:px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                    طالب علم کا رزلٹ کارڈ
                  </p>
                  <h2 className="text-2xl font-bold">{student.name}</h2>
                  <p className="text-slate-300 text-sm mt-1">{classInfo?.className ?? "—"}</p>
                </div>
                {hasMarks && (
                  <div
                    className={`px-5 py-3 rounded-xl text-center ${passed ? "bg-green-500/20 border border-green-400/30" : "bg-red-500/20 border border-red-400/30"}`}
                  >
                    <p
                      className={`text-3xl font-bold ${passed ? "text-green-400" : "text-red-400"}`}
                    >
                      {passed ? "پاس" : "فیل"}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">{percentage.toFixed(1)}%</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 md:px-8 py-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoItem label="رول نمبر" value={student.rollNumber} />
                <InfoItem label="رجسٹریشن نمبر" value={student.registrationNumber} />
                <InfoItem label="جماعت" value={classInfo?.className ?? "—"} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  داخلہ شدہ مضامین
                </h3>
                <div className="flex flex-wrap gap-2">
                  {courses.map((c, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                    >
                      {c.name} ({c.marks} نمبر)
                    </span>
                  ))}
                </div>
              </div>
              {hasMarks ? (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    مضمون وار نمبرات
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">
                            #
                          </th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">
                            مضمون
                          </th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                            کل
                          </th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                            حاصل
                          </th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                            %
                          </th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                            حیثیت
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {courseMarks.map((cm, idx) => {
                          const pct =
                            cm.totalMarks > 0 ? (cm.obtainedMarks / cm.totalMarks) * 100 : 0;
                          const sp = pct >= 50;
                          return (
                            <tr key={cm.courseName} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-900">
                                {cm.courseName}
                              </td>
                              <td className="px-4 py-2.5 text-center text-gray-600">
                                {cm.totalMarks}
                              </td>
                              <td className="px-4 py-2.5 text-center font-semibold text-gray-800">
                                {cm.obtainedMarks}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span
                                  className={`text-xs font-medium ${sp ? "text-green-700" : "text-red-600"}`}
                                >
                                  {pct.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${sp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                >
                                  {sp ? "پاس" : "فیل"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-6 text-center">
                  <AlertCircle className="w-10 h-10 mx-auto text-yellow-400 mb-2" />
                  <p className="text-yellow-700 font-medium">ابھی نمبرات درج نہیں ہوئے</p>
                  <p className="text-yellow-600 text-xs mt-1">
                    آپ کے نمبرات ابھی اپ لوڈ نہیں ہوئے۔ بعد میں دوبارہ چیک کریں۔
                  </p>
                </div>
              )}
              {hasMarks && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SummaryCard
                    label="کل نمبر"
                    value={`${totalObtained} / ${totalMax}`}
                    color="blue"
                  />
                  <SummaryCard label="فیصد" value={`${percentage.toFixed(1)}%`} color="indigo" />
                  <SummaryCard
                    label="مجموعی حیثیت"
                    value={passed ? "پاس" : "فیل"}
                    color={passed ? "green" : "red"}
                  />
                </div>
              )}
              {student._id && (
                <div className="pt-2">
                  <button
                    onClick={() =>
                      window.open(
                        apiRoutes.studentReport(student._id),
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    پی ڈی ایف رزلٹ کارڈ
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">اپنا نتیجہ دیکھنے کے لیے تفصیلات درج کریں</p>
            <p className="text-sm mt-1">اوپر سال، جماعت اور رول نمبر منتخب کریں</p>
          </div>
        )}
      </main>
      <footer className="text-center py-6 text-xs text-gray-400">
        اسکول مینجمنٹ سسٹم &middot; v1.0.0
      </footer>
    </div>
  );
}
