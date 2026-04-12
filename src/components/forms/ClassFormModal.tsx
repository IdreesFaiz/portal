"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import Modal from "@/components/Modal";
import type { Class, Course } from "@/types/class.types";

interface ClassFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Class) => void;
  loading?: boolean;
  initialData?: Partial<Class> | null;
  title?: string;
}

const INPUT_BASE = "w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 border bg-white focus:outline-none focus:ring-2";
const INPUT_CLASS = `${INPUT_BASE} border-gray-200 focus:ring-blue-500/30 focus:border-blue-400 hover:border-gray-300`;

export default function ClassFormModal(props: ClassFormModalProps) {
  const [mountKey, setMountKey] = useState(0);
  const handleClose = () => { props.onClose(); setMountKey((k) => k + 1); };

  return (
    <Modal open={props.open} onClose={handleClose} title={props.title ?? "نئی جماعت"} maxWidth="max-w-2xl">
      {props.open && (
        <ClassFormInner key={mountKey} onClose={handleClose} onSubmit={props.onSubmit} loading={props.loading ?? false} initialData={props.initialData ?? null} />
      )}
    </Modal>
  );
}

function ClassFormInner({ onClose, onSubmit, loading, initialData }: {
  onClose: () => void; onSubmit: (data: Class) => void; loading: boolean; initialData: Partial<Class> | null;
}) {
  const currentYear = new Date().getFullYear();
  const [className, setClassName] = useState(initialData?.className ?? "");
  const [year, setYear] = useState<number>(initialData?.year ?? currentYear);
  const [courses, setCourses] = useState<Course[]>(
    initialData?.courses?.length ? initialData.courses.map((c) => ({ ...c })) : [{ name: "", marks: 0 }]
  );

  const duplicateIndices = useMemo(() => {
    const seen = new Map<string, number>();
    const dupes = new Set<number>();
    courses.forEach((course, idx) => {
      const normalized = course.name.trim().toLowerCase();
      if (!normalized) return;
      const existingIdx = seen.get(normalized);
      if (existingIdx !== undefined) { dupes.add(existingIdx); dupes.add(idx); }
      else { seen.set(normalized, idx); }
    });
    return dupes;
  }, [courses]);

  const hasDuplicates = duplicateIndices.size > 0;

  const handleCourseChange = (index: number, field: keyof Course, value: string) => {
    setCourses((prev) => {
      const updated = [...prev];
      if (field === "marks") { updated[index] = { ...updated[index], marks: Math.max(0, Number(value) || 0) }; }
      else { updated[index] = { ...updated[index], name: value }; }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDuplicates) return;
    onSubmit({ className, year, courses: courses.filter((c) => c.name.trim() !== "" && c.marks > 0), resultsPublished: initialData?.resultsPublished ?? false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1.5 text-sm font-semibold text-gray-700">جماعت کا نام</label>
          <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="مثلاً دسویں جماعت" required className={INPUT_CLASS} />
        </div>
        <div>
          <label className="block mb-1.5 text-sm font-semibold text-gray-700">سال</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || currentYear)} min={2020} max={2050} required className={INPUT_CLASS} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700">مضامین</label>
          <button type="button" onClick={() => setCourses((prev) => [...prev, { name: "", marks: 0 }])} className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20">
            <Plus className="w-3.5 h-3.5" /> مضمون
          </button>
        </div>
        <div className="space-y-2.5">
          {courses.map((course, index) => {
            const isDupe = duplicateIndices.has(index);
            return (
              <div key={index} className="flex items-start gap-2.5">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="مضمون کا نام"
                    value={course.name}
                    onChange={(e) => handleCourseChange(index, "name", e.target.value)}
                    className={isDupe ? `${INPUT_BASE} border-red-300 focus:ring-red-400/30 focus:border-red-400 bg-red-50/50` : INPUT_CLASS}
                  />
                  {isDupe && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> مضمون کا نام دہرایا گیا ہے</p>}
                </div>
                <input
                  type="number"
                  placeholder="نمبر"
                  value={course.marks || ""}
                  min={0}
                  onChange={(e) => handleCourseChange(index, "marks", e.target.value)}
                  className="w-24 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 hover:border-gray-300 transition-all"
                />
                {courses.length > 1 && (
                  <button type="button" onClick={() => setCourses((prev) => prev.filter((_, i) => i !== index))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {hasDuplicates && (
        <div className="bg-red-50/80 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700 font-medium">محفوظ کرنے سے پہلے دہرائے گئے مضامین ٹھیک کریں۔</p>
        </div>
      )}

      <div className="flex justify-start gap-3 pt-2">
        <button type="submit" disabled={loading || hasDuplicates} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm shadow-blue-600/20 flex items-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> محفوظ ہو رہا ہے...</> : "محفوظ کریں"}
        </button>
        <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50">منسوخ</button>
      </div>
    </form>
  );
}
