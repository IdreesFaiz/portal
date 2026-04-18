"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Loader2, BookOpen } from "lucide-react";
import Modal from "@/components/Modal";
import { useGetClasses } from "@/hooks/useGetClasses";
import { useGetStudents } from "@/hooks/useGetStudents";
import type { Student } from "@/types/student.types";
import type { ClassWithId } from "@/types/class.types";

interface StudentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Student) => void;
  loading?: boolean;
  initialData?: Partial<Student> | null;
  title?: string;
}

const emptyForm: Student = {
  registrationNumber: "",
  rollNumber: "",
  name: "",
  parentName: "",
  email: "",
  phone: "",
  CNIC: "",
  classId: "",
};

type FieldErrors = Partial<Record<keyof Student, string>>;

const INPUT_BASE =
  "w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 border bg-white focus:outline-none focus:ring-2";
const INPUT_CLASS = `${INPUT_BASE} border-gray-200 focus:ring-blue-500/30 focus:border-blue-400 hover:border-gray-300`;
const INPUT_ERROR_CLASS = `${INPUT_BASE} border-red-300 focus:ring-red-400/30 focus:border-red-400 bg-red-50/50`;

type UniqueField = "registrationNumber" | "rollNumber" | "email" | "CNIC" | "phone";
const UNIQUE_FIELDS: UniqueField[] = ["registrationNumber", "rollNumber", "email", "CNIC", "phone"];
const UNIQUE_LABELS: Record<UniqueField, string> = {
  registrationNumber: "رجسٹریشن نمبر",
  rollNumber: "رول نمبر",
  email: "ای میل",
  CNIC: "شناختی کارڈ",
  phone: "فون نمبر",
};

export default function StudentFormModal(props: StudentFormModalProps) {
  const [mountKey, setMountKey] = useState(0);
  const handleClose = () => {
    props.onClose();
    setMountKey((k) => k + 1);
  };

  return (
    <Modal
      open={props.open}
      onClose={handleClose}
      title={props.title ?? "نیا طالب علم"}
      maxWidth="max-w-2xl"
    >
      {props.open && (
        <StudentFormInner
          key={mountKey}
          onClose={handleClose}
          onSubmit={props.onSubmit}
          loading={props.loading ?? false}
          initialData={props.initialData ?? null}
        />
      )}
    </Modal>
  );
}

function StudentFormInner({
  onClose,
  onSubmit,
  loading,
  initialData,
}: {
  onClose: () => void;
  onSubmit: (data: Student) => void;
  loading: boolean;
  initialData: Partial<Student> | null;
}) {
  const [form, setForm] = useState<Student>(
    initialData ? { ...emptyForm, ...initialData } : emptyForm
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const { data: classes, isLoading: classesLoading } = useGetClasses();
  const { data: allStudents } = useGetStudents();

  const editingId = (initialData as { _id?: string } | null)?._id ?? null;

  const existingValues = useMemo(() => {
    const students = (allStudents ?? []).filter((s) => s._id !== editingId);
    return {
      registrationNumber: new Set(students.map((s) => s.registrationNumber.toLowerCase())),
      rollNumber: new Set(students.map((s) => s.rollNumber.toLowerCase())),
      email: new Set(students.map((s) => s.email.toLowerCase())),
      CNIC: new Set(students.map((s) => s.CNIC.toLowerCase())),
      phone: new Set(students.map((s) => s.phone)),
    };
  }, [allStudents, editingId]);

  function checkDuplicate(field: UniqueField, value: string): string | undefined {
    if (!value.trim()) return undefined;
    const normalized = field === "phone" ? value : value.toLowerCase();
    if (existingValues[field].has(normalized)) return `یہ ${UNIQUE_LABELS[field]} پہلے سے موجود ہے`;
    return undefined;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (UNIQUE_FIELDS.includes(name as UniqueField)) {
      const err = checkDuplicate(name as UniqueField, value);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (err) {
          next[name as keyof Student] = err;
        } else {
          delete next[name as keyof Student];
        }
        return next;
      });
    }
  };

  const hasErrors = Object.keys(fieldErrors).length > 0;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    onSubmit(form);
  };
  const selectedClass = classes?.find((c: ClassWithId) => c._id === form.classId);

  function renderField(
    name: keyof Student,
    label: string,
    type = "text",
    extra?: Record<string, string>
  ) {
    const error = fieldErrors[name];
    return (
      <div>
        <label className="block mb-1.5 text-sm font-semibold text-gray-700">{label}</label>
        <input
          name={name}
          type={type}
          value={form[name] ?? ""}
          onChange={handleChange}
          required
          className={error ? INPUT_ERROR_CLASS : INPUT_CLASS}
          {...extra}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField("name", "نام")}
        {renderField("parentName", "والد/والدہ کا نام")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField("registrationNumber", "رجسٹریشن نمبر")}
        {renderField("rollNumber", "رول نمبر")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField("email", "ای میل", "email")}
        {renderField("phone", "فون")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField("CNIC", "شناختی کارڈ نمبر")}
        <div>
          <label className="block mb-1.5 text-sm font-semibold text-gray-700">جماعت</label>
          <select
            name="classId"
            value={form.classId ?? ""}
            onChange={handleChange}
            required
            className={INPUT_CLASS}
          >
            <option value="">{classesLoading ? "لوڈ ہو رہا ہے..." : "جماعت منتخب کریں"}</option>
            {classes?.map((cls: ClassWithId) => (
              <option key={cls._id} value={cls._id}>
                {cls.className}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass && selectedClass.courses.length > 0 && (
        <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            {selectedClass.className} کے مضامین
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedClass.courses.map((course, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-white text-blue-700 rounded-lg text-xs font-medium border border-blue-100 shadow-sm"
              >
                {course.name} ({course.marks} نمبر)
              </span>
            ))}
          </div>
        </div>
      )}

      {hasErrors && (
        <div className="bg-red-50/80 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700 font-medium">
            محفوظ کرنے سے پہلے اوپر والی خرابیاں ٹھیک کریں۔
          </p>
        </div>
      )}

      <div className="flex justify-start gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || hasErrors}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm shadow-blue-600/20 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> محفوظ ہو رہا ہے...
            </>
          ) : (
            "محفوظ کریں"
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          منسوخ
        </button>
      </div>
    </form>
  );
}
