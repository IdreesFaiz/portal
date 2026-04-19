"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Loader2, AlertCircle, FileText, FileDown } from "lucide-react";
import { useGetClasses } from "@/hooks/useGetClasses";
import { apiRoutes } from "@/config/api-routes";
import ResultCardView from "@/components/ResultCardView";
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
  parentName: string;
  CNIC: string;
  phone: string;
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
  const courseMarks: CourseMark[] = marks?.courseMarks ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
              طالب علم نتائج پورٹل
            </h1>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-5 sm:p-8">
            <ResultCardView
              student={{
                name: student.name,
                parentName: student.parentName,
                rollNumber: student.rollNumber,
                registrationNumber: student.registrationNumber,
                CNIC: student.CNIC,
                phone: student.phone,
              }}
              classInfo={classInfo}
              courseMarks={courseMarks}
            />

            {student._id && (
              <div className="pt-2">
                <a
                  href={apiRoutes.studentReport(student._id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  پی ڈی ایف رزلٹ کارڈ
                </a>
              </div>
            )}
          </div>
        )}

        {!searched && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">اپنا نتیجہ دیکھنے کے لیے تفصیلات درج کریں</p>
            <p className="text-sm mt-1">اوپر سال، جماعت اور رول نمبر منتخب کریں</p>
          </div>
        )}
      </main>
    </div>
  );
}
