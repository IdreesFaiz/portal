"use client";

import Modal from "@/components/Modal";
import InfoItem from "@/components/shared/InfoItem";
import { getClassName } from "@/lib/class-helpers";
import type { StudentWithId } from "@/types/student.types";
import type { ClassWithId } from "@/types/class.types";

interface StudentDetailModalProps {
  /** Controls visibility of the modal. */
  open: boolean;
  /** Invoked when the user dismisses the modal (escape / backdrop / close button). */
  onClose: () => void;
  /** Student whose details should be rendered. `null` disables the modal. */
  student: StudentWithId | null;
}

/**
 * Type guard — determines whether the populated `classId` value on a student
 * is a full class object (as returned by Mongoose populate) vs. a raw ObjectId
 * string. Keeps the renderer strictly typed without casting.
 */
function getPopulatedClass(classId: unknown): ClassWithId | null {
  if (typeof classId === "object" && classId !== null && "className" in classId) {
    return classId as ClassWithId;
  }
  return null;
}

/**
 * Read-only student detail dialog used from the admin students table.
 * Displays the full set of stored student fields (name, parent, IDs, contact,
 * assigned class) without any edit controls. Uses the shared `Modal` shell
 * and `InfoItem` card so styling stays consistent with `ResultCardModal`.
 */
export default function StudentDetailModal({ open, onClose, student }: StudentDetailModalProps) {
  if (!student) {
    return null;
  }

  const populatedClass: ClassWithId | null = getPopulatedClass(student.classId);
  const className: string = getClassName(student.classId);
  const classYear: string = populatedClass?.year ? String(populatedClass.year) : "—";
  const courseCount: number = populatedClass?.courses?.length ?? 0;

  return (
    <Modal open={open} onClose={onClose} title="طالب علم کی تفصیلات" maxWidth="max-w-2xl">
      <div className="space-y-6">
        <div className="bg-linear-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
          <p className="text-xs uppercase tracking-wider text-slate-300 mb-1">نام</p>
          <h2 className="text-2xl font-bold">{student.name}</h2>
          <p className="text-slate-300 text-sm mt-2">
            {className}
            {classYear !== "—" ? ` · ${classYear}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <InfoItem label="رول نمبر" value={student.rollNumber} />
          <InfoItem label="رجسٹریشن نمبر" value={student.registrationNumber} />
          <InfoItem label="والد / والدہ" value={student.parentName} />
          <InfoItem label="شناختی کارڈ" value={student.CNIC} />
          <InfoItem label="ای میل" value={student.email} />
          <InfoItem label="فون نمبر" value={student.phone} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
            جماعت کی تفصیلات
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="font-medium text-gray-900">{className}</p>
            <p className="text-xs text-gray-500">
              سال: {classYear} · مضامین: {courseCount}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
