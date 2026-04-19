"use client";

import Modal from "@/components/Modal";
import ResultCardView from "@/components/ResultCardView";
import { useGetMarks } from "@/hooks/useMarks";
import { getClassId } from "@/lib/class-helpers";
import type { StudentWithId } from "@/types/student.types";
import type { ClassWithId } from "@/types/class.types";

interface ResultCardModalProps {
  open: boolean;
  onClose: () => void;
  student: StudentWithId | null;
}

/** Type guard — accept the populated `classId` shape returned by Mongoose. */
function getClassInfo(classId: unknown): ClassWithId | null {
  if (typeof classId === "object" && classId !== null && "className" in classId) {
    return classId as ClassWithId;
  }
  return null;
}

/**
 * Admin-side wrapper that fetches the student's marks and renders the shared
 * `ResultCardView` (the same layout used by the public `/` page and the
 * printable PDF). Keeping the layout in one component means visual changes
 * only need to be made in `ResultCardView` and they apply everywhere.
 */
export default function ResultCardModal({ open, onClose, student }: ResultCardModalProps) {
  const classIdStr = student ? getClassId(student.classId) : "";
  const studentId = student?._id ?? "";
  const { data: marksData, isLoading, isError } = useGetMarks(studentId, classIdStr);

  if (!student) {
    return null;
  }

  const classInfo: ClassWithId | null = getClassInfo(student.classId);
  const courseMarks = marksData?.courseMarks ?? [];

  return (
    <Modal open={open} onClose={onClose} title="طالب علم کا رزلٹ کارڈ" maxWidth="max-w-4xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="me-3 text-gray-500">نتائج لوڈ ہو رہے ہیں...</span>
        </div>
      ) : isError ? (
        <div className="py-12 text-center">
          <p className="text-red-600 font-medium">نتائج لوڈ نہیں ہو سکے</p>
          <p className="text-sm text-gray-500 mt-1">دوبارہ کوشش کریں</p>
        </div>
      ) : (
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
      )}
    </Modal>
  );
}
